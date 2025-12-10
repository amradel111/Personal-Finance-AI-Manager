"""Financial Health Classifier for Personal Finance AI.

This module implements a classifier that predicts financial health status based on
user financial data. It inherits from BaseModel and provides specific functionality
for financial health assessment.
"""

import os
import json
import joblib
import logging
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional, Union, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from ml_model.base_model import BaseModel

class FinancialHealthClassifier(BaseModel):
    """Financial Health Classifier for predicting financial health status.
    
    This classifier predicts financial health status (Poor, Fair, Good, Excellent)
    based on user financial metrics and personal information.
    """
    
    # Define financial health categories
    HEALTH_CATEGORIES = ['Poor', 'Fair', 'Good', 'Excellent']
    
    def __init__(
        self, 
        model_params: Optional[Dict[str, Any]] = None,
        random_state: int = 42,
        test_size: float = 0.2
    ):
        """Initialize the financial health classifier.
        
        Args:
            model_params: Parameters for the underlying classifier
            random_state: Random seed for reproducibility
            test_size: Proportion of data to use for testing
        """
        # Set default parameters if none provided
        default_params = {
            'n_estimators': 100,
            'max_depth': None,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'class_weight': 'balanced',
            'random_state': random_state
        }
        
        # Update with any user-provided parameters
        if model_params:
            default_params.update(model_params)
        
        super().__init__(model_params=default_params)
        self.random_state = random_state
        self.test_size = test_size
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.encoder = None
        self.numerical_features = []
        self.categorical_features = []
        self.target_column = None
        self.feature_processor = None
        self.feature_columns = None
    
    def _detect_feature_types(self, X: pd.DataFrame) -> None:
        """Detect numerical and categorical features from the input data."""
        self.numerical_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
        self.categorical_features = X.select_dtypes(include=['object', 'bool']).columns.tolist()
        
        # Remove target column if it's in the features
        if hasattr(self, 'target_column') and self.target_column:
            if self.target_column in self.numerical_features:
                self.numerical_features.remove(self.target_column)
            if self.target_column in self.categorical_features:
                self.categorical_features.remove(self.target_column)
    
    def build_model(self) -> None:
        """Build the model pipeline with preprocessing and classifier."""
        if not hasattr(self, 'numerical_features') or not hasattr(self, 'categorical_features'):
            raise ValueError("Feature types not detected. Call _detect_feature_types first.")
            
        # Define preprocessing for numerical and categorical features
        transformers = []
        
        if self.numerical_features:
            transformers.append(('num', StandardScaler(), self.numerical_features))
        if self.categorical_features:
            transformers.append(('cat', 'passthrough', self.categorical_features))
        
        # Create preprocessor
        self.feature_processor = ColumnTransformer(
            transformers=transformers,
            remainder='drop'  # Drop any other columns not explicitly specified
        )
        
        # Create pipeline for classification
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.pipeline import Pipeline
        
        # Ensure class_weight is set for classification
        model_params = self.model_params.copy()
        if 'class_weight' not in model_params:
            model_params['class_weight'] = 'balanced'
            
        self.model = Pipeline([
            ('preprocessor', self.feature_processor),
            ('classifier', RandomForestClassifier(**model_params))
        ])
        
        # Mark model as built
        self.is_trained = False
    
    def preprocess_data(
        self, 
        data: pd.DataFrame,
        target_column: str = 'financial_health_score',
        training: bool = False
    ) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """Preprocess the input data for training or prediction.
        
        Args:
            data: Input DataFrame with financial data
            target_column: Name of the target column
            training: Whether this is training data (needs target encoding)
            
        Returns:
            Tuple of (features, target) where target is None for prediction
        """
        # Make a copy to avoid modifying the original data
        data = data.copy()
        
        # Handle missing values
        data = self._handle_missing_values(data)
        
        # Convert all features to numeric, coercing errors to NaN
        for col in data.select_dtypes(include=['object', 'bool']).columns:
            if col != target_column:  # Don't convert the target column here
                # Try to convert to numeric, non-numeric will become NaN
                data[col] = pd.to_numeric(data[col], errors='coerce')
        
        # Fill any remaining NaN values with column means for numerical features
        for col in data.select_dtypes(include=['number']).columns:
            if data[col].isnull().any():
                data[col].fillna(data[col].mean(), inplace=True)
        
        # Extract features and target
        if training and target_column in data.columns:
            X = data.drop(columns=[target_column])
            y = data[target_column].astype(float)  # Ensure target is float
            return X, y
        else:
            return data, None
    
    def _handle_missing_values(self, data: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset."""
        # For numerical features, fill with median
        for col in self.numerical_features:
            if col in data.columns and data[col].isnull().any():
                data[col].fillna(data[col].median(), inplace=True)
        
        # For categorical features, fill with mode
        for col in self.categorical_features:
            if col in data.columns and data[col].isnull().any():
                data[col].fillna(data[col].mode()[0], inplace=True)
        
        return data
    
    def train(
        self, 
        X: pd.DataFrame, 
        y: Optional[Union[pd.Series, np.ndarray]] = None,
        validation_data: Optional[Tuple] = None,
        **fit_params
    ) -> Dict[str, Any]:
        """Train the financial health regressor.
        
        Args:
            X: Training features or full DataFrame if y is None
            y: Training target (optional, can be included in X)
            validation_data: Optional tuple of (X_val, y_val) for validation
            **fit_params: Additional parameters to pass to the model's fit method
            
        Returns:
            Dictionary containing training metrics
        """
        print("\n=== Starting Model Training ===")
        print(f"Input data shape: {X.shape}")
        
        # If y is None, assume X contains both features and target
        if y is None:
            if 'target' in X.columns:
                y = X['target']
                X = X.drop('target', axis=1)
                print("Extracted target from 'target' column")
            else:
                raise ValueError("Target column not found in X and y is None")
        
        print(f"Features shape: {X.shape}, Target shape: {y.shape if hasattr(y, 'shape') else 'unknown'}")
        
        # Convert y to numpy array if it's a pandas Series
        if hasattr(y, 'values'):
            y = y.values
        
        # Ensure y is float
        y = y.astype(float)
        
        # Process validation data if provided
        if validation_data is not None:
            X_val, y_val = validation_data
            if y_val is not None:
                if hasattr(y_val, 'values'):
                    y_val = y_val.values
                y_val = y_val.astype(float)
                validation_data = (X_val, y_val)
        
        # Detect feature types if not already set
        print("Detecting feature types...")
        self._detect_feature_types(X)
        print(f"Detected {len(self.numerical_features)} numerical features and {len(self.categorical_features)} categorical features")
        
        # Build the model if not already built
        print("Building model...")
        self.build_model()
        print(f"Model type: {type(self.model).__name__}")
        print(f"Model steps: {[name for name, _ in self.model.steps]}")
            
        # Train the model
        print("Starting model training...")
        self.model.fit(X, y, **fit_params)
        self.is_trained = True  # Mark model as trained
        print("Model training completed successfully")
        
        # Calculate and return metrics
        metrics = {}
        
        # Training metrics
        y_pred = self.model.predict(X)
        train_metrics = self._calculate_metrics(y, y_pred)
        metrics.update({f'train_{k}': v for k, v in train_metrics.items()})
        
        # Validation metrics if validation data is provided
        if validation_data is not None:
            X_val, y_val = validation_data
            y_val_pred = self.model.predict(X_val)
            val_metrics = self._calculate_metrics(y_val, y_val_pred)
            metrics.update({f'val_{k}': v for k, v in val_metrics.items()})
        
        return metrics
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict financial health status for the input data.
        
        Args:
            X: Input features for prediction
            
        Returns:
            Array of predicted financial health statuses
        """
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet. Call train() first.")
        
        # Preprocess the input data
        X_processed, _ = self.preprocess_data(X, training=False)
        
        # Make predictions
        predictions = self.model.predict(X_processed)
        
        # Convert back to original labels if needed
        if hasattr(self, 'label_encoder') and hasattr(self.label_encoder, 'classes_'):
            predictions = self.label_encoder.inverse_transform(predictions)
        
        return predictions
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict class probabilities for the input data.
        
        Args:
            X: Input features (DataFrame)
            
        Returns:
            Array of probability estimates for each class
        """
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet. Call train() first.")
        
        # Preprocess the input data
        X_processed, _ = self.preprocess_data(X, training=False)
        
        # Get probability estimates
        if hasattr(self.model, 'predict_proba'):
            return self.model.predict_proba(X_processed)
        else:
            raise NotImplementedError("This model does not support probability estimates.")
        
    def load_model(self, model_path: str) -> 'FinancialHealthClassifier':
        """Load a trained model from disk.
        
        Args:
            model_path: Path to the directory containing the saved model files
            
        Returns:
            self: The loaded model instance
        """
        try:
            # Convert model_path to string if it's a Path object
            model_path_str = str(model_path)
            
            # Load the model components
            model_file = os.path.join(model_path_str, 'classifier.joblib')
            if not os.path.exists(model_file):
                # Fallback to the old filename if the new one doesn't exist
                model_file = os.path.join(model_path_str, 'model.joblib')
                
            self.model = joblib.load(model_file)
            
            # Try to load label encoder if it exists
            encoder_file = os.path.join(model_path_str, 'classifier_label_encoder.joblib')
            if os.path.exists(encoder_file):
                self.encoder = joblib.load(encoder_file)
            else:
                # Fallback to the old filename if the new one doesn't exist
                encoder_file = os.path.join(model_path_str, 'encoder.joblib')
                if os.path.exists(encoder_file):
                    self.encoder = joblib.load(encoder_file)
            
            # Load the metadata
            metadata_file = os.path.join(model_path_str, 'classifier_metadata.json')
            if not os.path.exists(metadata_file):
                # Fallback to the old filename if the new one doesn't exist
                metadata_file = os.path.join(model_path_str, 'metadata.json')
                
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    self.feature_columns = metadata.get('feature_columns', [])
                    self.target_column = metadata.get('target_column', 'financial_health_score')
                    self.random_state = metadata.get('random_state', 42)
                    self.model_params = metadata.get('model_params', {})
                    self.metrics = metadata.get('metrics', {})
            else:
                logger.warning(f"Metadata file not found at {metadata_file}")
                self.feature_columns = []
                self.target_column = 'financial_health_score'
                self.random_state = 42
            
            # Load the scaler if it exists
            scaler_file = os.path.join(model_path_str, 'classifier_scaler.joblib')
            if os.path.exists(scaler_file):
                self.scaler = joblib.load(scaler_file)
            else:
                # Fallback to the old filename if the new one doesn't exist
                scaler_file = os.path.join(model_path_str, 'scaler.joblib')
                if os.path.exists(scaler_file):
                    self.scaler = joblib.load(scaler_file)
            
            self.is_trained = True
            logger.info(f"Model loaded successfully from {model_path}")
            return self
            
        except Exception as e:
            logger.error(f"Error loading model from {model_path}: {str(e)}")
            raise
    
    def _calculate_metrics(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate regression evaluation metrics.
        
        Args:
            y_true: True target values
            y_pred: Predicted target values
            
        Returns:
            Dictionary of evaluation metrics
        """
        from sklearn.metrics import (
            mean_squared_error, mean_absolute_error, 
            r2_score, explained_variance_score
        )
        
        # Calculate metrics
        metrics = {
            'mse': mean_squared_error(y_true, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
            'mae': mean_absolute_error(y_true, y_pred),
            'r2': r2_score(y_true, y_pred),
            'explained_variance': explained_variance_score(y_true, y_pred)
        }
        
        return metrics
    
    def get_feature_importances(self) -> Dict[str, float]:
        """Get feature importances from the trained model.
        
        Returns:
            Dictionary mapping feature names to their importance scores
        """
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet. Call train() first.")
        
        # Get feature names after preprocessing
        if hasattr(self.model, 'named_steps') and 'preprocessor' in self.model.named_steps:
            # Get feature names from the preprocessor
            num_features = self.numerical_features
            cat_features = [f for f in self.categorical_features if f in self.model.named_steps['preprocessor'].get_feature_names_out()]
            feature_names = num_features + cat_features
        else:
            feature_names = self.numerical_features + self.categorical_features
        
        # Get feature importances from the classifier
        if hasattr(self.model, 'named_steps') and 'classifier' in self.model.named_steps:
            classifier = self.model.named_steps['classifier']
        else:
            classifier = self.model
        
        if hasattr(classifier, 'feature_importances_'):
            importances = classifier.feature_importances_
            return dict(zip(feature_names, importances))
        else:
            logger.warning("Feature importances not available for this model type.")
            return {}
    
    def save(self, model_dir: str, model_name: str = 'financial_health_classifier') -> None:
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
            'training_date': getattr(self, 'training_date', None),
            'model_params': getattr(self, 'model_params', {}),
            'metrics': getattr(self, 'metrics', {}),
            'feature_names': getattr(self, 'numerical_features', []) + getattr(self, 'categorical_features', []),
            'random_state': getattr(self, 'random_state', 42),
            'test_size': getattr(self, 'test_size', 0.2)
        }
        
        # Save the model and metadata
        model_path = os.path.join(model_dir, f"{model_name}.joblib")
        joblib.dump(self.model, model_path)
        
        metadata_path = os.path.join(model_dir, f"{model_name}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        
        logger.info(f"Model saved to {model_path}")
        logger.info(f"Metadata saved to {metadata_path}")
        
        # Save feature importance plot if available
        try:
            if hasattr(self, 'model') and hasattr(self.model, 'feature_importances_'):
                self._save_feature_importance_plot(model_dir, model_name)
        except Exception as e:
            logger.warning(f"Could not save feature importance plot: {str(e)}")
    
    @classmethod
    def load(cls, model_dir: str, model_name: str = 'financial_health_classifier') -> 'FinancialHealthClassifier':
        """Load a saved model from disk.
        
        Args:
            model_dir: Directory containing the saved model
            model_name: Base name of the model files
            
        Returns:
            Loaded FinancialHealthClassifier instance
        """
        import joblib
        import json
        
        # Load metadata
        with open(os.path.join(model_dir, f"{model_name}_metadata.json"), 'r') as f:
            metadata = json.load(f)
        
        # Create model instance
        model = cls(
            model_params=metadata.get('model_params', {}),
            random_state=metadata.get('random_state', 42),
            test_size=metadata.get('test_size', 0.2)
        )
        
        # Load the model and label encoder
        model.model = joblib.load(os.path.join(model_dir, f"{model_name}.joblib"))
        model.label_encoder = joblib.load(os.path.join(model_dir, f"{model_name}_label_encoder.joblib"))
        
        # Restore other attributes
        model.training_date = metadata.get('training_date')
        model.metrics = metadata.get('metrics', {})
        model.is_trained = True
        
        logger.info(f"Model loaded from {os.path.join(model_dir, model_name)}.joblib")
        return model
    
    def _save_feature_importance_plot(self, model_dir: str, model_name: str, top_n: int = 10) -> None:
        """Generate and save a feature importance plot.
        
        Args:
            model_dir: Directory to save the plot
            model_name: Base name for the plot file
            top_n: Number of top features to show
        """
        try:
            import matplotlib
            matplotlib.use('Agg')  # Use non-interactive backend
            import matplotlib.pyplot as plt
            import seaborn as sns
        except ImportError:
            logger.warning("Matplotlib/Seaborn not available. Cannot generate feature importance plot.")
            return
        
        # Get feature importances
        importances = self.get_feature_importances()
        if not importances:
            return
        
        # Sort features by importance
        sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        features, scores = zip(*sorted_importances[:top_n])
        
        # Create plot
        plt.figure(figsize=(12, 8))
        sns.set_style("whitegrid")
        ax = sns.barplot(x=list(scores), y=list(features), palette='viridis')
        
        # Add value labels
        for i, v in enumerate(scores):
            ax.text(v, i, f" {v:.4f}", color='black', va='center', fontweight='bold')
        
        plt.title(f'Top {top_n} Most Important Features', fontsize=14, pad=20)
        plt.xlabel('Importance Score', fontsize=12)
        plt.ylabel('Features', fontsize=12)
        plt.tight_layout()
        
        # Save the plot
        plot_path = os.path.join(model_dir, f"{model_name}_feature_importance.png")
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Feature importance plot saved to {plot_path}")
    
    def get_feature_importance_plot(self, top_n: int = 10):
        """Generate a feature importance plot.
        
        Args:
            top_n: Number of top features to show
            
        Returns:
            Matplotlib figure object or None if not available
        """
        try:
            import matplotlib.pyplot as plt
            import seaborn as sns
        except ImportError:
            logger.warning("Matplotlib/Seaborn not available. Cannot generate feature importance plot.")
            return None
        
        # Get feature importances
        importances = self.get_feature_importances()
        if not importances:
            return None
        
        # Sort features by importance
        sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        features, scores = zip(*sorted_importances[:top_n])
        
        # Create plot
        plt.figure(figsize=(12, 8))
        sns.set_style("whitegrid")
        ax = sns.barplot(x=list(scores), y=list(features), palette='viridis')
        
        # Add value labels
        for i, v in enumerate(scores):
            ax.text(v, i, f" {v:.4f}", color='black', va='center', fontweight='bold')
        
        plt.title(f'Top {top_n} Most Important Features', fontsize=14, pad=20)
        plt.xlabel('Importance Score', fontsize=12)
        plt.ylabel('Features', fontsize=12)
        plt.tight_layout()
        
        return plt.gcf()


def train_financial_health_classifier(
    data_path: str,
    target_column: str = 'financial_health_score',
    exclude_columns: list = None,
    model_dir: str = 'models/financial_health',
    model_name: str = 'classifier',
    test_size: float = 0.2,
    random_state: int = 42,
    max_samples: int = 1000,  # Reduced default for faster testing
    verbose: int = 1  # 0: no output, 1: basic info, 2: detailed info
) -> FinancialHealthClassifier:
    """Convenience function to train and save a financial health classifier.
    
    Args:
        data_path: Path to the training data CSV file
        target_column: Name of the target column
        exclude_columns: List of columns to exclude from features
        model_dir: Directory to save the trained model
        model_name: Base name for the model files
        
    Returns:
        Trained FinancialHealthClassifier instance
    """
    # Set default exclude_columns if not provided
    if exclude_columns is None:
        exclude_columns = ['user_id', 'month_year', 'top_3_problem_areas']
    
    # Create model directory if it doesn't exist
    os.makedirs(model_dir, exist_ok=True)
    
    # Load the data with error handling
    try:
        if verbose >= 1:
            print(f"Loading data from {data_path}...")
        data = pd.read_csv(data_path)
        if verbose >= 1:
            print(f"Loaded {len(data)} records with {len(data.columns)} columns")
            
        # Use a smaller sample for faster training
        sample_size = min(max_samples, len(data))
        if verbose >= 1:
            print(f"Using {sample_size} random samples for faster training...")
        data = data.sample(n=sample_size, random_state=random_state)
        
    except Exception as e:
        raise RuntimeError(f"Error loading data: {str(e)}")
    
    # Handle missing values
    data = data.dropna(subset=[target_column] + [col for col in data.columns if col != target_column and (col not in exclude_columns)])
    
    # Print column names for debugging
    print("Available columns in the dataset:", data.columns.tolist())
    print(f"Target column: {target_column}")
    
    # Check if target column exists
    if target_column not in data.columns:
        raise ValueError(f"Target column '{target_column}' not found in the dataset")
    
    # Convert boolean columns to integers (0/1)
    bool_cols = [
        'needs_emergency_fund', 'overspending_restaurants',
        'overspending_entertainment', 'overspending_subscriptions',
        'high_debt_burden', 'insufficient_savings', 'housing_cost_too_high',
        'lifestyle_inflation_detected', 'irregular_savings_pattern',
        'has_adequate_emergency_fund', 'healthy_savings_rate',
        'controlled_discretionary_spending', 'low_debt_burden', 'needs_optimization'
    ]
    
    for col in bool_cols:
        if col in data.columns:
            data[col] = data[col].astype(int)
    
    # Handle categorical columns
    if 'optimization_priority' in data.columns:
        priority_map = {
            'none': 0,
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }
        data['optimization_priority'] = data['optimization_priority'].map(priority_map)
    
    if 'overall_financial_health' in data.columns:
        health_map = {
            'poor': 0,
            'fair': 1,
            'good': 2,
            'excellent': 3,
            'critical': 4
        }
        data['overall_financial_health'] = data['overall_financial_health'].map(health_map)
    
    # Drop non-feature columns
    non_feature_cols = ['user_id', 'month_year', 'top_3_problem_areas']
    feature_columns = [col for col in data.columns if col not in non_feature_cols + [target_column]]
    print(f"Using features: {feature_columns}")
    
    # Initialize the model with optimized settings for speed
    model = FinancialHealthClassifier(
        test_size=test_size,
        random_state=random_state,
        model_params={
            'n_estimators': 50,  # Reduced for speed
            'max_depth': 5,      # Shallower trees for faster training
            'n_jobs': -1,        # Use all available cores
            'verbose': 1         # Show progress during training
        }
    )
    
    # Create evaluation directory
    eval_dir = os.path.join(model_dir, 'evaluation')
    os.makedirs(eval_dir, exist_ok=True)
    
    # Set the target column for feature detection
    model.target_column = target_column
    
    # Use only the selected features for training
    X = data[feature_columns]
    y = data[target_column]
    
    # Convert target to numerical if it's not already
    try:
        y = y.astype(float)
    except ValueError:
        # If conversion to float fails, try to map string values to numbers
        y = y.astype(str).str.lower().str.strip()
        # Map common financial health categories to numerical scores (0-100)
        health_mapping = {
            'poor': 25,
            'fair': 50,
            'good': 75,
            'excellent': 100
        }
        y = y.map(health_mapping).fillna(pd.to_numeric(y, errors='coerce'))
    
    # Drop any remaining non-numeric values
    y = pd.to_numeric(y, errors='coerce')
    
    # Check if we still have valid targets
    if y.isnull().any():
        print("Warning: Some target values could not be converted to numerical values and will be dropped.")
        valid_indices = y.notnull()
        X = X[valid_indices]
        y = y[valid_indices]
    
    # Convert to numpy arrays
    y = y.values
    
    # Detect feature types
    model._detect_feature_types(X)
    
    # Build the model
    model.build_model()
    
    # Split data into train and validation sets
    # For regression, we don't use stratification
    X_train, X_val, y_train, y_val = train_test_split(
        X, y,
        test_size=0.2, 
        random_state=42
    )
    
    print(f"Training on {len(X_train)} samples, validating on {len(X_val)} samples")
    print(f"Target value range: {y.min():.2f} to {y.max():.2f}")
    
    # Train the model with error handling
    print("\nStarting model training...")
    try:
        start_time = time.time()
        model.train(X_train, y_train)
        training_time = time.time() - start_time
        print(f"Training completed in {training_time:.2f} seconds")
        
        # Basic model info
        if verbose >= 1:
            print("\nModel Info:")
            print(f"- Model type: {model.__class__.__name__}")
            print(f"- Features: {len(feature_columns)}")
            print(f"- Training samples: {len(X_train)}")
            print(f"- Validation samples: {len(X_val)}")
            
    except Exception as e:
        raise RuntimeError(f"Error during model training: {str(e)}")
    
    # Import evaluation module with error handling
    try:
        from .evaluation import evaluate_classifier
        
        print("\nEvaluating model on validation set...")
        val_metrics = evaluate_classifier(
            model=model,
            X_test=X_val,
            y_test=y_val,
            class_names=FinancialHealthClassifier.HEALTH_CATEGORIES if hasattr(FinancialHealthClassifier, 'HEALTH_CATEGORIES') else None,
            show_confusion_matrix=True,
            return_metrics=True
        )
        
        if verbose >= 1:
            print("\nEvaluation Metrics:")
            for metric, value in val_metrics.items():
                print(f"- {metric}: {value:.4f}")
                
    except Exception as e:
        print(f"\nWarning: Error during evaluation - {str(e)}")
        val_metrics = {}
    
    # Save evaluation metrics
    import json
    metrics_path = os.path.join(eval_dir, f'{model_name}_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(val_metrics, f, indent=4)
    print(f"\nEvaluation metrics saved to: {metrics_path}")
    
    # Save confusion matrix plot
    import matplotlib.pyplot as plt
    confusion_matrix_path = os.path.join(eval_dir, f'{model_name}_confusion_matrix.png')
    plt.savefig(confusion_matrix_path, bbox_inches='tight')
    plt.close()
    print(f"Confusion matrix saved to: {confusion_matrix_path}")
    
    # Save feature importance plot if available
    try:
        fig = model.get_feature_importance_plot()
        if fig is not None:
            importance_path = os.path.join(eval_dir, f'{model_name}_feature_importance.png')
            fig.savefig(importance_path, bbox_inches='tight')
            plt.close(fig)
            print(f"Feature importance plot saved to: {importance_path}")
    except Exception as e:
        print(f"Could not save feature importance plot: {e}")
    
    # Save the model with error handling
    try:
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, f"{model_name}.joblib")
        model.save(model_dir, model_name)
        print(f"\nModel successfully saved to: {model_path}")
        
        # Save metrics to file
        metrics_path = os.path.join(model_dir, f"{model_name}_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(val_metrics, f, indent=2)
        print(f"Metrics saved to: {metrics_path}")
        
    except Exception as e:
        print(f"\nWarning: Error saving model - {str(e)}")
    
    # Print final metrics
    print("\nFinal Validation Metrics:")
    print("-" * 50)
    for metric, value in val_metrics.items():
        print(f"{metric}: {value:.4f}")
    
    return model
