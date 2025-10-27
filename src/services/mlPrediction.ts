/**
 * ML Pipeline: TensorFlow.js Prediction Service
 * 
 * Browser-side ML inference using trained Random Forest model
 */

import * as tf from '@tensorflow/tfjs';

interface ModelMetadata {
  model_version: string;
  created_at: string;
  feature_names: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  encoders: Record<string, { classes: string[] }>;
}

interface PredictionInput {
  distance: number;
  duration: number;
  optimizationMode: 'fastest' | 'cheapest' | 'balanced';
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  trafficLevel: 'low' | 'medium' | 'high' | 'severe';
  estimatedTrafficDelay: number;
  fuelPrice: number;
  tollRoadsUsed: boolean;
  weatherCondition?: 'sunny' | 'rainy' | 'cloudy';
  temperature?: number;
  dataSource: 'user_reported' | 'gps_tracked' | 'estimated';
}

interface PredictionResult {
  predictedCost: number;
  confidence: number; // 0-1
  modelVersion: string;
  predictionMethod: 'ml_model';
  features: Record<string, any>;
}

class MLCostPredictor {
  private model: tf.LayersModel | null = null;
  private metadata: ModelMetadata | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Load TensorFlow.js model from public/models/
   */
  async loadModel(modelPath: string = '/models'): Promise<void> {
    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Return immediately if already loaded
    if (this.isLoaded) {
      return Promise.resolve();
    }

    this.loadingPromise = (async () => {
      try {
        console.log('🤖 Loading ML model from:', modelPath);

        // Load model
        this.model = await tf.loadLayersModel(`${modelPath}/model.json`);

        // Load metadata
        const metadataResponse = await fetch(`${modelPath}/metadata.json`);
        if (!metadataResponse.ok) {
          throw new Error('Failed to load model metadata');
        }
        this.metadata = await metadataResponse.json();

        this.isLoaded = true;
        console.log('✅ ML model loaded:', this.metadata?.model_version);
      } catch (error) {
        console.error('❌ Failed to load ML model:', error);
        this.isLoaded = false;
        throw error;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Check if model is ready for predictions
   */
  isReady(): boolean {
    return this.isLoaded && this.model !== null && this.metadata !== null;
  }

  /**
   * Preprocess features for prediction
   */
  private preprocessFeatures(input: PredictionInput): tf.Tensor2D {
    if (!this.metadata) {
      throw new Error('Model metadata not loaded');
    }

    const features: Record<string, number> = {};

    // Map input to feature names
    const featureMapping: Record<string, () => number> = {
      distance: () => input.distance,
      duration: () => input.duration,
      optimization_mode: () => this.encodeCategory(
        'optimization_mode',
        input.optimizationMode
      ),
      hour_of_day: () => input.hourOfDay,
      day_of_week: () => input.dayOfWeek,
      is_weekend: () => input.isWeekend ? 1 : 0,
      is_holiday: () => input.isHoliday ? 1 : 0,
      traffic_level: () => this.encodeCategory(
        'traffic_level',
        input.trafficLevel
      ),
      estimated_traffic_delay: () => input.estimatedTrafficDelay,
      fuel_price: () => input.fuelPrice,
      toll_roads_used: () => input.tollRoadsUsed ? 1 : 0,
      weather_condition: () => this.encodeCategory(
        'weather_condition',
        input.weatherCondition || 'sunny'
      ),
      temperature: () => input.temperature || 28,
      data_source: () => this.encodeCategory(
        'data_source',
        input.dataSource
      ),
    };

    // Extract features in correct order
    for (const featureName of this.metadata.feature_names) {
      const getValue = featureMapping[featureName];
      if (getValue) {
        features[featureName] = getValue();
      } else {
        console.warn(`Unknown feature: ${featureName}, using 0`);
        features[featureName] = 0;
      }
    }

    // Convert to array
    const featureArray = this.metadata.feature_names.map(
      name => features[name]
    );

    // Standardize using saved scaler parameters
    const standardized = featureArray.map((value, idx) => {
      const mean = this.metadata!.scaler_mean[idx];
      const scale = this.metadata!.scaler_scale[idx];
      return (value - mean) / scale;
    });

    // Convert to tensor [1, n_features]
    return tf.tensor2d([standardized]);
  }

  /**
   * Encode categorical feature using saved encoder
   */
  private encodeCategory(featureName: string, value: string): number {
    if (!this.metadata?.encoders[featureName]) {
      console.warn(`No encoder for ${featureName}, using 0`);
      return 0;
    }

    const classes = this.metadata.encoders[featureName].classes;
    const index = classes.indexOf(value);

    if (index === -1) {
      // Unknown category, try 'unknown'
      const unknownIndex = classes.indexOf('unknown');
      return unknownIndex !== -1 ? unknownIndex : 0;
    }

    return index;
  }

  /**
   * Make prediction
   */
  async predict(input: PredictionInput): Promise<PredictionResult> {
    if (!this.isReady()) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const startTime = performance.now();

    // Preprocess features
    const featuresTensor = this.preprocessFeatures(input);

    // Predict
    const predictionTensor = this.model!.predict(featuresTensor) as tf.Tensor;
    const predictionArray = await predictionTensor.array() as number[][];
    const predictedCost = predictionArray[0][0];

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(input);

    // Clean up tensors
    featuresTensor.dispose();
    predictionTensor.dispose();

    const endTime = performance.now();
    console.log(`⏱️ ML prediction: ${(endTime - startTime).toFixed(2)}ms`);

    return {
      predictedCost: Math.max(0, predictedCost), // Ensure non-negative
      confidence,
      modelVersion: this.metadata!.model_version,
      predictionMethod: 'ml_model',
      features: {
        distance: input.distance,
        duration: input.duration,
        optimizationMode: input.optimizationMode,
        trafficLevel: input.trafficLevel,
        fuelPrice: input.fuelPrice,
      },
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(input: PredictionInput): number {
    let confidence = 0.8; // Base confidence

    // Higher confidence for real-time data
    if (input.dataSource === 'gps_tracked') {
      confidence += 0.1;
    } else if (input.dataSource === 'estimated') {
      confidence -= 0.1;
    }

    // Lower confidence for extreme values
    if (input.distance > 1000) confidence -= 0.1; // Very long trip
    if (input.trafficLevel === 'severe') confidence -= 0.05;

    // Higher confidence for weekend/holiday patterns (well-learned)
    if (input.isWeekend || input.isHoliday) {
      confidence += 0.05;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Unload model to free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.metadata = null;
    this.isLoaded = false;
    console.log('🗑️ ML model unloaded');
  }
}

// Singleton instance
let predictorInstance: MLCostPredictor | null = null;

/**
 * Get ML predictor instance (singleton)
 */
export function getMLPredictor(): MLCostPredictor {
  if (!predictorInstance) {
    predictorInstance = new MLCostPredictor();
  }
  return predictorInstance;
}

/**
 * Initialize ML model (call once at app startup)
 */
export async function initializeMLModel(): Promise<boolean> {
  try {
    const predictor = getMLPredictor();
    await predictor.loadModel();
    return predictor.isReady();
  } catch (error) {
    console.error('Failed to initialize ML model:', error);
    return false;
  }
}

/**
 * Make ML-based cost prediction
 */
export async function predictCostML(
  input: PredictionInput
): Promise<PredictionResult> {
  const predictor = getMLPredictor();

  // Lazy load if not ready
  if (!predictor.isReady()) {
    await predictor.loadModel();
  }

  return predictor.predict(input);
}

/**
 * Check if ML model is available
 */
export function isMLModelAvailable(): boolean {
  return predictorInstance?.isReady() ?? false;
}

export type { PredictionInput, PredictionResult };
