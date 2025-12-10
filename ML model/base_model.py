"""
Base Model class for ML models in the Personal Finance AI Manager.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime


class BaseModel(ABC):
    """Abstract base class for all ML models."""
    
    def __init__(self, model_params: Optional[Dict[str, Any]] = None):
        """Initialize the base model.
        
        Args:
            model_params: Dictionary of model parameters
        """
        self.model_params = model_params or {}
        self.model = None
        self.is_trained = False
        self.training_date = None
        self.metrics = {}
    
    @abstractmethod
    def preprocess_data(self, data: pd.DataFrame, training: bool = False) -> Tuple[pd.DataFrame, Optional[np.ndarray]]:
        """Preprocess the input data.
        
        Args:
            data: Input DataFrame
            training: Whether this is training data
            
        Returns:
            Preprocessed features and optionally target values
        """
        pass
    
    @abstractmethod
    def train(self, X: pd.DataFrame, y: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Train the model.
        
        Args:
            X: Training features
            y: Training target
            
        Returns:
            Dictionary of training metrics
        """
        pass
    
    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions.
        
        Args:
            X: Input features
            
        Returns:
            Predictions
        """
        pass
    
    def set_trained(self):
        """Mark the model as trained."""
        self.is_trained = True
        self.training_date = datetime.now().isoformat()
