"""Monthly Expense Forecaster for Personal Finance AI.

This module implements a time-series based expense forecasting model using XGBoost.
It predicts future monthly expenses based on historical spending patterns and other
financial features.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List, Tuple, Union
from datetime import datetime, timedelta
import logging

import xgboost as xgb
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

from .base_model import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExpenseForecaster(BaseModel):
    """Monthly Expense Forecasting Model using XGBoost.
    
    This model predicts future monthly expenses based on historical spending patterns,
    income, and other financial features. It handles both time-series and feature-based
    forecasting.
    """
    
    def __init__(
        self,
        target_column: str = 'monthly_expenses',
        date_column: str = 'date',
        group_column: str = 'user_id',
        time_features: List[str] = None,
        model_params: Optional[Dict[str, Any]] = None,
        forecast_horizon: int = 3,
        lookback_periods: int = 12,
        random_state: int = 42
    ):
        """Initialize the expense forecaster.
        
        Args:
            target_column: Name of the target variable column
            date_column: Name of the date column
            group_column: Name of the column to group by (e.g., user_id)
            time_features: List of time-based features to generate
            model_params: Parameters for the XGBoost model
            forecast_horizon: Number of months to forecast ahead
            lookback_periods: Number of historical periods to use for features
            random_state: Random seed for reproducibility
        """
        # Enhanced default parameters for better performance
        default_params = {
            'n_estimators': 500,  # Increased for better learning
            'max_depth': 8,       # Deeper trees for complex patterns
            'learning_rate': 0.05, # Lower learning rate for better generalization
            'subsample': 0.8,     # Slightly lower to prevent overfitting
            'colsample_bytree': 0.8,
            'min_child_weight': 2, # Helps prevent overfitting
            'gamma': 0.1,         # Regularization parameter
            'reg_alpha': 0.1,     # L1 regularization
            'reg_lambda': 1.0,    # L2 regularization
            'random_state': random_state,
            'objective': 'reg:squarederror',
            'eval_metric': ['rmse', 'mae'],
            'early_stopping_rounds': 50,
            'tree_method': 'hist',  # Faster training
            'enable_categorical': True  # Handle categorical features natively
        }
        
        # Update with any user-provided parameters
        if model_params:
            default_params.update(model_params)
        
        super().__init__(model_params=default_params)
        
        # Model configuration
        self.target_column = target_column
        self.date_column = date_column
        self.group_column = group_column
        self.forecast_horizon = forecast_horizon
        self.lookback_periods = lookback_periods
        self.random_state = random_state
        
        # Enhanced time features with cyclical encoding
        self.time_features = time_features or [
            'month', 'quarter', 'year', 'days_in_month', 'day_of_week',
            'day_of_year', 'week_of_year', 'is_month_start', 'is_month_end',
            'is_quarter_start', 'is_quarter_end', 'is_year_start', 'is_year_end',
            'is_weekend', 'is_holiday'  # Will be calculated during feature engineering
        ]
        
        # Additional feature engineering parameters
        self.rolling_windows = [3, 6, 12]  # For rolling statistics
        self.lag_periods = [1, 2, 3, 6, 12]  # For lag features
        self.interaction_terms = [
            ('month', 'is_weekend'),
            ('quarter', 'is_holiday')
        ]  # For interaction features
        
        # Initialize feature processor and model
        self.feature_processor = None
        self.scaler = StandardScaler()
        self.categorical_features = ['month', 'quarter', 'day_of_week', 'is_weekend', 'is_holiday']
        self.numerical_features = ['days_in_month', 'day_of_year', 'week_of_year']
        self.feature_names_ = []
        self.holidays = self._get_holidays()  # For holiday features
        
        # Store the rolling window size for consistent feature engineering
        self.rolling_window = max(2, min(self.lookback_periods, 6))  # Cap at 6 months for stability
        
    def _create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features from the date column.
        
        Args:
            df: Input DataFrame with a date column
            
        Returns:
            DataFrame with added time-based features
        """
        # Make a copy to avoid modifying the original DataFrame
        df = df.copy()
        
        # Convert date column to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(df[self.date_column]):
            df[self.date_column] = pd.to_datetime(df[self.date_column])
        
        # Create time-based features
        time_features = {
            'month': lambda x: x.dt.month,
            'quarter': lambda x: x.dt.quarter,
            'year': lambda x: x.dt.year,
            'dayofweek': lambda x: x.dt.dayofweek,
            'dayofyear': lambda x: x.dt.dayofyear,
            'days_in_month': lambda x: x.dt.days_in_month,
            'is_month_start': lambda x: x.dt.is_month_start.astype(int),
            'is_month_end': lambda x: x.dt.is_month_end.astype(int),
            'is_quarter_start': lambda x: x.dt.is_quarter_start.astype(int),
            'is_quarter_end': lambda x: x.dt.is_quarter_end.astype(int),
            'is_year_start': lambda x: x.dt.is_year_start.astype(int),
            'is_year_end': lambda x: x.dt.is_year_end.astype(int)
        }
        
        # Only create the time features that were specified
        for feature in self.time_features:
            if feature in time_features:
                df[feature] = time_features[feature](df[self.date_column])
                # Add to numerical features if not already present
                if feature not in self.numerical_features:
                    self.numerical_features.append(feature)
        
        return df
        
    def _get_holidays(self, years=None):
        """Get holiday dates for the given years."""
        from pandas.tseries.holiday import USFederalHolidayCalendar
        
        if years is None:
            years = range(2010, 2031)  # Default range
            
        cal = USFederalHolidayCalendar()
        holidays = cal.holidays(start=f'{min(years)}-01-01', 
                              end=f'{max(years)}-12-31')
        return set(holidays.date)
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create enhanced time-based and statistical features."""
        df = df.copy()
        
        # Ensure date column is datetime
        if not pd.api.types.is_datetime64_any_dtype(df[self.date_column]):
            df[self.date_column] = pd.to_datetime(df[self.date_column])
        
        # Basic time features
        df['month'] = df[self.date_column].dt.month
        df['quarter'] = df[self.date_column].dt.quarter
        df['year'] = df[self.date_column].dt.year
        df['day_of_month'] = df[self.date_column].dt.day
        df['day_of_week'] = df[self.date_column].dt.dayofweek
        df['day_of_year'] = df[self.date_column].dt.dayofyear
        df['week_of_year'] = df[self.date_column].dt.isocalendar().week
        df['days_in_month'] = df[self.date_column].dt.days_in_month
        
        # Boolean features
        df['is_month_start'] = df[self.date_column].dt.is_month_start.astype(int)
        df['is_month_end'] = df[self.date_column].dt.is_month_end.astype(int)
        df['is_quarter_start'] = df[self.date_column].dt.is_quarter_start.astype(int)
        df['is_quarter_end'] = df[self.date_column].dt.is_quarter_end.astype(int)
        df['is_year_start'] = df[self.date_column].dt.is_year_start.astype(int)
        df['is_year_end'] = df[self.date_column].dt.is_year_end.astype(int)
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Holiday features
        if not hasattr(self, 'holidays'):
            self.holidays = self._get_holidays()
            
        df['date_only'] = df[self.date_column].dt.date
        df['is_holiday'] = df['date_only'].isin(self.holidays).astype(int)
        df.drop('date_only', axis=1, inplace=True)
        
        # Cyclical encoding for periodic features
        def encode_cyclical(df, col, max_vals):
            df[f'{col}_sin'] = np.sin(2 * np.pi * df[col]/max_vals)
            df[f'{col}_cos'] = np.cos(2 * np.pi * df[col]/max_vals)
            return df
        
        # Apply cyclical encoding to periodic features
        cyclical_features = {
            'month': 12,
            'day_of_week': 7,
            'day_of_year': 365,
            'week_of_year': 52
        }
        
        for feature, max_val in cyclical_features.items():
            if feature in df.columns:
                df = encode_cyclical(df, feature, max_val)
        
        # Sort by date for time-series operations
        df = df.sort_values(by=[self.group_column, self.date_column])
        
        # Add lag features
        for lag in self.lag_periods:
            df[f'lag_{lag}'] = df.groupby(self.group_column)[self.target_column].shift(lag)
        
        # Add rolling statistics
        for window in self.rolling_windows:
            df[f'rolling_mean_{window}'] = df.groupby(self.group_column)[self.target_column].transform(
                lambda x: x.shift(1).rolling(window=window, min_periods=1).mean()
            )
            df[f'rolling_std_{window}'] = df.groupby(self.group_column)[self.target_column].transform(
                lambda x: x.shift(1).rolling(window=window, min_periods=1).std()
            )
        
        # Add interaction features
        for feat1, feat2 in self.interaction_terms:
            if feat1 in df.columns and feat2 in df.columns:
                df[f'{feat1}_x_{feat2}'] = df[feat1].astype(str) + '_' + df[feat2].astype(str)
        
        # Add time since last transaction
        df['days_since_last'] = df.groupby(self.group_column)[self.date_column].diff().dt.days
        
        # Add month-over-month and year-over-year changes
        df['mom_change'] = df.groupby(self.group_column)[self.target_column].pct_change(periods=1)
        df['yoy_change'] = df.groupby(self.group_column)[self.target_column].pct_change(periods=12)
        
        # Add moving averages
        for window in [3, 6, 12]:
            df[f'sma_{window}'] = df.groupby(self.group_column)[self.target_column].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
        
        # Add exponential moving averages
        for span in [3, 6, 12]:
            df[f'ema_{span}'] = df.groupby(self.group_column)[self.target_column].transform(
                lambda x: x.ewm(span=span, adjust=False).mean()
            )
        
        return df
    
    def _create_lag_features(self, df: pd.DataFrame, group_col: str = None) -> pd.DataFrame:
        """Create lagged features for time series forecasting."""
        if df.empty:
            return df
            
        df = df.copy()
        
        # If date column is not available, we can't sort by it
        if self.date_column not in df.columns:
            # If we have a group column, just sort by that
            if group_col and group_col in df.columns:
                df = df.sort_values(group_col)
            
            # Create lagged features for the target variable
            for lag in range(1, self.lookback_periods + 1):
                if group_col and group_col in df.columns:
                    df[f'{self.target_column}_lag_{lag}'] = df.groupby(group_col)[self.target_column].shift(lag)
                else:
                    df[f'{self.target_column}_lag_{lag}'] = df[self.target_column].shift(lag)
                self.numerical_features.append(f'{self.target_column}_lag_{lag}')
        else:
            # Sort by date within each group if group_col is provided
            if group_col and group_col in df.columns:
                df = df.sort_values([group_col, self.date_column])
                
                # Create lagged features for the target variable
                for lag in range(1, self.lookback_periods + 1):
                    df[f'{self.target_column}_lag_{lag}'] = df.groupby(group_col)[self.target_column].shift(lag)
                    self.numerical_features.append(f'{self.target_column}_lag_{lag}')
            else:
                # If no group column, just sort by date
                df = df.sort_values(self.date_column)
                
                # Create lagged features for the target variable
                for lag in range(1, self.lookback_periods + 1):
                    df[f'{self.target_column}_lag_{lag}'] = df[self.target_column].shift(lag)
                    self.numerical_features.append(f'{self.target_column}_lag_{lag}')
        
        return df
    
    def _create_rolling_features(self, df: pd.DataFrame, group_col: str = None) -> pd.DataFrame:
        """Create rolling window features for time series forecasting.
        
        Uses the stored rolling_window value to ensure consistency between training and prediction.
        """
        if df.empty or self.target_column not in df.columns:
            return df
            
        df = df.copy()
        
        # Skip if we don't have enough data for rolling features
        if len(df) < self.rolling_window:
            return df
            
        # Determine sorting columns - use date if available, otherwise group_col if available
        sort_cols = []
        if self.date_column in df.columns:
            sort_cols.append(self.date_column)
        if group_col and group_col in df.columns:
            sort_cols.insert(0, group_col)  # Group should be first for groupby
            
        # Sort if we have any sort columns
        if sort_cols:
            df = df.sort_values(sort_cols)
            
        # Create rolling features for the target variable
        if group_col and group_col in df.columns:
            # Grouped rolling features
            for window in [self.rolling_window, self.rolling_window * 2]:
                if len(df) >= window:
                    df[f'{self.target_column}_rolling_mean_{window}'] = df.groupby(group_col)[self.target_column].transform(
                        lambda x: x.shift(1).rolling(window=min(window, len(x)), min_periods=1).mean()
                    )
                    df[f'{self.target_column}_rolling_std_{window}'] = df.groupby(group_col)[self.target_column].transform(
                        lambda x: x.shift(1).rolling(window=min(window, len(x)), min_periods=1).std()
                    )
                    self.numerical_features.extend([
                        f'{self.target_column}_rolling_mean_{window}',
                        f'{self.target_column}_rolling_std_{window}'
                    ])
        else:
            # Simple rolling features without grouping
            for window in [self.rolling_window, self.rolling_window * 2]:
                if len(df) >= window:
                    df[f'{self.target_column}_rolling_mean_{window}'] = df[self.target_column].shift(1).rolling(
                        window=window, min_periods=1
                    ).mean()
                    df[f'{self.target_column}_rolling_std_{window}'] = df[self.target_column].shift(1).rolling(
                        window=window, min_periods=1
                    ).std()
                    self.numerical_features.extend([
                        f'{self.target_column}_rolling_mean_{window}',
                        f'{self.target_column}_rolling_std_{window}'
                    ])
        
        return df
    
    def _detect_categorical_columns(self, df: pd.DataFrame) -> List[str]:
        """Detect and return names of categorical columns in the DataFrame.
        
        Args:
            df: Input DataFrame
            
        Returns:
            List of column names that are categorical
        """
        categorical_cols = []
        
        # Check each column's data type
        for col in df.columns:
            # Skip target, date, and group columns
            if col in [self.target_column, self.date_column, self.group_column]:
                continue
                
            # Check if column is object type or has low cardinality
            if pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]) or df[col].nunique() < 20:
                categorical_cols.append(col)
                
        return categorical_cols
        
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataframe.
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataFrame with missing values handled
        """
        df = df.copy()
        
        # Handle numerical features
        for col in df.select_dtypes(include=['number']).columns:
            if df[col].isnull().any():
                if hasattr(self, 'numerical_columns') and col in self.numerical_columns:
                    # For numerical features, fill with median
                    df[col].fillna(df[col].median(), inplace=True)
                elif hasattr(self, 'categorical_columns') and col in self.categorical_columns:
                    # For categorical features, fill with mode
                    df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 0, inplace=True)
        
        # Handle object/string columns (categorical)
        for col in df.select_dtypes(include=['object', 'category']).columns:
            if df[col].isnull().any():
                # Fill with mode or 'missing' if mode is not available
                if len(df[col].mode()) > 0:
                    df[col].fillna(df[col].mode()[0], inplace=True)
                else:
                    df[col].fillna('missing', inplace=True)
        
        return df
    
    def preprocess_data(
        self,
        data: pd.DataFrame,
        training: bool = False,
        y: np.ndarray = None
    ) -> Tuple[pd.DataFrame, Optional[np.ndarray]]:
        """Preprocess the input data for training or prediction.
        
        Args:
            data: Input DataFrame
            training: Whether this is training data (needs target variable)
            y: Target values (optional, can be included in data)
                
        Returns:
            Tuple of (features, target) where target is None for prediction
        """
        # Make a copy to avoid modifying the original data
        df = data.copy()
        
        # Ensure date column is datetime
        if self.date_column in df.columns and not pd.api.types.is_datetime64_any_dtype(df[self.date_column]):
            df[self.date_column] = pd.to_datetime(df[self.date_column])
        
        # Sort by date and group if group column exists
        if self.group_column in df.columns:
            df = df.sort_values([self.group_column, self.date_column])
        elif self.date_column in df.columns:
            df = df.sort_values(self.date_column)
        
        # Create time-based features
        if self.date_column in df.columns:
            df = self._create_time_features(df)
        
        # Detect categorical columns if this is the first time (training)
        if training:
            # Get all non-numeric columns that aren't the target, date, or group columns
            non_numeric_cols = df.select_dtypes(exclude=['number']).columns.tolist()
            potential_categorical = [
                col for col in non_numeric_cols 
                if col not in [self.target_column, self.date_column, self.group_column]
            ]
            
            # Also consider low-cardinality numeric columns as categorical
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            low_cardinality_numeric = [
                col for col in numeric_cols 
                if col != self.target_column and df[col].nunique() < 10
            ]
            
            self.categorical_columns = potential_categorical + low_cardinality_numeric
            self.numerical_columns = [
                col for col in numeric_cols 
                if col != self.target_column and col not in self.categorical_columns
            ]
            
            # Convert categorical columns to string type to ensure consistent encoding
            for col in self.categorical_columns:
                if col in df.columns:
                    df[col] = df[col].astype(str)
        
        # If this is training or we have the target column, create lagged features
        if training or (hasattr(self, 'target_column') and self.target_column in df.columns):
            df = self._create_lag_features(df, self.group_column if self.group_column in df.columns else None)
            df = self._create_rolling_features(df, self.group_column if self.group_column in df.columns else None)
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # For training, we need to process the target variable
        if training and y is not None:
            df[self.target_column] = y
        
        # One-hot encode categorical columns if they exist
        if hasattr(self, 'categorical_columns') and self.categorical_columns:
            # Only keep categorical columns that exist in the dataframe
            valid_cat_cols = [col for col in self.categorical_columns if col in df.columns]
            if valid_cat_cols:
                # Convert categorical columns to string type if they're not already
                for col in valid_cat_cols:
                    df[col] = df[col].astype(str)
                
                # Use get_dummies with the columns parameter to ensure consistent encoding
                dummies = pd.get_dummies(df[valid_cat_cols], prefix_sep='_')
                
                # Store the one-hot encoded columns during training
                if training:
                    self.one_hot_columns_ = dummies.columns.tolist()
                
                # Add dummies to the dataframe and drop original columns
                df = pd.concat([df.drop(columns=valid_cat_cols), dummies], axis=1)
                
                # During prediction, ensure all one-hot encoded columns from training are present
                if not training and hasattr(self, 'one_hot_columns_'):
                    # Add missing one-hot columns with zeros
                    missing_cols = set(self.one_hot_columns_) - set(df.columns)
                    for col in missing_cols:
                        df[col] = 0
                    
                    # Ensure columns are in the same order as during training
                    df = df[self.one_hot_columns_ + 
                           [c for c in df.columns if c not in self.one_hot_columns_]]
        
        # For training, return both X and y
        if training or (hasattr(self, 'target_column') and self.target_column in df.columns):
            # Ensure we have the target column
            if self.target_column not in df.columns and y is not None:
                df[self.target_column] = y
                
            # Drop any non-feature columns
            drop_cols = [col for col in [self.target_column, self.date_column, self.group_column] if col in df.columns]
            X = df.drop(columns=drop_cols) if drop_cols else df.copy()
            
            # Ensure all columns are numeric
            for col in X.select_dtypes(include=['object', 'category']).columns:
                X[col] = pd.to_numeric(X[col], errors='coerce')
            
            # Fill any remaining NaNs that might have been introduced
            X = X.fillna(0)
            
            # Store feature names and order for prediction time
            if training:
                self.feature_names_ = X.columns.tolist()
                # Store the exact feature order from training
                self.expected_feature_order_ = X.columns.tolist()
            else:
                # Ensure the same feature order as during training
                if hasattr(self, 'expected_feature_order_'):
                    X = X.reindex(columns=self.expected_feature_order_, fill_value=0)
        
            return X, df[self.target_column].values if self.target_column in df.columns else None
            
        # For prediction, just return X
        else:
            # Drop any non-feature columns
            drop_cols = [col for col in [self.date_column, self.group_column] if col in df.columns]
            X = df.drop(columns=drop_cols) if drop_cols else df.copy()
            
            # Ensure all columns are numeric
            for col in X.select_dtypes(include=['object', 'category']).columns:
                X[col] = pd.to_numeric(X[col], errors='coerce')
            
            # Fill any remaining NaNs that might have been introduced
            X = X.fillna(0)
            
            # Ensure we have all the expected features in the right order
            if hasattr(self, 'expected_feature_order_'):
                # Add missing columns with zeros
                missing_cols = set(self.expected_feature_order_) - set(X.columns)
                for col in missing_cols:
                    X[col] = 0
                
                # Reorder columns to match training data
                X = X[self.expected_feature_order_]
            
            return X, None

    
        # For training, return both X and y
        if training or (hasattr(self, 'target_column') and self.target_column in df.columns):
            # Ensure we have the target column
            if self.target_column not in df.columns and y is not None:
                df[self.target_column] = y
                
            # Drop any non-feature columns
            drop_cols = [col for col in [self.target_column, self.date_column, self.group_column] if col in df.columns]
            X = df.drop(columns=drop_cols) if drop_cols else df.copy()
            
            # Ensure all columns are numeric
            for col in X.select_dtypes(include=['object', 'category']).columns:
                X[col] = pd.to_numeric(X[col], errors='coerce')
            
            # Fill any remaining NaNs that might have been introduced
            X = X.fillna(0)
            
            # Store feature names and order for prediction time
            if training:
                self.feature_names_ = X.columns.tolist()
                # Store the exact feature order from training
                self.expected_feature_order_ = X.columns.tolist()
            else:
                # Ensure the same feature order as during training
                if hasattr(self, 'expected_feature_order_'):
                    X = X.reindex(columns=self.expected_feature_order_, fill_value=0)
            
            return X, df[self.target_column].values if self.target_column in df.columns else (X, None)
            
        # For prediction, just return X
        else:
            # Drop any non-feature columns
            drop_cols = [col for col in [self.date_column, self.group_column] if col in df.columns]
            X = df.drop(columns=drop_cols) if drop_cols else df.copy()
            
            # Ensure all columns are numeric
            for col in X.select_dtypes(include=['object', 'category']).columns:
                X[col] = pd.to_numeric(X[col], errors='coerce')
            
            # Fill any remaining NaNs that might have been introduced
            X = X.fillna(0)
            
            # Ensure we have all the expected features in the right order
            if hasattr(self, 'expected_feature_order_'):
                # Add missing columns with zeros
                missing_cols = set(self.expected_feature_order_) - set(X.columns)
                for col in missing_cols:
                    X[col] = 0
                
                # Reorder columns to match training data
                X = X[self.expected_feature_order_]
            
            return X, None

    def build_model(self):
        """Build the XGBoost regressor model with the specified parameters."""
        self.model = xgb.XGBRegressor(**self.model_params)
        return self.model

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None, 
             eval_set: Optional[List[tuple]] = None, eval_metric: Optional[Union[str, List[str]]] = None,
             early_stopping_rounds: Optional[int] = None, verbose: bool = True, **kwargs):
        """Fit the model to the training data with support for early stopping and evaluation.
        
        Args:
            X: Training data with features
            y: Target values (optional, can be included in X)
            eval_set: List of (X, y) tuples to use as validation sets
            eval_metric: Metric to use for early stopping
            early_stopping_rounds: Number of rounds to wait before early stopping
            verbose: Whether to print progress
            **kwargs: Additional arguments to pass to XGBoost
        """
        # If y is not provided, try to get it from X
        if y is None and self.target_column in X.columns:
            y = X[self.target_column]
            X = X.drop(columns=[self.target_column])
        
        # Create features
        X_processed = self.preprocess_data(X, training=True, y=y)
        
        # Prepare evaluation set if provided
        eval_data = None
        if eval_set is not None:
            eval_data = [
                (self.preprocess_data(X_eval, training=False), y_eval)
                for X_eval, y_eval in eval_set
            ]
        
        # Set up callbacks
        callbacks = []
        if early_stopping_rounds is not None and eval_data is not None:
            callbacks.append(
                xgb.callback.EarlyStopping(
                    rounds=early_stopping_rounds,
                    save_best=True
                )
            )
        
        # Train the model with progress tracking
        self.model = xgb.XGBRegressor(**self.model_params)
        
        fit_params = {
            'eval_set': eval_data,
            'eval_metric': eval_metric or self.model_params.get('eval_metric', 'rmse'),
            'verbose': verbose,
            'callbacks': callbacks,
            **kwargs
        }
        def _mean_absolute_percentage_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
            """Calculate Mean Absolute Percentage Error (MAPE)."""
            y_true, y_pred = np.array(y_true), np.array(y_pred)
            # Avoid division by zero
            mask = y_true != 0
            if np.sum(mask) == 0:
                return float('inf')
            return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
        
    def get_feature_importances(self) -> Dict[str, float]:
        """Get feature importances from the trained model."""
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet. Call train() first.")
        
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            
            # If we have feature names, use them; otherwise use indices
            if hasattr(self, 'feature_names_') and self.feature_names_:
                return dict(zip(self.feature_names_, importances))
            else:
                return {f'feature_{i}': imp for i, imp in enumerate(importances)}
        else:
            logger.warning("Feature importances not available for this model type.")
            return {}
    
    def load_model(self, model_path: str) -> 'ExpenseForecaster':
        """Load a trained model from disk.
        
        Args:
            model_path: Path to the directory containing the saved model files
            
        Returns:
            self: The loaded model instance
        """
        try:
            # Convert model_path to string if it's a Path object
            model_path_str = str(model_path)
            
            # Load the model using the existing load method
            model_name = os.path.basename(model_path_str.rstrip('/\\'))
            model_dir = os.path.dirname(model_path_str)
            loaded_model = self.__class__.load(model_dir, model_name)
            
            # Copy the loaded attributes to the current instance
            for attr in ['model', 'training_date', 'model_params', 'metrics', 
                        'target_column', 'date_column', 'group_column', 
                        'forecast_horizon', 'lookback_periods', 'time_features',
                        'feature_names_', 'categorical_features', 'numerical_features']:
                if hasattr(loaded_model, attr):
                    setattr(self, attr, getattr(loaded_model, attr))
            
            self.is_trained = True
            logger.info(f"Model loaded successfully from {model_path}")
            return self
            
        except Exception as e:
            logger.error(f"Error loading model from {model_path}: {str(e)}")
            raise
    
    def save(self, model_dir: str, model_name: str = 'expense_forecaster') -> None:
        """Save the model and related artifacts.
        
        Args:
            model_dir: Directory to save the model
            model_name: Base name for the model files
        """
        # Create directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)
        
        # Prepare metadata
        metadata = {
            'model_name': model_name,
            'model_type': self.__class__.__name__,
            'training_date': self.training_date,
            'model_params': self.model_params,
            'metrics': self.metrics,
            'target_column': self.target_column,
            'date_column': self.date_column,
            'group_column': self.group_column,
            'forecast_horizon': self.forecast_horizon,
            'lookback_periods': self.lookback_periods,
            'time_features': self.time_features,
            'feature_names': self.feature_names_,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'random_state': self.random_state
        }
        
        # Save the model and metadata
        joblib.dump(self.model, os.path.join(model_dir, f"{model_name}.joblib"))
        with open(os.path.join(model_dir, f"{model_name}_metadata.json"), 'w') as f:
            json.dump(metadata, f, indent=4)
        
        logger.info(f"Model saved to {os.path.join(model_dir, model_name)}.joblib")
    
    @classmethod
    def load(cls, model_dir: str, model_name: str = 'expense_forecaster') -> 'ExpenseForecaster':
        """Load a saved model from disk.
        
        Args:
            model_dir: Directory containing the saved model
            model_name: Base name of the model files
            
        Returns:
            Loaded ExpenseForecaster instance
        """
        # Load metadata
        with open(os.path.join(model_dir, f"{model_name}_metadata.json"), 'r') as f:
            metadata = json.load(f)
        
        # Create model instance with saved parameters
        model = cls(
            target_column=metadata.get('target_column', 'monthly_expenses'),
            date_column=metadata.get('date_column', 'date'),
            group_column=metadata.get('group_column', 'user_id'),
            time_features=metadata.get('time_features'),
            model_params=metadata.get('model_params', {}),
            forecast_horizon=metadata.get('forecast_horizon', 3),
            lookback_periods=metadata.get('lookback_periods', 12),
            random_state=metadata.get('random_state', 42)
        )
        
        # Load the model
        model.model = joblib.load(os.path.join(model_dir, f"{model_name}.joblib"))
        
        # Restore other attributes
        model.training_date = metadata.get('training_date')
        model.metrics = metadata.get('metrics', {})
        model.feature_names_ = metadata.get('feature_names', [])
        model.categorical_features = metadata.get('categorical_features', [])
        model.numerical_features = metadata.get('numerical_features', [])
        model.is_trained = True
        
        logger.info(f"Model loaded from {os.path.join(model_dir, model_name)}.joblib")
        return model
    
    def plot_forecast(
        self,
        historical_data: pd.DataFrame,
        forecast_periods: int = 12,
        group_id: Any = None,
        figsize: Tuple[int, int] = (12, 6)
    ) -> 'matplotlib.figure.Figure':
        """Plot historical data and forecasted values.
        
        Args:
            historical_data: Historical data to plot
            forecast_periods: Number of periods to forecast
            group_id: Group identifier (if using grouped forecasting)
            figsize: Figure size (width, height)
            
        Returns:
            Matplotlib figure object
        """
        try:
            import matplotlib.pyplot as plt
            import seaborn as sns
        except ImportError:
            logger.warning("Matplotlib/Seaborn not available. Cannot generate forecast plot.")
            return None
        
        # Generate forecast
        forecast = self.forecast_future(
            historical_data,
            periods=forecast_periods,
            group_id=group_id
        )
        
        # Prepare data for plotting
        hist_df = historical_data.copy()
        hist_df['type'] = 'Historical'
        
        forecast_df = forecast.copy()
        forecast_df = forecast_df.rename(columns={
            'predicted_' + self.target_column: self.target_column
        })
        forecast_df['type'] = 'Forecast'
        
        # Combine historical and forecast data
        plot_df = pd.concat([
            hist_df[[self.date_column, self.target_column, 'type']],
            forecast_df[[self.date_column, self.target_column, 'type']]
        ])
        
        # Create plot
        plt.figure(figsize=figsize)
        
        # Plot historical data
        sns.lineplot(
            data=hist_df,
            x=self.date_column,
            y=self.target_column,
            label='Historical',
            color='blue'
        )
        
        # Plot forecast
        sns.lineplot(
            data=forecast_df,
            x=self.date_column,
            y=self.target_column,
            label='Forecast',
            color='red',
            linestyle='--'
        )
        
        # Add confidence interval (if available)
        if 'prediction_interval_lower' in forecast_df.columns and 'prediction_interval_upper' in forecast_df.columns:
            plt.fill_between(
                forecast_df[self.date_column],
                forecast_df['prediction_interval_lower'],
                forecast_df['prediction_interval_upper'],
                color='red',
                alpha=0.2,
                label='Prediction Interval'
            )
        
        # Customize plot
        plt.title('Expense Forecast')
        plt.xlabel('Date')
        plt.ylabel('Expense Amount')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        return plt.gcf()


def train_expense_forecaster(
    data_path: str,
    target_column: str = 'monthly_expenses',
    date_column: str = 'date',
    group_column: str = 'user_id',
    model_dir: str = 'models/expense_forecaster',
    model_name: str = 'expense_forecaster',
    test_size: float = 0.2,
    random_state: int = 42
) -> ExpenseForecaster:
    """Convenience function to train and save an expense forecaster.
    
    Args:
        data_path: Path to the training data CSV file
        target_column: Name of the target column
        date_column: Name of the date column
        group_column: Name of the group column (e.g., user_id)
        model_dir: Directory to save the trained model
        model_name: Base name for the model files
        test_size: Proportion of data to use for testing
        random_state: Random seed for reproducibility
        
    Returns:
        Trained ExpenseForecaster instance
    """
    # Load data
    data = pd.read_csv(data_path)
    
    # Convert date column to datetime
    data[date_column] = pd.to_datetime(data[date_column])
    
    # Sort by date and group
    data = data.sort_values([group_column, date_column])
    
    # Initialize the model
    model = ExpenseForecaster(
        target_column=target_column,
        date_column=date_column,
        group_column=group_column,
        random_state=random_state
    )
    
    # Split data into train and test sets
    # For time series, we'll use the most recent data as test set
    if group_column in data.columns:
        # For grouped data, we need to ensure we split by time within each group
        train_data = data.groupby(group_column).apply(
            lambda x: x.iloc[:int(len(x) * (1 - test_size))]
        ).reset_index(drop=True)
        
        test_data = data.groupby(group_column).apply(
            lambda x: x.iloc[int(len(x) * (1 - test_size)):]
        ).reset_index(drop=True)
    else:
        # For non-grouped data, just split by time
        train_data = data.iloc[:int(len(data) * (1 - test_size))]
        test_data = data.iloc[int(len(data) * (1 - test_size)):]
    
    # Train the model
    model.train(
        train_data,
        validation_data=(
            test_data.drop(columns=[target_column]),
            test_data[target_column]
        ) if not test_data.empty else None
    )
    
    # Save the model
    model.save(model_dir, model_name)
    
    return model
