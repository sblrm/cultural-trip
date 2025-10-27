/**
 * ML Pipeline: Data Collection Service
 * 
 * Collects trip data for Random Forest training
 * Saves actual trip costs and features to Supabase
 */

import { supabase } from '@/lib/supabase';
import { estimateTrafficLevel } from './dynamicPricing';

export interface TripDataInput {
  // Trip info
  routeId?: string;
  
  // Features
  distance: number; // km
  duration: number; // minutes
  optimizationMode: 'fastest' | 'cheapest' | 'balanced';
  
  // Time
  departureTime: Date;
  
  // Traffic
  trafficLevel?: 'low' | 'medium' | 'high' | 'severe';
  estimatedTrafficDelay?: number; // minutes
  
  // Cost
  fuelPrice: number; // Rp per liter
  tollRoadsUsed: boolean;
  
  // Weather (optional)
  weatherCondition?: 'sunny' | 'rainy' | 'cloudy';
  temperature?: number;
  
  // Costs
  actualCost: number; // Ground truth
  predictedCost: number; // From model/rule-based
  fuelCost?: number;
  tollCost?: number;
  parkingCost?: number;
  otherCosts?: number;
  
  // Metadata
  dataSource: 'user_reported' | 'gps_tracked' | 'estimated';
  predictionMethod: 'rule_based' | 'ml_model' | 'hybrid';
  modelVersion?: string;
  confidenceScore?: number; // 0-1
}

export interface TripData extends TripDataInput {
  id: number;
  userId: string;
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  completed: boolean;
  completionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save trip data for ML training
 */
export async function saveTripData(input: TripDataInput): Promise<TripData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to save trip data');
  }

  const departureTime = input.departureTime;
  const hourOfDay = departureTime.getHours();
  const dayOfWeek = departureTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Check if holiday (simplified - can be enhanced with holiday API)
  const isHoliday = checkIfHoliday(departureTime);
  
  // Auto-estimate traffic if not provided
  const trafficLevel = input.trafficLevel || estimateTrafficLevel(departureTime);

  const { data, error } = await supabase
    .from('trip_data')
    .insert({
      user_id: user.id,
      route_id: input.routeId || null,
      
      // Features
      distance: input.distance,
      duration: input.duration,
      optimization_mode: input.optimizationMode,
      
      // Time features
      departure_time: departureTime.toISOString(),
      hour_of_day: hourOfDay,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      is_holiday: isHoliday,
      
      // Traffic features
      traffic_level: trafficLevel,
      estimated_traffic_delay: input.estimatedTrafficDelay || 0,
      
      // Cost features
      fuel_price: input.fuelPrice,
      toll_roads_used: input.tollRoadsUsed,
      
      // Weather features
      weather_condition: input.weatherCondition || null,
      temperature: input.temperature || null,
      
      // Target
      actual_cost: input.actualCost,
      predicted_cost: input.predictedCost,
      
      // Cost breakdown
      fuel_cost: input.fuelCost || null,
      toll_cost: input.tollCost || null,
      parking_cost: input.parkingCost || null,
      other_costs: input.otherCosts || null,
      
      // Metadata
      data_source: input.dataSource,
      prediction_method: input.predictionMethod,
      model_version: input.modelVersion || null,
      confidence_score: input.confidenceScore || null,
      
      completed: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving trip data:', error);
    throw error;
  }

  return data as TripData;
}

/**
 * Mark trip as completed with actual costs
 */
export async function completeTripData(
  tripDataId: number,
  actualCost: number,
  costBreakdown?: {
    fuelCost?: number;
    tollCost?: number;
    parkingCost?: number;
    otherCosts?: number;
  }
): Promise<TripData> {
  const { data, error } = await supabase
    .from('trip_data')
    .update({
      completed: true,
      completion_time: new Date().toISOString(),
      actual_cost: actualCost,
      fuel_cost: costBreakdown?.fuelCost || null,
      toll_cost: costBreakdown?.tollCost || null,
      parking_cost: costBreakdown?.parkingCost || null,
      other_costs: costBreakdown?.otherCosts || null,
    })
    .eq('id', tripDataId)
    .select()
    .single();

  if (error) {
    console.error('Error completing trip data:', error);
    throw error;
  }

  return data as TripData;
}

/**
 * Get user's trip history
 */
export async function getUserTripData(
  userId: string,
  limit: number = 50
): Promise<TripData[]> {
  const { data, error } = await supabase
    .from('trip_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user trip data:', error);
    throw error;
  }

  return data as TripData[];
}

/**
 * Get ML training dataset (admin/service role only)
 */
export async function getMLTrainingData(
  minSamples: number = 100,
  maxSamples: number = 10000
): Promise<any[]> {
  const { data, error } = await supabase
    .from('ml_training_data')
    .select('*')
    .limit(maxSamples);

  if (error) {
    console.error('Error fetching ML training data:', error);
    throw error;
  }

  if (data.length < minSamples) {
    console.warn(`Only ${data.length} samples available, need at least ${minSamples} for training`);
  }

  return data;
}

/**
 * Log ML prediction
 */
export async function logPrediction(
  features: Record<string, any>,
  predictedCost: number,
  predictionMethod: 'rule_based' | 'ml_model' | 'hybrid',
  modelVersion?: string,
  confidenceScore?: number,
  predictionTimeMs?: number,
  tripDataId?: number
): Promise<void> {
  try {
    // Sanitize features for JSON storage
    const sanitizedFeatures = Object.entries(features).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Ensure confidence_score is within bounds (0-1) and properly formatted
    // Database expects numeric(3,2) which means max 0.99
    let sanitizedConfidence = confidenceScore;
    if (sanitizedConfidence !== undefined && sanitizedConfidence !== null) {
      sanitizedConfidence = Math.max(0, Math.min(0.99, sanitizedConfidence));
      sanitizedConfidence = parseFloat(sanitizedConfidence.toFixed(2));
    }

    const { error } = await supabase
      .from('prediction_logs')
      .insert({
        trip_data_id: tripDataId || null,
        features: sanitizedFeatures,
        predicted_cost: predictedCost,
        prediction_method: predictionMethod,
        model_version: modelVersion || null,
        confidence_score: sanitizedConfidence || null,
        prediction_time_ms: predictionTimeMs ? Math.round(predictionTimeMs) : null,
      });

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01') {
        console.warn('⚠️ prediction_logs table not found. Run SQL migration: add_ml_pipeline_schema.sql');
      } else {
        console.error('Error logging prediction:', error);
      }
      // Don't throw - logging failure shouldn't break the app
    }
  } catch (err) {
    console.warn('Failed to log prediction (non-critical):', err);
  }
}

/**
 * Update prediction log with actual cost
 */
export async function updatePredictionWithActual(
  predictionLogId: number,
  actualCost: number
): Promise<void> {
  const { error } = await supabase
    .from('prediction_logs')
    .update({
      actual_cost: actualCost,
      prediction_error: actualCost - (await getPredictedCost(predictionLogId))
    })
    .eq('id', predictionLogId);

  if (error) {
    console.error('Error updating prediction with actual:', error);
  }
}

// Helper function
async function getPredictedCost(predictionLogId: number): Promise<number> {
  const { data } = await supabase
    .from('prediction_logs')
    .select('predicted_cost')
    .eq('id', predictionLogId)
    .single();
  
  return data?.predicted_cost || 0;
}

/**
 * Check if date is Indonesian public holiday
 */
function checkIfHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Major Indonesian holidays (fixed dates only)
  const holidays = [
    { month: 1, day: 1 },   // New Year
    { month: 5, day: 1 },   // Labor Day
    { month: 6, day: 1 },   // Pancasila Day
    { month: 8, day: 17 },  // Independence Day
    { month: 12, day: 25 }, // Christmas
  ];
  
  return holidays.some(h => h.month === month && h.day === day);
}

/**
 * Get model performance metrics
 */
export async function getModelMetrics(
  modelVersion?: string
): Promise<any[]> {
  let query = supabase
    .from('model_metrics')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (modelVersion) {
    query = query.eq('model_version', modelVersion);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching model metrics:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get current production model info
 */
export async function getProductionModel(): Promise<any | null> {
  const { data, error } = await supabase
    .from('model_metrics')
    .select('*')
    .eq('is_production', true)
    .order('deployed_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No production model yet
    }
    console.error('Error fetching production model:', error);
    throw error;
  }
  
  return data;
}

/**
 * Calculate prediction accuracy metrics
 */
export async function calculateAccuracyMetrics(
  since?: Date
): Promise<{
  mae: number;
  rmse: number;
  mape: number;
  sampleCount: number;
}> {
  let query = supabase
    .from('prediction_logs')
    .select('predicted_cost, actual_cost')
    .not('actual_cost', 'is', null);
  
  if (since) {
    query = query.gte('created_at', since.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, sampleCount: 0 };
  }
  
  // Calculate metrics
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumPercentError = 0;
  
  for (const log of data) {
    const error = Math.abs(log.actual_cost - log.predicted_cost);
    const squaredError = Math.pow(error, 2);
    const percentError = (error / log.actual_cost) * 100;
    
    sumAbsError += error;
    sumSquaredError += squaredError;
    sumPercentError += percentError;
  }
  
  const n = data.length;
  
  return {
    mae: sumAbsError / n,
    rmse: Math.sqrt(sumSquaredError / n),
    mape: sumPercentError / n,
    sampleCount: n
  };
}
