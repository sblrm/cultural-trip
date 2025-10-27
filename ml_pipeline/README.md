# ML Pipeline

Production-ready Machine Learning pipeline for trip cost prediction using Random Forest.

## Overview

This pipeline trains a Random Forest model on historical trip data and exports it to TensorFlow.js format for browser-side inference.

**Architecture:**
```
[Supabase] → [Python Training] → [TensorFlow.js Model] → [Browser Prediction]
              (scikit-learn)       (Neural Network)        (React App)
```

## Setup

### 1. Install Python Dependencies

```bash
cd ml_pipeline
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Important:** Use the service role key (not anon key) for training, as it needs full database access.

### 3. Generate Training Data

If you don't have enough real trip data yet, generate sample data:

```sql
-- In Supabase SQL Editor
SELECT generate_sample_trip_data(1000);
```

This creates 1000 realistic trip samples for training.

## Usage

### Basic Training

```bash
python train_model.py
```

### Advanced Options

```bash
python train_model.py \
  --min-samples 500 \
  --output-dir ../public/models \
  --n-estimators 200 \
  --max-depth 15
```

**Arguments:**
- `--min-samples`: Minimum training samples required (default: 100)
- `--output-dir`: Output directory for TF.js model (default: ../public/models)
- `--n-estimators`: Number of trees in Random Forest (default: 100)
- `--max-depth`: Maximum depth of trees (default: 10)

### Output

The script generates:

```
public/models/
├── model.json              # TensorFlow.js model
├── group1-shard1of1.bin    # Model weights
└── metadata.json           # Feature names, scaler, encoders
```

## Model Details

### Features

The model uses 14 features:

**Trip Features:**
- `distance` - Route distance in km
- `duration` - Travel duration in minutes
- `optimization_mode` - fastest/cheapest/balanced

**Temporal Features:**
- `hour_of_day` - Departure hour (0-23)
- `day_of_week` - Day of week (0=Sunday, 6=Saturday)
- `is_weekend` - Boolean weekend flag
- `is_holiday` - Boolean holiday flag

**Traffic Features:**
- `traffic_level` - low/medium/high/severe
- `estimated_traffic_delay` - Expected delay in minutes

**Cost Features:**
- `fuel_price` - Current fuel price (Rp/liter)
- `toll_roads_used` - Boolean toll usage

**Environmental Features:**
- `weather_condition` - sunny/rainy/cloudy
- `temperature` - Temperature in °C

**Data Quality:**
- `data_source` - user_reported/gps_tracked/estimated

### Target

- `actual_cost` - Ground truth trip cost (Rp)

### Preprocessing

1. **Encoding:** Categorical features → Label Encoding
2. **Scaling:** Numeric features → StandardScaler (Z-score normalization)
3. **Missing Values:** Filled with sensible defaults
4. **Outliers:** Removed using Z-score threshold (3.0)

### Model Architecture

**Random Forest (Training):**
- 100 trees (default)
- Max depth: 10
- Min samples split: 5
- Min samples leaf: 2

**Neural Network (Inference):**
- Dense(64) + ReLU + Dropout(0.2)
- Dense(32) + ReLU + Dropout(0.2)
- Dense(16) + ReLU
- Dense(1)

The NN is trained to approximate the RF using 10,000 synthetic samples.

## Performance Metrics

The training script reports:

- **MAE (Mean Absolute Error):** Average prediction error in Rp
- **RMSE (Root Mean Squared Error):** Penalizes large errors
- **R² Score:** Proportion of variance explained (0-1)
- **MAPE (Mean Absolute Percentage Error):** Percentage error
- **CV MAE:** Cross-validation MAE (5-fold)

**Target Performance:**
- MAE < Rp 500,000 (±10% for typical Rp 5M trip)
- R² > 0.85
- MAPE < 15%

## Deployment Workflow

### 1. Train Model

```bash
python train_model.py --min-samples 500
```

### 2. Validate Performance

Check metrics in terminal output. If performance is acceptable:

### 3. Mark as Production

```sql
-- In Supabase SQL Editor
UPDATE model_metrics
SET is_production = true, deployed_at = NOW()
WHERE model_version = 'v20240101_120000';
```

### 4. Test in Browser

The frontend will automatically load the latest model from `public/models/`.

### 5. Monitor

Track prediction accuracy in the `prediction_logs` table:

```sql
SELECT
  prediction_method,
  AVG(ABS(actual_cost - predicted_cost)) AS mae,
  COUNT(*) AS predictions
FROM prediction_logs
WHERE actual_cost IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY prediction_method;
```

## Retraining Schedule

Retrain the model regularly to adapt to new patterns:

- **Weekly:** If collecting >100 new trips/week
- **Monthly:** Otherwise
- **Ad-hoc:** When MAPE degrades >5% from baseline

## Troubleshooting

### Error: "No training data found"

Generate sample data:
```sql
SELECT generate_sample_trip_data(1000);
```

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

Add the service role key to `.env`:
```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Warning: "Only X samples available"

Either:
- Generate more sample data
- Use `--min-samples 50` to override
- Collect more real trip data

### Low R² Score (<0.7)

Possible causes:
- Insufficient training data
- Need more features (e.g., vehicle type, driver behavior)
- Increase model complexity (`--n-estimators 200 --max-depth 15`)

## Future Enhancements

- [ ] XGBoost for better performance
- [ ] Real-time model retraining (online learning)
- [ ] A/B testing framework for model comparison
- [ ] Hyperparameter tuning with Grid Search
- [ ] SHAP values for prediction explainability
- [ ] Weather API integration for real-time conditions
- [ ] Vehicle-specific cost models

## References

- [scikit-learn Random Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html)
- [TensorFlow.js Converter](https://www.tensorflow.org/js/guide/conversion)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
