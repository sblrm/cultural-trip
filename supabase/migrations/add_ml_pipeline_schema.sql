-- ============================================================================
-- ML Pipeline: Trip Data Collection Schema
-- ============================================================================
-- Collects real trip data for Random Forest training

-- Create trip_data table for ML training
CREATE TABLE IF NOT EXISTS public.trip_data (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    
    -- Trip identification
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    route_id text, -- Optional: link to saved routes
    
    -- Features (inputs for ML model)
    distance numeric(10, 2) NOT NULL, -- km
    duration integer NOT NULL, -- minutes
    optimization_mode text CHECK (optimization_mode IN ('fastest', 'cheapest', 'balanced')),
    
    -- Time features
    departure_time timestamp with time zone NOT NULL,
    hour_of_day integer CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 6=Sat
    is_weekend boolean,
    is_holiday boolean,
    
    -- Traffic features
    traffic_level text CHECK (traffic_level IN ('low', 'medium', 'high', 'severe')),
    estimated_traffic_delay integer, -- minutes
    
    -- Cost features
    fuel_price numeric(10, 2), -- Rp per liter
    toll_roads_used boolean,
    
    -- Weather features (optional, for future enhancement)
    weather_condition text, -- 'sunny', 'rainy', 'cloudy'
    temperature numeric(5, 2), -- Celsius
    
    -- Target (label for ML model)
    actual_cost numeric(10, 2) NOT NULL, -- Rp (ground truth)
    predicted_cost numeric(10, 2), -- Rp (from rule-based or previous ML)
    
    -- Cost breakdown (for analysis)
    fuel_cost numeric(10, 2),
    toll_cost numeric(10, 2),
    parking_cost numeric(10, 2),
    other_costs numeric(10, 2),
    
    -- Metadata
    data_source text CHECK (data_source IN ('user_reported', 'gps_tracked', 'estimated')),
    prediction_method text CHECK (prediction_method IN ('rule_based', 'ml_model', 'hybrid')),
    model_version text, -- e.g., 'v1.0.0'
    confidence_score numeric(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Trip completion
    completed boolean DEFAULT false,
    completion_time timestamp with time zone,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.trip_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own trip data" ON public.trip_data;
CREATE POLICY "Users can view their own trip data"
ON public.trip_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trip data" ON public.trip_data;
CREATE POLICY "Users can insert their own trip data"
ON public.trip_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can view all trip data for training" ON public.trip_data;
CREATE POLICY "System can view all trip data for training"
ON public.trip_data FOR SELECT
TO service_role
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS trip_data_user_id_idx ON public.trip_data(user_id);
CREATE INDEX IF NOT EXISTS trip_data_completed_idx ON public.trip_data(completed);
CREATE INDEX IF NOT EXISTS trip_data_departure_time_idx ON public.trip_data(departure_time);
CREATE INDEX IF NOT EXISTS trip_data_optimization_mode_idx ON public.trip_data(optimization_mode);
CREATE INDEX IF NOT EXISTS trip_data_created_at_idx ON public.trip_data(created_at DESC);

-- Composite index for ML training queries
CREATE INDEX IF NOT EXISTS trip_data_ml_training_idx 
ON public.trip_data(completed, data_source, created_at) 
WHERE completed = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at ON public.trip_data;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.trip_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ML Training View
-- ============================================================================
-- Pre-processed view for ML training with clean features

CREATE OR REPLACE VIEW public.ml_training_data AS
SELECT 
    id,
    
    -- Features
    distance,
    duration,
    CASE 
        WHEN optimization_mode = 'fastest' THEN 2
        WHEN optimization_mode = 'cheapest' THEN 0
        ELSE 1 -- balanced
    END as mode_encoded,
    
    hour_of_day,
    day_of_week,
    CASE WHEN is_weekend THEN 1 ELSE 0 END as is_weekend_encoded,
    CASE WHEN is_holiday THEN 1 ELSE 0 END as is_holiday_encoded,
    
    CASE 
        WHEN traffic_level = 'low' THEN 0
        WHEN traffic_level = 'medium' THEN 1
        WHEN traffic_level = 'high' THEN 2
        ELSE 3 -- severe
    END as traffic_encoded,
    
    COALESCE(estimated_traffic_delay, 0) as traffic_delay,
    COALESCE(fuel_price, 10000) as fuel_price,
    CASE WHEN toll_roads_used THEN 1 ELSE 0 END as toll_used,
    
    -- Target
    actual_cost as label,
    
    -- Metadata
    created_at
FROM public.trip_data
WHERE completed = true 
    AND actual_cost IS NOT NULL
    AND actual_cost > 0
    AND data_source IN ('user_reported', 'gps_tracked')
    -- Exclude outliers (3 sigma rule)
    AND actual_cost BETWEEN 10000 AND 50000000
ORDER BY created_at DESC;

-- Grant access
GRANT SELECT ON public.ml_training_data TO authenticated, service_role;

-- ============================================================================
-- Model Metrics Table
-- ============================================================================
-- Track model performance over time

CREATE TABLE IF NOT EXISTS public.model_metrics (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    
    model_version text NOT NULL,
    model_type text CHECK (model_type IN ('random_forest', 'linear_regression', 'neural_network')),
    
    -- Training metrics
    training_samples integer,
    test_samples integer,
    training_date timestamp with time zone NOT NULL,
    
    -- Performance metrics
    mae numeric(10, 2), -- Mean Absolute Error
    rmse numeric(10, 2), -- Root Mean Square Error
    r2_score numeric(5, 4), -- R-squared
    mape numeric(5, 2), -- Mean Absolute Percentage Error
    
    -- Feature importance (JSON)
    feature_importance jsonb,
    
    -- Model metadata
    hyperparameters jsonb,
    model_file_path text,
    model_size_kb integer,
    
    -- Deployment
    is_production boolean DEFAULT false,
    deployed_at timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for finding production model
CREATE INDEX IF NOT EXISTS model_metrics_production_idx 
ON public.model_metrics(is_production, model_version) 
WHERE is_production = true;

-- ============================================================================
-- Prediction Logs Table
-- ============================================================================
-- Log all predictions for monitoring and debugging

CREATE TABLE IF NOT EXISTS public.prediction_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    
    trip_data_id bigint REFERENCES public.trip_data(id),
    
    -- Input features (JSON for flexibility)
    features jsonb NOT NULL,
    
    -- Prediction
    predicted_cost numeric(10, 2) NOT NULL,
    prediction_method text CHECK (prediction_method IN ('rule_based', 'ml_model', 'hybrid')),
    model_version text,
    confidence_score numeric(3, 2),
    
    -- Timing
    prediction_time_ms integer, -- milliseconds
    
    -- Actual (filled later when trip completes)
    actual_cost numeric(10, 2),
    prediction_error numeric(10, 2), -- actual - predicted
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for error analysis
CREATE INDEX IF NOT EXISTS prediction_logs_created_at_idx ON public.prediction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS prediction_logs_method_idx ON public.prediction_logs(prediction_method);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate prediction error
CREATE OR REPLACE FUNCTION calculate_prediction_error()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_cost IS NOT NULL AND NEW.predicted_cost IS NOT NULL THEN
        NEW.prediction_error := NEW.actual_cost - NEW.predicted_cost;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_error_on_update ON public.prediction_logs;
CREATE TRIGGER calculate_error_on_update
    BEFORE UPDATE ON public.prediction_logs
    FOR EACH ROW
    WHEN (NEW.actual_cost IS NOT NULL)
    EXECUTE FUNCTION calculate_prediction_error();

-- ============================================================================
-- Sample Data Generator (for testing)
-- ============================================================================
-- Insert sample trip data for ML training

-- Function to generate random trip data
CREATE OR REPLACE FUNCTION generate_sample_trip_data(sample_count integer)
RETURNS void AS $$
DECLARE
    i integer;
    random_distance numeric;
    random_hour integer;
    random_day integer;
    base_cost numeric;
BEGIN
    FOR i IN 1..sample_count LOOP
        random_distance := 50 + (random() * 400); -- 50-450 km
        random_hour := floor(random() * 24)::integer;
        random_day := floor(random() * 7)::integer;
        
        -- Simplified cost calculation
        base_cost := 50000 + (random_distance * (2000 + random() * 4000));
        
        INSERT INTO public.trip_data (
            distance,
            duration,
            optimization_mode,
            departure_time,
            hour_of_day,
            day_of_week,
            is_weekend,
            is_holiday,
            traffic_level,
            fuel_price,
            toll_roads_used,
            actual_cost,
            predicted_cost,
            data_source,
            prediction_method,
            completed
        ) VALUES (
            random_distance,
            (random_distance / (30 + random() * 30))::integer * 60, -- duration
            (ARRAY['fastest', 'cheapest', 'balanced'])[floor(random() * 3 + 1)],
            now() - (random() * interval '90 days'),
            random_hour,
            random_day,
            random_day IN (0, 6),
            false,
            (ARRAY['low', 'medium', 'high', 'severe'])[floor(random() * 4 + 1)],
            9500 + (random() * 1000),
            random() > 0.5,
            base_cost * (0.8 + random() * 0.4), -- ±20% variance
            base_cost,
            'estimated',
            'rule_based',
            true
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Then generate sample data: SELECT generate_sample_trip_data(1000);
