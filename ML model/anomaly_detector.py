import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Tuple, List, Dict, Any, Union, Optional
import joblib
import os


class AnomalyDetector:
    """
    Enhanced Anomaly Detection for financial transactions using Isolation Forest with additional features.
    
    Features:
    - Advanced feature engineering for transaction patterns
    - Automatic threshold optimization
    - Support for both unsupervised and semi-supervised learning
    - Comprehensive evaluation metrics
    """
    
    def __init__(self, 
                 contamination: float = 'auto',
                 random_state: int = 42,
                 n_estimators: int = 300,
                 max_samples: Union[float, str] = 'auto',
                 max_features: float = 1.0,
                 bootstrap: bool = True,
                 n_jobs: int = -1,
                 verbose: int = 0):
        """
        Initialize the enhanced anomaly detector.
        
        Args:
            contamination: 'auto' or float. If 'auto', the threshold is determined using
                         the find_optimal_threshold method. If float, the proportion of
                         outliers in the data set. Default is 'auto'.
            random_state: Random state for reproducibility. Default is 42.
            n_estimators: Number of base estimators in the ensemble. Default is 300.
            max_samples: The number of samples to draw from X to train each base estimator.
                       If 'auto', then max_samples=min(256, n_samples).
            max_features: The number of features to draw from X to train each base estimator.
            bootstrap: Whether samples are drawn with replacement. If False, sampling without
                     replacement is performed. Default is True.
            n_jobs: The number of jobs to run in parallel. -1 means using all processors.
            verbose: Controls the verbosity of the tree building process. Default is 0.
        """
        self.contamination = contamination
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.max_features = max_features
        self.bootstrap = bootstrap
        self.n_jobs = n_jobs
        self.verbose = verbose
        
        # Initialize the Isolation Forest model
        self.model = IsolationForest(
            contamination=0.1 if contamination == 'auto' else contamination,
            random_state=random_state,
            n_estimators=n_estimators,
            max_samples=max_samples,
            max_features=max_features,
            bootstrap=bootstrap,
            n_jobs=n_jobs,
            verbose=verbose
        )
        
        # Initialize preprocessing components
        self.scaler = StandardScaler()
        self.feature_names_ = None
        self.is_fitted = False
        self.threshold_ = None  # Will store optimal threshold
        self.feature_importances_ = None
        self.best_params_ = None
    
    def train(self, X, y=None):
        """Train the anomaly detection model.
        
        Args:
            X: Input features (pandas DataFrame)
            y: Target values (ignored, for compatibility with scikit-learn API)
            
        Returns:
            self: The fitted model
        """
        # Preprocess the data
        X_processed = self.preprocess_data(X)
        
        # Fit the scaler
        self.scaler.fit(X_processed)
        
        # Scale the features
        X_scaled = self.scaler.transform(X_processed)
        
        # Fit the model
        self.model.fit(X_scaled)
        self.is_fitted = True
        
        return self
        
    def preprocess_data(self, data: Union[pd.DataFrame, np.ndarray], 
                        y: Optional[np.ndarray] = None) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Enhanced preprocessing for transaction data with advanced feature engineering.
        
        Args:
            data: DataFrame containing transaction data with 'amount' and 'date' columns,
                 or a numpy array that's already preprocessed
            y: Optional array-like of shape (n_samples,) containing target values for supervised learning
            
        Returns:
            Tuple containing:
                - Preprocessed feature matrix (numpy.ndarray)
                - Target values (if y was provided, otherwise None)
        """
        # If data is already a numpy array and we have feature names, return as is
        if isinstance(data, np.ndarray):
            if hasattr(self, 'feature_names_') and data.shape[1] == len(self.feature_names_):
                return data, y
            else:
                raise ValueError("Numpy array input must match the number of features used during training.")
                
        # If it's a DataFrame, process it
        if not all(col in data.columns for col in ['amount', 'date']):
            if hasattr(self, 'feature_names_') and len(data.columns) == len(self.feature_names_):
                data.columns = self.feature_names_
                return data.values, y
            raise ValueError("Input data must contain 'amount' and 'date' columns or match the training features.")
        
        # Create a copy to avoid modifying the original data
        data = data.copy()
        
        # Convert date to datetime if it's not already
        data['date'] = pd.to_datetime(data['date'])
        
        # Basic time-based features
        data['day_of_week'] = data['date'].dt.dayofweek
        data['day_of_week_sin'] = np.sin(2 * np.pi * data['day_of_week'] / 7)
        data['day_of_week_cos'] = np.cos(2 * np.pi * data['day_of_week'] / 7)
        
        data['day_of_month'] = data['date'].dt.day
        data['day_of_month_sin'] = np.sin(2 * np.pi * data['day_of_month'] / 31)
        data['day_of_month_cos'] = np.cos(2 * np.pi * data['day_of_month'] / 31)
        
        data['month'] = data['date'].dt.month
        data['month_sin'] = np.sin(2 * np.pi * (data['month'] - 1) / 12)
        data['month_cos'] = np.cos(2 * np.pi * (data['month'] - 1) / 12)
        
        # Time since first transaction (useful for detecting concept drift)
        if not hasattr(self, 'first_date_'):
            self.first_date_ = data['date'].min()
        data['days_since_first'] = (data['date'] - self.first_date_).dt.days
        
        # Amount-based features
        features = pd.DataFrame()
        features['amount'] = data['amount']
        features['log_amount'] = np.log1p(data['amount'])  # Log transform for right-skewed data
        
        # Time-based aggregations (if enough data is available)
        if len(data) > 1:
            # Rolling statistics
            for window in [3, 7, 14, 30]:  # Multiple window sizes
                if len(data) >= window:
                    # Rolling statistics
                    roll = data['amount'].rolling(window=window, min_periods=1)
                    features[f'rolling_{window}d_mean'] = roll.mean()
                    features[f'rolling_{window}d_std'] = roll.std()
                    features[f'rolling_{window}d_min'] = roll.min()
                    features[f'rolling_{window}d_max'] = roll.max()
                    
                    # Z-scores for current amount compared to rolling stats
                    features[f'zscore_{window}d'] = (
                        (data['amount'] - features[f'rolling_{window}d_mean']) / 
                        (features[f'rolling_{window}d_std'] + 1e-6)  # Avoid division by zero
                    )
                    
                    # Percent change from rolling mean
                    features[f'pct_change_{window}d'] = (
                        (data['amount'] - features[f'rolling_{window}d_mean']) / 
                        (features[f'rolling_{window}d_mean'] + 1e-6)
                    )
            
            # Time between transactions
            data['time_since_last'] = data['date'].diff().dt.total_seconds() / 3600  # in hours
            features['time_since_last'] = data['time_since_last'].fillna(0)
            
            # Day-over-day and week-over-week changes
            if 'amount' in data.columns and len(data) > 1:
                data['amount_lag1'] = data['amount'].shift(1)
                features['amount_dod_change'] = data['amount'] - data['amount_lag1']
                features['amount_dod_pct'] = (
                    (data['amount'] - data['amount_lag1']) / 
                    (data['amount_lag1'] + 1e-6)
                )
                
                if len(data) > 7:
                    data['amount_lag7'] = data['amount'].shift(7)
                    features['amount_wow_change'] = data['amount'] - data['amount_lag7']
                    features['amount_wow_pct'] = (
                        (data['amount'] - data['amount_lag7']) / 
                        (data['amount_lag7'] + 1e-6)
                    )
        
        # Add cyclical time features
        features = pd.concat([
            features,
            data[['day_of_week_sin', 'day_of_week_cos', 
                 'day_of_month_sin', 'day_of_month_cos',
                 'month_sin', 'month_cos',
                 'days_since_first']]
        ], axis=1)
        
        # Add interaction terms
        if 'log_amount' in features.columns and 'time_since_last' in features.columns:
            features['log_amount_x_time_since_last'] = features['log_amount'] * features['time_since_last']
        
        # Store feature names for later use
        self.feature_names_ = features.columns.tolist()
        
        # Fill any remaining NaN values
        features = features.fillna(0)
        
        # If target variable is provided, ensure it aligns with the features
        target = None
        if y is not None:
            if len(y) != len(features):
                raise ValueError("Length of y must match the number of samples in X")
            target = np.asarray(y)
        
        return features.values, target
    
    def fit(self, X: Union[pd.DataFrame, np.ndarray], 
             y: Optional[np.ndarray] = None,
             optimize_threshold: bool = True,
             eval_set: Optional[Tuple[pd.DataFrame, np.ndarray]] = None) -> 'AnomalyDetector':
        """
        Fit the anomaly detection model to the data with optional threshold optimization.
        
        Args:
            X: DataFrame containing transaction data or numpy array of preprocessed features
            y: Optional array-like of shape (n_samples,) containing target values for semi-supervised learning
            optimize_threshold: Whether to optimize the decision threshold using the training data
            eval_set: Optional tuple (X_val, y_val) for threshold optimization on a separate validation set
            
        Returns:
            self: The fitted model
        """
        # Preprocess the data
        X_processed, y_processed = self.preprocess_data(X, y)
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X_processed)
        
        # Fit the model
        self.model.fit(X_scaled)
        self.is_fitted = True
        
        # Calculate feature importances with the processed y if available
        self._calculate_feature_importances(X_scaled, y=y_processed)
        
        # Optimize threshold if requested and we have labels
        if optimize_threshold and y_processed is not None:
            self.threshold_ = self.find_optimal_threshold(X_scaled, y_processed)
        elif optimize_threshold and eval_set is not None:
            # Use the evaluation set for threshold optimization
            X_val, y_val = eval_set
            if isinstance(X_val, pd.DataFrame):
                X_val_processed, _ = self.preprocess_data(X_val, y_val)
                X_val_scaled = self.scaler.transform(X_val_processed)
                self.threshold_ = self.find_optimal_threshold(X_val_scaled, y_val)
            else:
                # If X_val is already preprocessed, just scale it
                X_val_scaled = self.scaler.transform(X_val)
                self.threshold_ = self.find_optimal_threshold(X_val_scaled, y_val)
        
        return self
    
    def _calculate_feature_importances(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> None:
        """Calculate feature importances using permutation importance.
        
        Args:
            X: Input features
            y: Optional target values (not used for Isolation Forest)
        """
        from sklearn.inspection import permutation_importance
        
        try:
            # Calculate permutation importance
            result = permutation_importance(
                self.model, 
                X, 
                y=y,  # This is optional and can be None for unsupervised models
                n_repeats=10, 
                random_state=self.random_state, 
                n_jobs=self.n_jobs
            )
            
            # Store feature importances
            self.feature_importances_ = {
                'mean': result.importances_mean,
                'std': result.importances_std,
                'importances': result.importances
            }
            
        except Exception as e:
            print(f"Warning: Could not calculate feature importances: {str(e)}")
            self.feature_importances_ = None
    
    def predict(self, X: Union[pd.DataFrame, np.ndarray], 
                threshold: Optional[float] = None) -> np.ndarray:
        """
        Predict anomalies in the input data with optional threshold adjustment.
        
        Args:
            X: Input features (pandas DataFrame or numpy array)
            threshold: Custom threshold for anomaly detection. If None, uses the model's threshold
                     or the contamination parameter if no threshold is set.
                     
        Returns:
            numpy.ndarray: Array of anomaly predictions (1 for anomaly, 0 for normal)
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been trained yet. Call 'fit' first.")
        
        # Get anomaly scores
        scores = self.decision_function(X)
        
        # Use provided threshold, model's optimized threshold, or fall back to contamination
        if threshold is not None:
            threshold = threshold
        elif self.threshold_ is not None:
            threshold = self.threshold_
        else:
            # Fall back to contamination-based threshold
            threshold = np.percentile(scores, 100 * self.contamination) if self.contamination != 'auto' else 0
        
        # Make predictions based on the threshold
        return (scores > threshold).astype(int)
    
    def decision_function(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """
        Compute the anomaly score for each sample.
        
        Args:
            X: Input features (pandas DataFrame or numpy array)
            
        Returns:
            numpy.ndarray: Array of anomaly scores (higher values indicate more anomalous)
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been trained yet. Call 'fit' first.")
            
        # Preprocess the input data
        X_processed, _ = self.preprocess_data(X)
        
        # Scale the features
        X_scaled = self.scaler.transform(X_processed)
        
        # Get anomaly scores (the lower, the more abnormal)
        scores = -self.model.score_samples(X_scaled)  # Negate to make higher = more anomalous
        
        return scores
    
    def predict_proba(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """
        Predict probability estimates for the input samples.
        The returned estimates for all classes are ordered by the label of classes.
        
        Args:
            X: Input features (pandas DataFrame or numpy array)
            
        Returns:
            numpy.ndarray: Returns the probability of the sample for each class in the model,
                         where classes are ordered as [normal, anomaly].
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been fitted. Call fit() first.")
        
        # Get anomaly scores
        scores = self.decision_function(X)
        
        # Convert scores to probabilities using Platt scaling (sigmoid)
        # First, normalize scores to be between 0 and 1
        min_score = np.min(scores)
        max_score = np.max(scores)
        if max_score > min_score:
            normalized_scores = (scores - min_score) / (max_score - min_score)
        else:
            normalized_scores = np.zeros_like(scores)
        
        # Apply sigmoid to get probabilities
        prob_anomaly = 1 / (1 + np.exp(-10 * (normalized_scores - 0.5)))
        
        # Return probabilities for both classes [normal, anomaly]
        return np.column_stack((1 - prob_anomaly, prob_anomaly))
    
    def evaluate(self, X: Union[pd.DataFrame, np.ndarray], y_true: np.ndarray,
                threshold: Optional[float] = None) -> Dict[str, float]:
        """
        Evaluate the model's performance on the given data.
        
        Args:
            X: Input features (pandas DataFrame or numpy array)
            y_true: True labels (1 for anomaly, 0 for normal)
            threshold: Threshold for classification. If None, uses the model's threshold.
            
        Returns:
            dict: Dictionary containing evaluation metrics
        """
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            roc_auc_score, average_precision_score, confusion_matrix,
            precision_recall_curve, roc_curve, auc
        )
        
        # Get predictions and probabilities
        y_scores = self.decision_function(X)
        y_pred = self.predict(X, threshold=threshold)
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1': f1_score(y_true, y_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_true, y_scores),
            'average_precision': average_precision_score(y_true, y_scores)
        }
        
        # Add confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        metrics.update({
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp)
        })
        
        # Calculate additional metrics
        metrics['false_positive_rate'] = fp / (fp + tn) if (fp + tn) > 0 else 0
        metrics['false_negative_rate'] = fn / (fn + tp) if (fn + tp) > 0 else 0
        metrics['true_positive_rate'] = metrics['recall']
        metrics['true_negative_rate'] = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        # Calculate F-beta scores
        for beta in [0.5, 1, 2]:
            metrics[f'f{beta}_score'] = (
                (1 + beta**2) * metrics['precision'] * metrics['recall'] / 
                (beta**2 * metrics['precision'] + metrics['recall'] + 1e-6)
            )
        
        return metrics
    
    def get_feature_importance_df(self) -> pd.DataFrame:
        """
        Get a DataFrame of feature importances.
        
        Returns:
            pandas.DataFrame: DataFrame with feature names and their importance scores
        """
        if not hasattr(self, 'feature_importances_') or self.feature_importances_ is None:
            raise RuntimeError("Feature importances not available. Call fit() first.")
        
        if self.feature_names_ is None:
            self.feature_names_ = [f'feature_{i}' for i in range(len(self.feature_importances_['mean']))]
        
        return pd.DataFrame({
            'feature': self.feature_names_,
            'importance_mean': self.feature_importances_['mean'],
            'importance_std': self.feature_importances_['std']
        }).sort_values('importance_mean', ascending=False)
    
    def find_optimal_threshold(self, X: Union[pd.DataFrame, np.ndarray], 
                             y_true: np.ndarray,
                             metric: str = 'f1',
                             n_splits: int = 5) -> float:
        """
        Find the optimal threshold for anomaly detection using cross-validation.
        
        Args:
            X: Input features (pandas DataFrame or numpy array)
            y_true: True labels (1 for anomaly, 0 for normal)
            metric: Metric to optimize for. Options: 'f1', 'precision', 'recall', 'j_statistic', 'f2'.
                   Default is 'f1'.
            n_splits: Number of cross-validation folds. Default is 5.
            
        Returns:
            float: Optimal threshold
        """
        from sklearn.model_selection import StratifiedKFold
        from sklearn.metrics import f1_score, precision_score, recall_score, roc_curve
        
        # Preprocess the data if needed
        if isinstance(X, pd.DataFrame):
            X_processed, _ = self.preprocess_data(X, y_true)
            X_scaled = self.scaler.transform(X_processed)
        else:
            X_scaled = X
        
        # Get anomaly scores
        scores = -self.model.score_samples(X_scaled)  # Higher = more anomalous
        
        # Define metric function
        def calculate_metric(y_true, y_pred, metric):
            if metric == 'f1':
                return f1_score(y_true, y_pred)
            elif metric == 'precision':
                return precision_score(y_true, y_pred, zero_division=0)
            elif metric == 'recall':
                return recall_score(y_true, y_pred, zero_division=0)
            elif metric == 'j_statistic':
                tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
                tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
                fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
                return tpr - fpr
            elif metric == 'f2':
                precision = precision_score(y_true, y_pred, zero_division=0)
                recall = recall_score(y_true, y_pred, zero_division=0)
                return 5 * (precision * recall) / (4 * precision + recall) if (precision + recall) > 0 else 0
            else:
                raise ValueError(f"Unknown metric: {metric}")
        
        # Find threshold that maximizes the selected metric using cross-validation
        best_threshold = 0
        best_score = -np.inf
        
        # Use cross-validation to find the best threshold
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=self.random_state)
        
        for train_idx, val_idx in cv.split(X_scaled, y_true):
            X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
            y_train, y_val = y_true[train_idx], y_true[val_idx]
            
            # Get scores for this fold
            scores_fold = -self.model.score_samples(X_val)
            
            # Try different thresholds
            thresholds = np.percentile(scores_fold, np.linspace(0, 100, 100))
            
            for threshold in thresholds:
                y_pred = (scores_fold >= threshold).astype(int)
                score = calculate_metric(y_val, y_pred, metric)
                
                if score > best_score:
                    best_score = score
                    best_threshold = threshold
        
        self.threshold_ = best_threshold
        return best_threshold

    def get_anomalies(self, data: pd.DataFrame, threshold: float = None, y_true: np.ndarray = None) -> pd.DataFrame:
        """
        Get the anomalous transactions along with their anomaly scores.
        
        Args:
            data: DataFrame containing transaction data
            threshold: Threshold for anomaly detection. If None, finds optimal threshold.
            y_true: True labels (required if threshold is None)
            
        Returns:
            DataFrame: Original data with additional columns for anomaly detection results
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been fitted. Call fit() first.")
        
        # Get anomaly scores
        anomaly_scores = self.predict_proba(data)
        
        # Create a copy of the input data to avoid modifying the original
        result = data.copy()
        result['anomaly_score'] = anomaly_scores
        
        # Determine threshold if not provided
        if threshold is None:
            if y_true is None:
                # If no threshold provided and no true labels, use model's contamination
                result['is_anomaly'] = self.model.predict(self.scaler.transform(self.preprocess_data(data))) == -1
            else:
                # Find optimal threshold using Youden's J statistic
                self.threshold_ = self.find_optimal_threshold(data, y_true)
                result['is_anomaly'] = anomaly_scores < self.threshold_
        else:
            # Use provided threshold
            result['is_anomaly'] = anomaly_scores < threshold
        
        return result
    
    def decision_function(self, X):
        """Predict anomaly scores of X using the fitted detector.
        
        Args:
            X: Input features (pandas DataFrame)
            
        Returns:
            numpy.ndarray: Anomaly scores (the more positive, the more anomalous)
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been trained yet. Call 'train' first.")
            
        X_processed = self.preprocess_data(X)
        X_scaled = self.scaler.transform(X_processed)
        return self.model.decision_function(X_scaled)
    
    def score_samples(self, X):
        """Predict raw anomaly scores of X using the fitted detector.
        
        Args:
            X: Input features (pandas DataFrame)
            
        Returns:
            numpy.ndarray: Anomaly scores (the more negative, the more anomalous)
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been trained yet. Call 'train' first.")
            
        X_processed = self.preprocess_data(X)
        X_scaled = self.scaler.transform(X_processed)
        return -self.model.score_samples(X_scaled)  # Negative because lower is more anomalous
    
    def save_model(self, filepath: str) -> None:
        """
        Save the trained model to disk.
        
        Args:
            filepath: Path to save the model
        """
        if not self.is_fitted:
            raise RuntimeError("Model has not been fitted. Nothing to save.")
            
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save the model and scaler
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'contamination': self.contamination,
            'random_state': self.random_state
        }
        joblib.dump(model_data, filepath)
    
    @classmethod
    def load_model(cls, filepath: str) -> 'AnomalyDetector':
        """
        Load a trained model from disk.
        
        Args:
            filepath: Path to the saved model
            
        Returns:
            AnomalyDetector: Loaded anomaly detector instance
        """
        # Load the model data
        model_data = joblib.load(filepath)
        
        # Create a new instance
        detector = cls(
            contamination=model_data['contamination'],
            random_state=model_data['random_state']
        )
        
        # Set the model and scaler
        detector.model = model_data['model']
        detector.scaler = model_data['scaler']
        detector.is_fitted = True
        
        return detector


def detect_anomalies(data: pd.DataFrame, 
                    contamination: float = 'auto',
                    random_state: int = 42,
                    optimize_threshold: bool = True,
                    y_true: Optional[np.ndarray] = None) -> Tuple[pd.DataFrame, 'AnomalyDetector']:
    """
    Enhanced convenience function to detect anomalies in transaction data with advanced features.
    
    Args:
        data: DataFrame containing transaction data with 'amount' and 'date' columns
        contamination: 'auto' or float. If 'auto', the threshold is determined using
                     the find_optimal_threshold method. If float, the proportion of
                     outliers in the data set. Default is 'auto'.
        random_state: Random state for reproducibility. Default is 42.
        optimize_threshold: Whether to optimize the decision threshold. If y_true is provided,
                          uses it for optimization. Default is True.
        y_true: Optional array-like of shape (n_samples,) containing true labels for optimization.
                If provided and optimize_threshold is True, uses these labels to find the best threshold.
                
    Returns:
        Tuple containing:
            - DataFrame with added 'anomaly_score' and 'is_anomaly' columns
            - Fitted AnomalyDetector instance
    """
    # Initialize the detector with enhanced parameters
    detector = AnomalyDetector(
        contamination=contamination,
        random_state=random_state,
        n_estimators=300,
        max_samples='auto',
        max_features=0.8,
        bootstrap=True,
        n_jobs=-1,
        verbose=0
    )
    
    # Fit the model
    if y_true is not None and optimize_threshold:
        # Use provided labels for threshold optimization
        detector.fit(data, y=y_true, optimize_threshold=True)
    else:
        # Standard unsupervised fitting
        detector.fit(data, optimize_threshold=optimize_threshold)
    
    # Get predictions and scores
    data = data.copy()
    data['anomaly_score'] = detector.decision_function(data)
    data['is_anomaly'] = detector.predict(data)
    
    # Add probability estimates
    probas = detector.predict_proba(data)
    data['anomaly_probability'] = probas[:, 1]  # Probability of being an anomaly
    
    return data, detector
