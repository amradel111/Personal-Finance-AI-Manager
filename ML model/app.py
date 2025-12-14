"""
Flask API for ML Models in Personal Finance AI Manager.

This service exposes endpoints for:
- Financial Health Classification
- Expense Forecasting  
- Anomaly Detection
"""

import os
import sys
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Add the ML model directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instances
models = {
    'anomaly_detector': None,
    'expense_forecaster': None,
    'health_classifier': None
}

# Paths
DATASETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'datasets')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'trained_models')


def load_or_train_models():
    """Load trained models or train new ones if not available."""
    global models
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # For now, we'll train on first request
    logger.info("Models will be trained on first prediction request if not already trained.")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': {k: v is not None for k, v in models.items()}
    })


@app.route('/train', methods=['POST'])
def train_models():
    """Train all models using the datasets."""
    global models
    results = {}
    
    try:
        # Train Financial Health Classifier
        logger.info("Training Financial Health Classifier...")
        health_data_path = os.path.join(DATASETS_DIR, 'financial_health_assessment.csv')
        if os.path.exists(health_data_path):
            from financial_health_classifier import FinancialHealthClassifier
            
            data = pd.read_csv(health_data_path)
            # Use a sample for faster training
            sample_size = min(1000, len(data))
            data = data.sample(n=sample_size, random_state=42)
            
            classifier = FinancialHealthClassifier()
            
            # Prepare features and target
            target_col = 'financial_health_score'
            exclude_cols = ['user_id', 'month_year', 'top_3_problem_areas']
            feature_cols = [c for c in data.columns if c not in exclude_cols + [target_col]]
            
            X = data[feature_cols]
            y = data[target_col]
            
            # Train
            metrics = classifier.train(X, y)
            models['health_classifier'] = classifier
            results['health_classifier'] = {'status': 'trained', 'metrics': metrics}
        else:
            results['health_classifier'] = {'status': 'skipped', 'reason': 'Data file not found'}
        
        # Train Anomaly Detector (simplified)
        logger.info("Training Anomaly Detector...")
        spending_data_path = os.path.join(DATASETS_DIR, 'monthly_spending.csv')
        if os.path.exists(spending_data_path):
            from anomaly_detector import AnomalyDetector
            
            data = pd.read_csv(spending_data_path)
            
            # Create synthetic transaction data for anomaly detection
            # We'll use total_monthly_expenses as the amount
            if 'total_monthly_expenses' in data.columns:
                transactions = pd.DataFrame({
                    'amount': data['total_monthly_expenses'].dropna(),
                    'date': pd.date_range(start='2024-01-01', periods=len(data['total_monthly_expenses'].dropna()), freq='D')
                })
                
                detector = AnomalyDetector()
                detector.train(transactions)
                models['anomaly_detector'] = detector
                results['anomaly_detector'] = {'status': 'trained'}
            else:
                results['anomaly_detector'] = {'status': 'skipped', 'reason': 'Required columns not found'}
        else:
            results['anomaly_detector'] = {'status': 'skipped', 'reason': 'Data file not found'}
        
        logger.info("Model training complete!")
        return jsonify({'status': 'success', 'results': results})
        
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/predict/health', methods=['POST'])
def predict_health():
    """Predict financial health score based on user data."""
    global models
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # If model not trained, return a calculated score based on simple rules
        if models['health_classifier'] is None:
            # Simple rule-based scoring
            score = calculate_simple_health_score(data)
            return jsonify({
                'score': score,
                'category': get_health_category(score),
                'method': 'rule_based',
                'message': 'Model not trained yet. Using rule-based calculation.'
            })
        
        # Use trained model
        df = pd.DataFrame([data])
        prediction = models['health_classifier'].predict(df)
        
        return jsonify({
            'score': float(prediction[0]),
            'category': get_health_category(float(prediction[0])),
            'method': 'ml_model'
        })
        
    except Exception as e:
        logger.error(f"Error predicting health: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/forecast', methods=['POST'])
def predict_forecast():
    """Forecast future expenses based on historical data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract historical expenses
        historical = data.get('historical_expenses', [])
        months_ahead = data.get('months_ahead', 1)
        
        if len(historical) < 2:
            return jsonify({'error': 'Need at least 2 months of historical data'}), 400
        
        # Simple moving average forecast
        recent = historical[-3:] if len(historical) >= 3 else historical
        avg = sum(recent) / len(recent)
        
        # Add slight trend adjustment
        if len(historical) >= 2:
            trend = (historical[-1] - historical[-2]) / historical[-2] if historical[-2] != 0 else 0
            trend = max(-0.1, min(0.1, trend))  # Cap trend at ±10%
            forecast = avg * (1 + trend * 0.5)
        else:
            forecast = avg
        
        return jsonify({
            'forecast': round(forecast, 2),
            'months_ahead': months_ahead,
            'confidence': 0.7,
            'method': 'moving_average',
            'trend': 'up' if trend > 0.02 else ('down' if trend < -0.02 else 'stable')
        })
        
    except Exception as e:
        logger.error(f"Error forecasting: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/anomaly', methods=['POST'])
def predict_anomaly():
    """Detect if a transaction is anomalous."""
    global models
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        amount = data.get('amount', 0)
        avg_spending = data.get('average_monthly_spending', 1000)
        
        # Simple rule-based anomaly detection
        ratio = amount / avg_spending if avg_spending > 0 else 0
        
        is_anomaly = ratio > 1.5 or ratio < 0.3
        severity = 'high' if ratio > 2 or ratio < 0.2 else 'medium' if is_anomaly else 'low'
        
        return jsonify({
            'is_anomaly': is_anomaly,
            'severity': severity,
            'ratio_to_average': round(ratio, 2),
            'method': 'rule_based' if models['anomaly_detector'] is None else 'ml_model',
            'recommendation': get_anomaly_recommendation(is_anomaly, ratio)
        })
        
    except Exception as e:
        logger.error(f"Error detecting anomaly: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/insights', methods=['POST'])
def get_insights():
    """Get comprehensive AI insights for a user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        insights = {
            'health': None,
            'forecast': None,
            'anomalies': [],
            'recommendations': []
        }
        
        # Health score
        health_score = calculate_simple_health_score(data)
        insights['health'] = {
            'score': health_score,
            'category': get_health_category(health_score)
        }
        
        # Expense forecast
        if 'historical_expenses' in data and len(data['historical_expenses']) >= 2:
            historical = data['historical_expenses']
            avg = sum(historical[-3:]) / min(3, len(historical))
            insights['forecast'] = {
                'next_month': round(avg, 2),
                'trend': 'stable'
            }
        
        # Recommendations
        insights['recommendations'] = generate_recommendations(data, health_score)
        
        return jsonify(insights)
        
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return jsonify({'error': str(e)}), 500


def calculate_simple_health_score(data):
    """Calculate a simple health score based on financial metrics."""
    score = 50  # Base score
    
    income = data.get('income', data.get('monthly_income', 0))
    expenses = data.get('expenses', data.get('total_monthly_expenses', 0))
    savings = data.get('savings', income - expenses if income and expenses else 0)
    debt = data.get('total_debt', data.get('debt', 0))
    
    if income > 0:
        # Savings rate impact
        savings_rate = (savings / income) * 100 if income > 0 else 0
        if savings_rate >= 20:
            score += 20
        elif savings_rate >= 10:
            score += 10
        elif savings_rate < 0:
            score -= 20
        
        # Debt-to-income impact
        dti = (debt / (income * 12)) * 100 if income > 0 else 0
        if dti < 20:
            score += 15
        elif dti < 40:
            score += 5
        elif dti > 60:
            score -= 15
        
        # Expense ratio impact
        expense_ratio = (expenses / income) * 100 if income > 0 else 0
        if expense_ratio < 50:
            score += 15
        elif expense_ratio < 70:
            score += 5
        elif expense_ratio > 90:
            score -= 15
    
    return max(0, min(100, score))


def get_health_category(score):
    """Get health category from score."""
    if score >= 80:
        return 'Excellent'
    elif score >= 60:
        return 'Good'
    elif score >= 40:
        return 'Fair'
    else:
        return 'Poor'


def get_anomaly_recommendation(is_anomaly, ratio):
    """Get recommendation based on anomaly detection."""
    if not is_anomaly:
        return "Your spending is within normal range."
    elif ratio > 2:
        return "This expense is significantly higher than usual. Consider reviewing if it's necessary."
    elif ratio > 1.5:
        return "This expense is higher than your average. Make sure it fits your budget."
    elif ratio < 0.2:
        return "This expense is unusually low. If expected, great job saving!"
    else:
        return "This expense is slightly outside your normal range."


def generate_recommendations(data, health_score):
    """Generate personalized recommendations."""
    recommendations = []
    
    income = data.get('income', data.get('monthly_income', 0))
    expenses = data.get('expenses', data.get('total_monthly_expenses', 0))
    savings_rate = ((income - expenses) / income * 100) if income > 0 else 0
    
    if savings_rate < 10:
        recommendations.append({
            'type': 'savings',
            'priority': 'high',
            'message': 'Try to save at least 10% of your income. Consider cutting discretionary spending.'
        })
    
    if health_score < 50:
        recommendations.append({
            'type': 'health',
            'priority': 'high',
            'message': 'Your financial health needs attention. Focus on building an emergency fund.'
        })
    
    if not recommendations:
        recommendations.append({
            'type': 'general',
            'priority': 'low',
            'message': 'Great job! Keep maintaining your healthy financial habits.'
        })
    
    return recommendations


@app.route('/batch/process-all-users', methods=['POST'])
def batch_process_all_users():
    """Process all users and generate AI insights for each."""
    try:
        data = request.get_json()
        if not data or 'users' not in data:
            return jsonify({'error': 'No users data provided'}), 400
        
        users = data['users']
        results = []
        
        for user in users:
            user_id = user.get('id', 'unknown')
            try:
                # Calculate health score
                health_score = calculate_simple_health_score(user)
                
                # Generate forecast
                forecast = None
                historical = user.get('historical_expenses', [])
                if len(historical) >= 2:
                    avg = sum(historical[-3:]) / min(3, len(historical))
                    trend = 'stable'
                    if len(historical) >= 2:
                        change = (historical[-1] - historical[-2]) / historical[-2] if historical[-2] != 0 else 0
                        if change > 0.05:
                            trend = 'up'
                        elif change < -0.05:
                            trend = 'down'
                    forecast = {
                        'next_month': round(avg, 2),
                        'trend': trend
                    }
                
                # Generate recommendations
                recommendations = generate_recommendations(user, health_score)
                
                results.append({
                    'user_id': user_id,
                    'insights': {
                        'health': {
                            'score': health_score,
                            'category': get_health_category(health_score)
                        },
                        'forecast': forecast,
                        'recommendations': recommendations
                    },
                    'status': 'success'
                })
            except Exception as e:
                results.append({
                    'user_id': user_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        return jsonify({
            'status': 'success',
            'total_processed': len(results),
            'successful': len([r for r in results if r['status'] == 'success']),
            'failed': len([r for r in results if r['status'] == 'error']),
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    load_or_train_models()
    port = int(os.environ.get('PORT', os.environ.get('ML_SERVICE_PORT', 5001)))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    logger.info(f"Starting ML Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
