/**
 * ML Pipeline: Hybrid Prediction Service
 * 
 * Intelligently combines ML-based and rule-based predictions
 * Falls back to rule-based when ML is unavailable or confidence is low
 */

import { PredictionInput, PredictionResult, predictCostML, isMLModelAvailable } from './mlPrediction';
import { calculateDynamicPrice, PricingBreakdown } from './dynamicPricing';

interface HybridPredictionResult {
  finalCost: number;
  method: 'ml_model' | 'rule_based' | 'hybrid';
  mlPrediction?: PredictionResult;
  rulePrediction?: PricingBreakdown;
  confidence: number;
  reason: string;
}

/**
 * Configuration for hybrid prediction
 */
const HYBRID_CONFIG = {
  // ML confidence threshold (use ML if confidence >= this)
  ML_CONFIDENCE_THRESHOLD: 0.7,
  
  // Max difference between ML and rule-based (for sanity check)
  MAX_DIFFERENCE_PERCENT: 50, // 50%
  
  // Weight for hybrid mode (0 = all rule, 1 = all ML)
  HYBRID_ML_WEIGHT: 0.7,
  
  // Enable sanity check
  ENABLE_SANITY_CHECK: true,
};

/**
 * Make hybrid prediction combining ML and rule-based methods
 */
export async function predictCostHybrid(
  input: PredictionInput,
  distance: number,
  duration: number,
  departureTime: Date
): Promise<HybridPredictionResult> {
  // Try ML prediction first
  let mlPrediction: PredictionResult | undefined;
  let mlAvailable = false;

  if (isMLModelAvailable()) {
    try {
      mlPrediction = await predictCostML(input);
      mlAvailable = true;
    } catch (error) {
      console.warn('ML prediction failed, falling back to rule-based:', error);
    }
  }

  // Always calculate rule-based prediction as fallback
  const rulePrediction = calculateDynamicPrice({
    baseCost: 100000, // Base cost Rp 100k
    fuelPrice: input.fuelPrice,
    fuelConsumption: 12, // km/liter
    timeOfDay: departureTime,
    dayOfWeek: input.dayOfWeek,
    trafficLevel: input.trafficLevel,
    distance,
    mode: input.optimizationMode,
  });

  // Decision logic
  if (!mlAvailable || !mlPrediction) {
    // ML not available, use rule-based
    return {
      finalCost: rulePrediction.totalCost,
      method: 'rule_based',
      rulePrediction,
      confidence: 0.8,
      reason: 'ML model not available',
    };
  }

  const mlConfidence = mlPrediction.confidence;
  
  if (mlConfidence >= HYBRID_CONFIG.ML_CONFIDENCE_THRESHOLD) {
    // High confidence ML prediction
    
    // Sanity check: ML vs rule-based difference
    if (HYBRID_CONFIG.ENABLE_SANITY_CHECK) {
      const difference = Math.abs(mlPrediction.predictedCost - rulePrediction.totalCost);
      const percentDiff = (difference / rulePrediction.totalCost) * 100;
      
      if (percentDiff > HYBRID_CONFIG.MAX_DIFFERENCE_PERCENT) {
        // Large discrepancy - use hybrid approach
        console.warn(
          `Large discrepancy detected: ML=${mlPrediction.predictedCost}, ` +
          `Rule=${rulePrediction.totalCost} (${percentDiff.toFixed(1)}% diff)`
        );
        
        const hybridCost = (
          mlPrediction.predictedCost * HYBRID_CONFIG.HYBRID_ML_WEIGHT +
          rulePrediction.totalCost * (1 - HYBRID_CONFIG.HYBRID_ML_WEIGHT)
        );
        
        return {
          finalCost: hybridCost,
          method: 'hybrid',
          mlPrediction,
          rulePrediction,
          confidence: mlConfidence * 0.9, // Slight confidence penalty
          reason: `Large discrepancy (${percentDiff.toFixed(1)}%), using weighted average`,
        };
      }
    }
    
    // Use ML prediction
    return {
      finalCost: mlPrediction.predictedCost,
      method: 'ml_model',
      mlPrediction,
      rulePrediction,
      confidence: mlConfidence,
      reason: `High ML confidence (${(mlConfidence * 100).toFixed(0)}%)`,
    };
  } else {
    // Low confidence ML - prefer rule-based
    return {
      finalCost: rulePrediction.totalCost,
      method: 'rule_based',
      mlPrediction,
      rulePrediction,
      confidence: 0.8,
      reason: `Low ML confidence (${(mlConfidence * 100).toFixed(0)}%), using rule-based`,
    };
  }
}

/**
 * Get prediction method recommendation
 */
export function getPredictionMethodRecommendation(
  mlAvailable: boolean,
  mlConfidence: number
): {
  method: 'ml_model' | 'rule_based' | 'hybrid';
  reason: string;
} {
  if (!mlAvailable) {
    return {
      method: 'rule_based',
      reason: 'ML model not loaded',
    };
  }

  if (mlConfidence >= HYBRID_CONFIG.ML_CONFIDENCE_THRESHOLD) {
    return {
      method: 'ml_model',
      reason: `High confidence (${(mlConfidence * 100).toFixed(0)}%)`,
    };
  }

  return {
    method: 'rule_based',
    reason: `Low confidence (${(mlConfidence * 100).toFixed(0)}%)`,
  };
}

/**
 * Validate prediction reasonableness
 */
export function validatePrediction(
  predictedCost: number,
  distance: number,
  duration: number
): {
  isReasonable: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if cost is positive
  if (predictedCost <= 0) {
    issues.push('Cost must be positive');
  }

  // Check minimum cost (fuel + basic costs)
  const minCost = distance * 1000; // Minimum Rp 1,000/km
  if (predictedCost < minCost) {
    issues.push(`Cost too low (minimum: Rp ${minCost.toLocaleString('id-ID')})`);
  }

  // Check maximum cost (upper bound sanity check)
  const maxCost = distance * 10000; // Maximum Rp 10,000/km
  if (predictedCost > maxCost) {
    issues.push(`Cost too high (maximum: Rp ${maxCost.toLocaleString('id-ID')})`);
  }

  // Check duration reasonableness
  const expectedDuration = distance / 60; // Assume 60 km/h average
  if (duration < expectedDuration * 0.5) {
    issues.push('Duration seems too short for distance');
  }

  return {
    isReasonable: issues.length === 0,
    issues,
  };
}

/**
 * Compare ML and rule-based predictions
 */
export function comparePredictions(
  mlCost: number,
  ruleCost: number
): {
  difference: number;
  percentDiff: number;
  recommendation: string;
} {
  const difference = Math.abs(mlCost - ruleCost);
  const percentDiff = (difference / ruleCost) * 100;

  let recommendation = '';
  if (percentDiff < 10) {
    recommendation = 'Both methods agree closely';
  } else if (percentDiff < 30) {
    recommendation = 'Moderate difference, verify trip details';
  } else {
    recommendation = 'Large difference, use hybrid or rule-based for safety';
  }

  return {
    difference,
    percentDiff,
    recommendation,
  };
}

export type { HybridPredictionResult };
export { HYBRID_CONFIG };
