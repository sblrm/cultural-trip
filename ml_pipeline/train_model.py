#!/usr/bin/env python3
"""
ML Pipeline: Random Forest Training Script

Trains a Random Forest model on trip data and exports to TensorFlow.js format.

Requirements:
    pip install scikit-learn pandas numpy supabase tensorflowjs python-dotenv

Usage:
    python train_model.py --min-samples 100 --output-dir ../public/models
"""

import os
import json
import argparse
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import tensorflowjs as tfjs
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")  # Need service role for full access

class TripCostPredictor:
    """Random Forest model for predicting trip costs"""
    
    def __init__(self, n_estimators: int = 100, max_depth: int = 10, random_state: int = 42):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1  # Use all CPU cores
        )
        self.scaler = StandardScaler()
        self.encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []
        self.model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    def prepare_features(self, df: pd.DataFrame, fit: bool = False) -> np.ndarray:
        """
        Prepare features for training or prediction
        
        Args:
            df: DataFrame with raw features
            fit: If True, fit encoders and scaler (training mode)
        
        Returns:
            Numpy array of processed features
        """
        df = df.copy()
        
        # Categorical features to encode
        categorical_features = ['optimization_mode', 'traffic_level', 'weather_condition', 'data_source']
        
        for col in categorical_features:
            if col in df.columns:
                if fit:
                    self.encoders[col] = LabelEncoder()
                    df[col] = self.encoders[col].fit_transform(df[col].fillna('unknown'))
                else:
                    # Handle unseen categories
                    df[col] = df[col].fillna('unknown')
                    df[col] = df[col].apply(
                        lambda x: x if x in self.encoders[col].classes_ else 'unknown'
                    )
                    df[col] = self.encoders[col].transform(df[col])
        
        # Select numeric features
        feature_cols = [
            'distance', 'duration', 'optimization_mode',
            'hour_of_day', 'day_of_week', 'is_weekend', 'is_holiday',
            'traffic_level', 'estimated_traffic_delay',
            'fuel_price', 'toll_roads_used',
            'weather_condition', 'temperature',
            'data_source'
        ]
        
        # Filter available features
        available_features = [col for col in feature_cols if col in df.columns]
        
        if fit:
            self.feature_names = available_features
        
        X = df[available_features].copy()
        
        # Fill missing values
        X = X.fillna({
            'estimated_traffic_delay': 0,
            'temperature': 28,  # Average Indonesia temp
            'toll_roads_used': 1,
        })
        
        # Convert boolean to int
        if 'is_weekend' in X.columns:
            X['is_weekend'] = X['is_weekend'].astype(int)
        if 'is_holiday' in X.columns:
            X['is_holiday'] = X['is_holiday'].astype(int)
        if 'toll_roads_used' in X.columns:
            X['toll_roads_used'] = X['toll_roads_used'].astype(int)
        
        # Scale features
        if fit:
            X_scaled = self.scaler.fit_transform(X)
        else:
            X_scaled = self.scaler.transform(X)
        
        return X_scaled
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        Train Random Forest model
        
        Returns:
            Dictionary of training metrics
        """
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        # Calculate metrics
        metrics = {
            'train_mae': mean_absolute_error(y_train, y_train_pred),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
            'train_r2': r2_score(y_train, y_train_pred),
            'train_mape': np.mean(np.abs((y_train - y_train_pred) / y_train)) * 100,
            
            'test_mae': mean_absolute_error(y_test, y_test_pred),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
            'test_r2': r2_score(y_test, y_test_pred),
            'test_mape': np.mean(np.abs((y_test - y_test_pred) / y_test)) * 100,
        }
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X, y, cv=5, scoring='neg_mean_absolute_error', n_jobs=-1
        )
        metrics['cv_mae'] = -cv_scores.mean()
        metrics['cv_mae_std'] = cv_scores.std()
        
        # Feature importance
        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        metrics['feature_importance'] = feature_importance
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        return self.model.predict(X)
    
    def save_to_tfjs(self, output_dir: str):
        """
        Export model to TensorFlow.js format
        
        Note: Random Forest cannot be directly exported to TF.js.
        We'll create a neural network that approximates the RF.
        """
        import tensorflow as tf
        from tensorflow import keras
        
        print("Creating neural network approximation of Random Forest...")
        
        # Generate synthetic data from RF for NN training
        n_samples = 10000
        X_synthetic = np.random.randn(n_samples, len(self.feature_names))
        y_synthetic = self.model.predict(X_synthetic)
        
        # Build neural network
        nn_model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(len(self.feature_names),)),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation='relu'),
            keras.layers.Dense(1)
        ])
        
        nn_model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        # Train NN to mimic RF
        nn_model.fit(
            X_synthetic, y_synthetic,
            epochs=50,
            batch_size=32,
            verbose=0,
            validation_split=0.2
        )
        
        # Save to TF.js format
        os.makedirs(output_dir, exist_ok=True)
        tfjs.converters.save_keras_model(nn_model, output_dir)
        
        print(f"✅ Neural network model saved to {output_dir}")
        
        # Save metadata
        metadata = {
            'model_version': self.model_version,
            'created_at': datetime.now().isoformat(),
            'feature_names': self.feature_names,
            'scaler_mean': self.scaler.mean_.tolist(),
            'scaler_scale': self.scaler.scale_.tolist(),
            'encoders': {
                name: {
                    'classes': encoder.classes_.tolist()
                }
                for name, encoder in self.encoders.items()
            }
        }
        
        with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Metadata saved to {output_dir}/metadata.json")


def fetch_training_data(supabase: Client, min_samples: int = 100) -> pd.DataFrame:
    """
    Fetch training data from Supabase
    
    Args:
        supabase: Supabase client
        min_samples: Minimum number of samples required
    
    Returns:
        DataFrame with training data
    """
    print(f"Fetching training data from Supabase...")
    
    # Fetch from ml_training_data view
    response = supabase.table('ml_training_data').select('*').execute()
    
    if not response.data:
        raise ValueError("No training data found in database")
    
    df = pd.DataFrame(response.data)
    
    print(f"Fetched {len(df)} samples")
    
    if len(df) < min_samples:
        print(f"⚠️  Warning: Only {len(df)} samples available, recommended minimum is {min_samples}")
        print("Consider generating sample data with: SELECT generate_sample_trip_data(1000);")
    
    # Remove outliers (optional)
    df = remove_outliers(df)
    
    print(f"After outlier removal: {len(df)} samples")
    
    return df


def remove_outliers(df: pd.DataFrame, z_threshold: float = 3.0) -> pd.DataFrame:
    """Remove outliers using Z-score method"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_cols:
        if col not in ['id', 'user_id']:
            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
            df = df[z_scores < z_threshold]
    
    return df


def save_metrics_to_supabase(
    supabase: Client,
    model_version: str,
    metrics: Dict[str, float],
    n_samples: int
):
    """Save model metrics to Supabase"""
    print("Saving metrics to database...")
    
    # Extract feature importance
    feature_importance = metrics.pop('feature_importance', {})
    
    data = {
        'model_version': model_version,
        'model_type': 'random_forest',
        'n_samples': n_samples,
        'n_features': len(feature_importance),
        'mae': metrics['test_mae'],
        'rmse': metrics['test_rmse'],
        'r2_score': metrics['test_r2'],
        'mape': metrics['test_mape'],
        'feature_importance': feature_importance,
        'training_metrics': metrics,
        'is_production': False,  # Set to true manually after validation
    }
    
    response = supabase.table('model_metrics').insert(data).execute()
    
    print(f"✅ Metrics saved to database (ID: {response.data[0]['id']})")


def main():
    parser = argparse.ArgumentParser(description='Train Random Forest model for trip cost prediction')
    parser.add_argument('--min-samples', type=int, default=100, help='Minimum training samples required')
    parser.add_argument('--output-dir', type=str, default='../public/models', help='Output directory for TF.js model')
    parser.add_argument('--n-estimators', type=int, default=100, help='Number of trees in Random Forest')
    parser.add_argument('--max-depth', type=int, default=10, help='Maximum depth of trees')
    
    args = parser.parse_args()
    
    # Check environment variables
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Fetch training data
    df = fetch_training_data(supabase, min_samples=args.min_samples)
    
    # Prepare features and target
    predictor = TripCostPredictor(
        n_estimators=args.n_estimators,
        max_depth=args.max_depth
    )
    
    X = predictor.prepare_features(df, fit=True)
    y = df['actual_cost'].values
    
    print(f"\nFeatures: {predictor.feature_names}")
    print(f"Target: actual_cost (shape: {y.shape})")
    
    # Train model
    print("\n🚀 Training Random Forest model...")
    metrics = predictor.train(X, y)
    
    # Print metrics
    print("\n📊 Training Results:")
    print(f"  Test MAE:  Rp {metrics['test_mae']:,.0f}")
    print(f"  Test RMSE: Rp {metrics['test_rmse']:,.0f}")
    print(f"  Test R²:   {metrics['test_r2']:.4f}")
    print(f"  Test MAPE: {metrics['test_mape']:.2f}%")
    print(f"\n  CV MAE:    Rp {metrics['cv_mae']:,.0f} ± {metrics['cv_mae_std']:,.0f}")
    
    print("\n📈 Top 5 Feature Importances:")
    feature_importance = metrics['feature_importance']
    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    for feat, importance in sorted_features[:5]:
        print(f"  {feat:30s}: {importance:.4f}")
    
    # Save to TensorFlow.js
    print(f"\n💾 Exporting to TensorFlow.js format...")
    predictor.save_to_tfjs(args.output_dir)
    
    # Save metrics to database
    save_metrics_to_supabase(
        supabase,
        predictor.model_version,
        metrics,
        len(df)
    )
    
    print(f"\n✅ Training complete! Model version: {predictor.model_version}")
    print(f"\nNext steps:")
    print(f"  1. Test the model in browser")
    print(f"  2. If performance is good, mark as production in database:")
    print(f"     UPDATE model_metrics SET is_production = true WHERE model_version = '{predictor.model_version}';")
    print(f"  3. Deploy the model to your frontend")


if __name__ == '__main__':
    main()
