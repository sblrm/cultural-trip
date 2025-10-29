-- ============================================================================
-- Add RLS Policies for ML Pipeline Tables
-- Fix: "new row violates row-level security policy for table prediction_logs"
-- ============================================================================

-- Enable RLS on ML tables
ALTER TABLE public.trip_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================

-- Drop existing trip_data policies
DROP POLICY IF EXISTS "Users can insert their own trip data" ON public.trip_data;
DROP POLICY IF EXISTS "Users can view their own trip data" ON public.trip_data;
DROP POLICY IF EXISTS "Users can update their own trip data" ON public.trip_data;
DROP POLICY IF EXISTS "Service role can insert trip data" ON public.trip_data;
DROP POLICY IF EXISTS "Service role can view all trip data" ON public.trip_data;
DROP POLICY IF EXISTS "Anonymous users can insert trip data" ON public.trip_data;

-- Drop existing prediction_logs policies
DROP POLICY IF EXISTS "Users can insert prediction logs" ON public.prediction_logs;
DROP POLICY IF EXISTS "Users can view prediction logs" ON public.prediction_logs;
DROP POLICY IF EXISTS "Service role can manage prediction logs" ON public.prediction_logs;
DROP POLICY IF EXISTS "Anonymous users can insert prediction logs" ON public.prediction_logs;
DROP POLICY IF EXISTS "System can update prediction logs" ON public.prediction_logs;

-- ============================================================================
-- TRIP_DATA POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to insert their own trip data
CREATE POLICY "Users can insert their own trip data"
ON public.trip_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to view their own trip data
CREATE POLICY "Users can view their own trip data"
ON public.trip_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own trip data
CREATE POLICY "Users can update their own trip data"
ON public.trip_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow system/service role to insert trip data (for ML pipeline)
CREATE POLICY "Service role can insert trip data"
ON public.trip_data
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Allow system/service role to view all trip data (for ML training)
CREATE POLICY "Service role can view all trip data"
ON public.trip_data
FOR SELECT
TO service_role
USING (true);

-- Policy: Allow anonymous users to insert trip data (for non-logged-in users)
CREATE POLICY "Anonymous users can insert trip data"
ON public.trip_data
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- PREDICTION_LOGS POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to insert prediction logs
CREATE POLICY "Users can insert prediction logs"
ON public.prediction_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to view prediction logs
CREATE POLICY "Users can view prediction logs"
ON public.prediction_logs
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow service role full access to prediction logs
CREATE POLICY "Service role can manage prediction logs"
ON public.prediction_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow anonymous users to insert prediction logs (for ML monitoring)
CREATE POLICY "Anonymous users can insert prediction logs"
ON public.prediction_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow system to update prediction logs (for error calculation)
CREATE POLICY "System can update prediction logs"
ON public.prediction_logs
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can insert their own trip data" ON public.trip_data IS 
'Allows authenticated users to log their trip data for ML training';

COMMENT ON POLICY "Anonymous users can insert trip data" ON public.trip_data IS 
'Allows anonymous users to contribute to ML training data (privacy-preserved)';

COMMENT ON POLICY "Anonymous users can insert prediction logs" ON public.prediction_logs IS 
'Allows system to log predictions for monitoring without requiring authentication';

COMMENT ON POLICY "System can update prediction logs" ON public.prediction_logs IS 
'Allows automatic update of actual costs when trips complete';
