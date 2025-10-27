/**
 * Dynamic Pricing Algorithm
 * 
 * Calculates travel costs with real-time factors:
 * - Time of day (peak hours, rush hour)
 * - Day of week (weekend surcharge)
 * - Traffic conditions (congestion multiplier)
 * - Fuel prices (current market rates)
 * - Seasonal demand (holiday periods)
 */

export interface PricingFactors {
  baseCost: number;
  fuelPrice: number; // Rp per liter
  fuelConsumption: number; // km per liter
  timeOfDay: Date;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  trafficLevel: 'low' | 'medium' | 'high' | 'severe';
  distance: number; // kilometers
  mode: 'fastest' | 'cheapest' | 'balanced';
}

export interface PricingBreakdown {
  baseCost: number;
  fuelCost: number;
  roadCost: number;
  peakHourSurcharge: number;
  weekendSurcharge: number;
  trafficSurcharge: number;
  tollCost: number;
  parkingCost: number;
  totalCost: number;
  breakdown: string[];
}

/**
 * Get current fuel price (could be fetched from external API)
 * For now, uses realistic Indonesian fuel prices
 */
export const getCurrentFuelPrice = (): number => {
  // Average fuel price in Indonesia (Pertalite/Pertamax)
  // In production, fetch from: https://www.esdm.go.id or https://www.pertamina.com
  const basePrice = 10000; // Rp per liter (Pertalite)
  
  // Add slight randomization for realism (±5%)
  const variance = basePrice * 0.05;
  const randomOffset = (Math.random() - 0.5) * 2 * variance;
  
  return Math.round(basePrice + randomOffset);
};

/**
 * Calculate time-of-day multiplier
 * Peak hours: 07:00-09:00, 17:00-19:00 (weekdays)
 */
export const getTimeOfDayMultiplier = (date: Date): number => {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  // Morning rush hour (07:00 - 09:00)
  if (isWeekday && hour >= 7 && hour < 9) {
    return 1.30; // +30% during morning rush
  }
  
  // Evening rush hour (17:00 - 19:00)
  if (isWeekday && hour >= 17 && hour < 19) {
    return 1.35; // +35% during evening rush (worse)
  }
  
  // Late night (22:00 - 05:00) - less traffic but safety concern
  if (hour >= 22 || hour < 5) {
    return 1.10; // +10% for night driving
  }
  
  // Normal hours
  return 1.0;
};

/**
 * Calculate day-of-week multiplier
 * Weekends and holidays have higher demand
 */
export const getDayOfWeekMultiplier = (date: Date): number => {
  const dayOfWeek = date.getDay();
  
  // Weekend (Saturday, Sunday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 1.20; // +20% weekend surcharge
  }
  
  // Friday (start of weekend rush)
  if (dayOfWeek === 5) {
    return 1.10; // +10% Friday surcharge
  }
  
  // Check if it's a Indonesian public holiday
  // In production, integrate with holiday API or calendar
  const isHoliday = checkIfHoliday(date);
  if (isHoliday) {
    return 1.25; // +25% holiday surcharge
  }
  
  // Regular weekday
  return 1.0;
};

/**
 * Check if date is Indonesian public holiday
 * Simplified version - in production, use proper holiday calendar
 */
const checkIfHoliday = (date: Date): boolean => {
  const month = date.getMonth() + 1; // 1-12
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
};

/**
 * Calculate traffic congestion multiplier
 * Based on traffic level from routing API
 */
export const getTrafficMultiplier = (
  trafficLevel: 'low' | 'medium' | 'high' | 'severe'
): number => {
  const multipliers = {
    low: 1.0,      // No surcharge
    medium: 1.15,  // +15% for moderate traffic
    high: 1.30,    // +30% for heavy traffic
    severe: 1.50   // +50% for severe congestion
  };
  
  return multipliers[trafficLevel];
};

/**
 * Estimate traffic level based on time and day
 * In production, this should come from real-time traffic API
 */
export const estimateTrafficLevel = (
  date: Date
): 'low' | 'medium' | 'high' | 'severe' => {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  // Rush hours on weekdays
  if (isWeekday) {
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      return 'severe';
    }
    if ((hour >= 6 && hour < 10) || (hour >= 16 && hour < 20)) {
      return 'high';
    }
  }
  
  // Weekend traffic
  if (!isWeekday) {
    if (hour >= 10 && hour < 20) {
      return 'medium';
    }
  }
  
  // Late night / early morning
  if (hour >= 22 || hour < 6) {
    return 'low';
  }
  
  // Default moderate traffic
  return 'medium';
};

/**
 * Calculate toll cost based on distance and route type
 */
export const calculateTollCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced'
): number => {
  if (mode === 'cheapest') {
    return 0; // Avoid tolls for cheapest mode
  }
  
  // Indonesian toll road rates (average)
  const tollRatePerKm = mode === 'fastest' ? 1500 : 1000; // Rp per km
  
  // Not all routes have tolls, estimate ~60% of long routes use toll
  const tollProbability = distance > 50 ? 0.6 : 0.3;
  const tollDistance = distance * tollProbability;
  
  return Math.round(tollDistance * tollRatePerKm);
};

/**
 * Calculate parking cost (fixed per destination)
 */
export const calculateParkingCost = (): number => {
  // Average parking cost at tourist destinations in Indonesia
  return 5000; // Rp 5,000 per location
};

/**
 * Main dynamic pricing calculation with detailed breakdown
 */
export const calculateDynamicPrice = (
  factors: PricingFactors
): PricingBreakdown => {
  const {
    baseCost,
    fuelPrice,
    fuelConsumption,
    timeOfDay,
    dayOfWeek,
    trafficLevel,
    distance,
    mode
  } = factors;
  
  // 1. Base cost (fixed)
  const base = baseCost;
  
  // 2. Fuel cost (distance-based)
  const fuelCost = Math.round((distance / fuelConsumption) * fuelPrice);
  
  // 3. Road cost (mode-dependent)
  const roadRatePerKm = {
    fastest: 8000,
    cheapest: 3000,
    balanced: 5000
  };
  const roadCost = Math.round(distance * roadRatePerKm[mode]);
  
  // 4. Toll cost
  const tollCost = calculateTollCost(distance, mode);
  
  // 5. Parking cost
  const parkingCost = calculateParkingCost();
  
  // 6. Time multipliers
  const timeMultiplier = getTimeOfDayMultiplier(timeOfDay);
  const dayMultiplier = getDayOfWeekMultiplier(timeOfDay);
  const trafficMultiplier = getTrafficMultiplier(trafficLevel);
  
  // Calculate surcharges
  const peakHourSurcharge = Math.round((roadCost + fuelCost) * (timeMultiplier - 1));
  const weekendSurcharge = Math.round((roadCost + fuelCost) * (dayMultiplier - 1));
  const trafficSurcharge = Math.round((roadCost + fuelCost) * (trafficMultiplier - 1));
  
  // Total calculation
  const subtotal = base + fuelCost + roadCost + tollCost + parkingCost;
  const totalSurcharges = peakHourSurcharge + weekendSurcharge + trafficSurcharge;
  const totalCost = subtotal + totalSurcharges;
  
  // Breakdown for transparency
  const breakdown: string[] = [];
  breakdown.push(`Base cost: Rp ${baseCost.toLocaleString('id-ID')}`);
  breakdown.push(`Fuel cost (${distance.toFixed(1)} km @ ${fuelConsumption} km/L): Rp ${fuelCost.toLocaleString('id-ID')}`);
  breakdown.push(`Road cost (${mode} mode): Rp ${roadCost.toLocaleString('id-ID')}`);
  
  if (tollCost > 0) {
    breakdown.push(`Toll cost: Rp ${tollCost.toLocaleString('id-ID')}`);
  }
  
  breakdown.push(`Parking: Rp ${parkingCost.toLocaleString('id-ID')}`);
  
  if (peakHourSurcharge > 0) {
    const hour = timeOfDay.getHours();
    breakdown.push(`Peak hour surcharge (${hour}:00): +Rp ${peakHourSurcharge.toLocaleString('id-ID')}`);
  }
  
  if (weekendSurcharge > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    breakdown.push(`${days[dayOfWeek]} surcharge: +Rp ${weekendSurcharge.toLocaleString('id-ID')}`);
  }
  
  if (trafficSurcharge > 0) {
    breakdown.push(`Traffic surcharge (${trafficLevel}): +Rp ${trafficSurcharge.toLocaleString('id-ID')}`);
  }
  
  return {
    baseCost,
    fuelCost,
    roadCost,
    peakHourSurcharge,
    weekendSurcharge,
    trafficSurcharge,
    tollCost,
    parkingCost,
    totalCost: Math.round(totalCost),
    breakdown
  };
};

/**
 * Quick price estimation (simplified for UI)
 */
export const estimateTravelCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced' = 'balanced',
  departureTime?: Date
): number => {
  const now = departureTime || new Date();
  const trafficLevel = estimateTrafficLevel(now);
  
  const pricing = calculateDynamicPrice({
    baseCost: 50000,
    fuelPrice: getCurrentFuelPrice(),
    fuelConsumption: 12,
    timeOfDay: now,
    dayOfWeek: now.getDay(),
    trafficLevel,
    distance,
    mode
  });
  
  return pricing.totalCost;
};
