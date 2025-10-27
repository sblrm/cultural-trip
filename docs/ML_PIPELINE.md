# ML Pipeline - Full Implementation Documentation

## 🎯 Overview

Production-ready Machine Learning pipeline for intelligent trip cost prediction using **Random Forest** regression with **TensorFlow.js** browser-side inference and **hybrid fallback logic**.

**Architecture:**
```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  User Trip  │────▶│ Data Collect │────▶│ Training Data  │────▶│ Python Train │
│  Planning   │     │  (TS/React)  │     │   (Supabase)   │     │ (sklearn RF) │
└─────────────┘     └──────────────┘     └────────────────┘     └──────────────┘
                                                                          │
                                                                          ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   Display   │◀────│    Hybrid    │◀────│   TF.js Model  │◀────│  Export NN   │
│   Results   │     │  Prediction  │     │  (Browser ML)  │     │  (TF.js fmt) │
└─────────────┘     └──────────────┘     └────────────────┘     └──────────────┘
```

---

## 📁 Project Structure

```
CulturalTrip/
├── src/
│   ├── services/
│   │   ├── mlDataCollection.ts      # Data collection & logging
│   │   ├── mlPrediction.ts          # TensorFlow.js inference
│   │   ├── hybridPrediction.ts      # ML + Rule-based hybrid
│   │   ├── dynamicPricing.ts        # Rule-based pricing (fallback)
│   │   └── openRouteService.ts      # Real-time routing data
│   └── pages/
│       └── PlannerPage.tsx           # Integrated ML data collection
│
├── ml_pipeline/
│   ├── train_model.py                # Random Forest training script
│   ├── requirements.txt              # Python dependencies
│   └── README.md                     # Training documentation
│
├── supabase/
│   └── migrations/
│       ├── add_ml_pipeline_schema.sql    # ML tables schema
│       └── fix_reviews_foreign_key.sql   # FK fix for reviews
│
├── public/
│   └── models/
│       ├── model.json                # TensorFlow.js model
│       ├── group1-shard1of1.bin      # Model weights
│       └── metadata.json             # Feature names, scaler, encoders
│
└── docs/
    ├── ML_PIPELINE.md                # This file
    ├── EXTERNAL_APIS.md              # OpenRouteService docs
    └── SETUP_ENHANCED_PRICING.md     # Pricing setup guide
```

---

## 🚀 Quick Start

### 1. Database Setup

Run SQL migrations in Supabase:

```sql
-- 1. Create ML pipeline tables
-- Execute: supabase/migrations/add_ml_pipeline_schema.sql

-- 2. Generate sample training data (optional)
SELECT generate_sample_trip_data(1000);

-- 3. Verify data
SELECT COUNT(*) FROM trip_data;
SELECT * FROM ml_training_data LIMIT 10;
```

### 2. Python Environment Setup

```bash
cd ml_pipeline

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Add to `.env`:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For training only!

# OpenRouteService (for real-time data)
VITE_ORS_API_KEY=your_ors_api_key
```

⚠️ **Security Note:** Use service role key only for training (server-side), never in frontend!

### 4. Train Model

```bash
# Basic training (requires 100+ samples)
python train_model.py

# Advanced options
python train_model.py \
  --min-samples 500 \
  --output-dir ../public/models \
  --n-estimators 200 \
  --max-depth 15
```

**Output:**
```
🚀 Training Random Forest model...
Training on 800 samples, testing on 200 samples

📊 Training Results:
  Test MAE:  Rp 421,543
  Test RMSE: Rp 598,721
  Test R²:   0.8912
  Test MAPE: 12.34%

  CV MAE:    Rp 438,091 ± 45,287

📈 Top 5 Feature Importances:
  distance                      : 0.3421
  duration                      : 0.2134
  traffic_level                 : 0.1567
  hour_of_day                   : 0.0921
  fuel_price                    : 0.0789

✅ Training complete! Model version: v20240115_143022
```

### 5. Deploy Model

```sql
-- Mark model as production
UPDATE model_metrics
SET is_production = true, deployed_at = NOW()
WHERE model_version = 'v20240115_143022';
```

### 6. Frontend Integration

Install TensorFlow.js:

```bash
npm install @tensorflow/tfjs
# or
bun add @tensorflow/tfjs
```

The model is automatically loaded at runtime from `/public/models/`.

---

## 🏗️ Architecture Details

### 1. Data Collection Layer

**File:** `src/services/mlDataCollection.ts`

**Functions:**
- `saveTripData()` - Save trip features + predicted cost
- `completeTripData()` - Update with actual cost after trip
- `logPrediction()` - Log all predictions for monitoring
- `getMLTrainingData()` - Fetch training dataset
- `calculateAccuracyMetrics()` - Compute MAE, RMSE, MAPE

**Integration:** Automatically collects data in `PlannerPage.tsx` when user plans a route.

**Data Flow:**
```typescript
// In PlannerPage.tsx
const route = await findOptimalRoute(...);

// Save trip data for ML training
await saveTripData({
  distance: route.totalDistance,
  duration: route.totalDuration,
  optimizationMode,
  departureTime,
  fuelPrice: getCurrentFuelPrice(),
  actualCost: route.totalCost,      // Initially predicted
  predictedCost: route.totalCost,
  predictionMethod: 'rule_based',   // or 'ml_model' or 'hybrid'
});
```

### 2. Training Pipeline

**File:** `ml_pipeline/train_model.py`

**Process:**
1. **Fetch Data** - Load from `ml_training_data` view (Supabase)
2. **Preprocess**
   - Label encode categorical features
   - StandardScaler for numeric features
   - Fill missing values
   - Remove outliers (Z-score > 3)
3. **Train Random Forest**
   - 100 trees (default)
   - Max depth 10
   - 5-fold cross-validation
4. **Export to TensorFlow.js**
   - Train Neural Network to approximate RF
   - Export model.json + weights
   - Save metadata (scaler, encoders)
5. **Save Metrics** - Store performance in `model_metrics` table

**Features (14 total):**
```python
features = [
    'distance',              # km
    'duration',              # minutes
    'optimization_mode',     # fastest/cheapest/balanced
    'hour_of_day',           # 0-23
    'day_of_week',           # 0-6 (0=Sunday)
    'is_weekend',            # boolean
    'is_holiday',            # boolean
    'traffic_level',         # low/medium/high/severe
    'estimated_traffic_delay', # minutes
    'fuel_price',            # Rp/liter
    'toll_roads_used',       # boolean
    'weather_condition',     # sunny/rainy/cloudy
    'temperature',           # °C
    'data_source',           # user_reported/gps_tracked/estimated
]
```

**Target:** `actual_cost` (Rp)

### 3. Inference Layer

**File:** `src/services/mlPrediction.ts`

**Key Components:**
- `MLCostPredictor` class
  - `loadModel()` - Load TF.js model from `/models/`
  - `predict()` - Make predictions
  - `preprocessFeatures()` - Apply same scaling/encoding as training
  - `calculateConfidence()` - Estimate prediction confidence

**Usage:**
```typescript
import { predictCostML, initializeMLModel } from '@/services/mlPrediction';

// Initialize once at app startup
await initializeMLModel();

// Make prediction
const result = await predictCostML({
  distance: 450,
  duration: 360,
  optimizationMode: 'balanced',
  hourOfDay: 14,
  dayOfWeek: 3,
  isWeekend: false,
  isHoliday: false,
  trafficLevel: 'medium',
  estimatedTrafficDelay: 15,
  fuelPrice: 10500,
  tollRoadsUsed: true,
  dataSource: 'gps_tracked',
});

console.log(`Predicted: Rp ${result.predictedCost.toLocaleString()}`);
console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
```

### 4. Hybrid Prediction Layer

**File:** `src/services/hybridPrediction.ts`

**Strategy:**
```
┌────────────────────────────────────────────────────┐
│                Hybrid Decision Tree                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ML Model Available?                              │
│  ├─ NO  ──▶ Use Rule-Based (confidence: 0.8)     │
│  └─ YES                                           │
│      │                                            │
│      ML Confidence >= 0.7?                        │
│      ├─ NO  ──▶ Use Rule-Based (confidence: 0.8) │
│      └─ YES                                       │
│          │                                        │
│          ML vs Rule difference > 50%?             │
│          ├─ YES ──▶ Use Hybrid (weighted avg)    │
│          └─ NO  ──▶ Use ML (high confidence)     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Configuration:**
```typescript
const HYBRID_CONFIG = {
  ML_CONFIDENCE_THRESHOLD: 0.7,      // Use ML if confidence >= 70%
  MAX_DIFFERENCE_PERCENT: 50,        // Sanity check threshold
  HYBRID_ML_WEIGHT: 0.7,             // 70% ML, 30% rule in hybrid
  ENABLE_SANITY_CHECK: true,         // Enable discrepancy detection
};
```

**Usage:**
```typescript
import { predictCostHybrid } from '@/services/hybridPrediction';

const result = await predictCostHybrid(
  mlInput,
  distance,
  duration,
  departureTime
);

console.log(`Method: ${result.method}`);        // 'ml_model' | 'rule_based' | 'hybrid'
console.log(`Cost: Rp ${result.finalCost}`);
console.log(`Reason: ${result.reason}`);
console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
```

---

## 📊 Database Schema

### trip_data

Training data storage.

```sql
CREATE TABLE trip_data (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  
  -- Features
  distance numeric(10,2),              -- km
  duration integer,                     -- minutes
  optimization_mode text,               -- fastest/cheapest/balanced
  hour_of_day integer,                  -- 0-23
  day_of_week integer,                  -- 0-6
  is_weekend boolean,
  is_holiday boolean,
  traffic_level text,                   -- low/medium/high/severe
  estimated_traffic_delay integer,      -- minutes
  fuel_price numeric(10,2),             -- Rp/liter
  toll_roads_used boolean,
  weather_condition text,               -- sunny/rainy/cloudy
  temperature numeric(4,1),             -- °C
  
  -- Target
  actual_cost numeric(10,2) NOT NULL,  -- Ground truth
  predicted_cost numeric(10,2),         -- From model/rule
  
  -- Cost breakdown
  fuel_cost numeric(10,2),
  toll_cost numeric(10,2),
  parking_cost numeric(10,2),
  other_costs numeric(10,2),
  
  -- Metadata
  data_source text,                     -- user_reported/gps_tracked/estimated
  prediction_method text,               -- rule_based/ml_model/hybrid
  model_version text,
  confidence_score numeric(3,2),        -- 0-1
  
  completed boolean DEFAULT false,
  completion_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### model_metrics

Track model performance over time.

```sql
CREATE TABLE model_metrics (
  id bigserial PRIMARY KEY,
  model_version text NOT NULL UNIQUE,
  model_type text DEFAULT 'random_forest',
  n_samples integer,
  n_features integer,
  
  -- Performance metrics
  mae numeric(10,2),                    -- Mean Absolute Error
  rmse numeric(10,2),                   -- Root Mean Squared Error
  r2_score numeric(5,4),                -- R² Score
  mape numeric(5,2),                    -- Mean Absolute Percentage Error
  
  -- Additional metrics
  feature_importance jsonb,             -- Feature importance scores
  training_metrics jsonb,               -- Full training logs
  
  -- Deployment
  is_production boolean DEFAULT false,
  deployed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now()
);
```

### prediction_logs

Log all predictions for monitoring.

```sql
CREATE TABLE prediction_logs (
  id bigserial PRIMARY KEY,
  trip_data_id bigint REFERENCES trip_data(id),
  
  features jsonb NOT NULL,              -- Input features
  predicted_cost numeric(10,2),
  actual_cost numeric(10,2),            -- Filled later
  prediction_error numeric(10,2),       -- |actual - predicted|
  
  prediction_method text,               -- rule_based/ml_model/hybrid
  model_version text,
  confidence_score numeric(3,2),
  prediction_time_ms integer,
  
  created_at timestamp with time zone DEFAULT now()
);
```

### ml_training_data (View)

Pre-processed view for training.

```sql
CREATE VIEW ml_training_data AS
SELECT
  td.*,
  -- Encoded features (example)
  CASE optimization_mode
    WHEN 'fastest' THEN 0
    WHEN 'cheapest' THEN 1
    WHEN 'balanced' THEN 2
  END AS optimization_mode_encoded
FROM trip_data td
WHERE td.completed = true
  AND td.actual_cost IS NOT NULL
  AND td.actual_cost > 0
  AND td.distance > 0
  AND td.duration > 0;
```

---

## 🎯 Performance Metrics

### Target Performance

| Metric | Target | Description |
|--------|--------|-------------|
| **MAE** | < Rp 500k | Average error (for ~Rp 5M trip = 10%) |
| **RMSE** | < Rp 700k | Penalizes large errors |
| **R²** | > 0.85 | Variance explained (higher = better) |
| **MAPE** | < 15% | Percentage error |

### Monitoring

Check model performance:

```sql
-- Current production model
SELECT * FROM model_metrics
WHERE is_production = true
ORDER BY deployed_at DESC LIMIT 1;

-- Recent prediction accuracy
SELECT
  prediction_method,
  COUNT(*) as predictions,
  AVG(ABS(actual_cost - predicted_cost)) as mae,
  SQRT(AVG(POWER(actual_cost - predicted_cost, 2))) as rmse
FROM prediction_logs
WHERE actual_cost IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY prediction_method;

-- Feature importance
SELECT
  jsonb_object_keys(feature_importance) as feature,
  (feature_importance->>jsonb_object_keys(feature_importance))::numeric as importance
FROM model_metrics
WHERE is_production = true
ORDER BY importance DESC;
```

---

## 🔄 Retraining Workflow

### When to Retrain

- **Weekly**: If collecting >100 new trips/week
- **Monthly**: Otherwise
- **Ad-hoc**: When MAPE degrades >5% from baseline

### Retraining Steps

```bash
# 1. Fetch latest data
python train_model.py --min-samples 500

# 2. Review metrics
# Check terminal output for MAE, RMSE, R²

# 3. Test in staging
# Deploy to staging environment first

# 4. A/B test (optional)
# Compare old vs new model performance

# 5. Deploy to production
```

```sql
-- Mark as production
UPDATE model_metrics
SET is_production = true, deployed_at = NOW()
WHERE model_version = 'v20240115_143022';

-- Archive old model
UPDATE model_metrics
SET is_production = false
WHERE model_version != 'v20240115_143022';
```

---

## 🛠️ Troubleshooting

### Issue: "No training data found"

**Solution:**
```sql
SELECT generate_sample_trip_data(1000);
```

### Issue: "Model not loading in browser"

**Check:**
1. Files exist: `/public/models/model.json`, `metadata.json`
2. CORS not blocking requests
3. Browser console for errors

**Fix:**
```bash
# Verify files
ls -lh public/models/

# Re-export model
cd ml_pipeline
python train_model.py --output-dir ../public/models
```

### Issue: Low R² score (<0.7)

**Possible causes:**
- Insufficient training data
- Need more features
- Overly complex/simple model

**Solutions:**
```bash
# Increase model complexity
python train_model.py --n-estimators 200 --max-depth 15

# Check feature importance
# Add features with high predictive power
```

### Issue: Large discrepancy between ML and rule-based

**Check:**
1. Input features match training data distribution
2. Model is not overfitting (train vs test performance)
3. Rule-based pricing is correctly configured

**Action:**
- System automatically uses hybrid approach
- Review prediction_logs for patterns

---

## 📈 Future Enhancements

### Short-term
- [ ] Add vehicle type feature (car/motorcycle/bus)
- [ ] Integrate real-time weather API
- [ ] Collect driver behavior patterns
- [ ] Add route complexity score

### Medium-term
- [ ] XGBoost/LightGBM for better performance
- [ ] Online learning (incremental updates)
- [ ] A/B testing framework
- [ ] SHAP values for explainability

### Long-term
- [ ] Multi-model ensemble
- [ ] Deep learning (LSTM for time-series)
- [ ] Personalized cost models per user
- [ ] Real-time model retraining pipeline

---

## 🔐 Security Considerations

1. **Service Role Key**
   - Use only for training (server-side)
   - Never expose in frontend code
   - Rotate regularly

2. **RLS Policies**
   - Users see only their own trip data
   - Service role can access all for training
   - Prediction logs are public (anonymized)

3. **Model Versioning**
   - Track all model versions
   - Rollback capability
   - Audit trail in `model_metrics`

---

## 📝 API Reference

### Data Collection

```typescript
// Save trip data
const trip = await saveTripData({
  distance: 450,
  duration: 360,
  optimizationMode: 'balanced',
  departureTime: new Date(),
  fuelPrice: 10500,
  tollRoadsUsed: true,
  actualCost: 4500000,
  predictedCost: 4350000,
  dataSource: 'gps_tracked',
  predictionMethod: 'ml_model',
  modelVersion: 'v20240115_143022',
  confidenceScore: 0.87,
});

// Mark completed
await completeTripData(trip.id, 4600000, {
  fuelCost: 2000000,
  tollCost: 1500000,
  parkingCost: 100000,
});

// Log prediction
await logPrediction(
  { distance: 450, duration: 360, ... },
  4350000,
  'ml_model',
  'v20240115_143022',
  0.87,
  125
);
```

### ML Prediction

```typescript
// Initialize (once)
await initializeMLModel();

// Predict
const result = await predictCostML({
  distance: 450,
  duration: 360,
  optimizationMode: 'balanced',
  hourOfDay: 14,
  dayOfWeek: 3,
  isWeekend: false,
  isHoliday: false,
  trafficLevel: 'medium',
  estimatedTrafficDelay: 15,
  fuelPrice: 10500,
  tollRoadsUsed: true,
  dataSource: 'gps_tracked',
});
// => { predictedCost: 4350000, confidence: 0.87, ... }
```

### Hybrid Prediction

```typescript
const result = await predictCostHybrid(
  mlInput,
  450,
  360,
  new Date()
);
// => {
//   finalCost: 4350000,
//   method: 'ml_model',
//   confidence: 0.87,
//   reason: 'High ML confidence (87%)',
//   mlPrediction: { ... },
//   rulePrediction: { ... }
// }
```

---

## 📚 References

- [scikit-learn Random Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [TensorFlow.js Converter](https://www.tensorflow.org/js/guide/conversion)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [Feature Engineering for ML](https://developers.google.com/machine-learning/crash-course/representation/feature-engineering)

---

## 🎉 Summary

**Completed Implementation:**
✅ Data collection schema (SQL)
✅ TypeScript data collection service
✅ Python training pipeline (Random Forest)
✅ TensorFlow.js inference service
✅ Hybrid prediction with fallback logic
✅ Comprehensive documentation

**Ready for Production!** 🚀

Follow the Quick Start guide to train your first model and start making ML-powered predictions.
