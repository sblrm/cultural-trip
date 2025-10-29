/**
 * Dynamic Pricing Algorithm
 * 
 * Calculates travel costs with real-time factors:
 * - Transport mode (car, motorcycle, public transport)
 * - Time of day (peak hours, rush hour)
 * - Day of week (weekend surcharge)
 * - Traffic conditions (congestion multiplier)
 * - Fuel prices (current market rates)
 * - Seasonal demand (holiday periods)
 */

export type TransportMode = 'car' | 'motorcycle' | 'public_transport';

export interface PricingFactors {
  baseCost: number;
  fuelPrice: number; // Rp per liter
  fuelConsumption: number; // km per liter
  timeOfDay: Date;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  trafficLevel: 'low' | 'medium' | 'high' | 'severe';
  distance: number; // kilometers
  mode: 'fastest' | 'cheapest' | 'balanced';
  transportMode?: TransportMode; // NEW: Transport mode selection
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
  ticketCost: number; // NEW: For public transport
  totalCost: number;
  breakdown: string[];
  transportMode: TransportMode; // NEW: Track which mode was used
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
 * Calculate parking cost (fixed per destination)
 * Different rates for different transport modes
 */
export const calculateParkingCost = (transportMode: TransportMode = 'car'): number => {
  const parkingRates = {
    car: 5000,         // Rp 5,000 for car parking
    motorcycle: 2000,  // Rp 2,000 for motorcycle parking
    public_transport: 0 // No parking needed for public transport
  };
  
  return parkingRates[transportMode];
};

/**
 * Get fuel consumption rate based on transport mode
 */
export const getFuelConsumption = (transportMode: TransportMode): number => {
  const consumptionRates = {
    car: 12,           // 12 km/liter (average sedan)
    motorcycle: 35,    // 35 km/liter (average motorcycle)
    public_transport: 0 // No personal fuel cost
  };
  
  return consumptionRates[transportMode];
};

/**
 * Calculate public transport ticket cost
 * Based on distance and mode (bus, train, flight)
 */
export const calculatePublicTransportCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced'
): number => {
  // Determine transport type based on distance and optimization
  if (distance < 50) {
    // Short distance: Bus or city transport
    const baseFare = 5000; // Base bus fare
    const perKm = 500; // Rp 500 per km
    return Math.round(baseFare + (distance * perKm));
  } else if (distance < 200) {
    // Medium distance: Intercity bus or economy train
    if (mode === 'fastest') {
      // Fast train (e.g., KA Eksekutif)
      const baseFare = 50000;
      const perKm = 800;
      return Math.round(baseFare + (distance * perKm));
    } else {
      // Economy bus/train
      const baseFare = 25000;
      const perKm = 400;
      return Math.round(baseFare + (distance * perKm));
    }
  } else {
    // Long distance: Train or budget airline
    if (mode === 'fastest' && distance > 400) {
      // Domestic flight (budget airline)
      const baseFare = 300000;
      const perKm = 500;
      return Math.round(baseFare + (distance * perKm));
    } else if (mode === 'fastest') {
      // Express train
      const baseFare = 150000;
      const perKm = 600;
      return Math.round(baseFare + (distance * perKm));
    } else {
      // Economy train/bus
      const baseFare = 75000;
      const perKm = 300;
      return Math.round(baseFare + (distance * perKm));
    }
  }
};

/**
 * Calculate toll cost based on distance, route type, and transport mode
 */
export const calculateTollCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced',
  transportMode: TransportMode = 'car'
): number => {
  if (mode === 'cheapest') {
    return 0; // Avoid tolls for cheapest mode
  }
  
  if (transportMode === 'public_transport') {
    return 0; // Toll included in ticket price
  }
  
  // Indonesian toll road rates (average)
  const tollRates = {
    car: mode === 'fastest' ? 1500 : 1000,     // Rp per km
    motorcycle: mode === 'fastest' ? 750 : 500 // 50% discount for motorcycles
  };
  
  const tollRatePerKm = tollRates[transportMode as 'car' | 'motorcycle'];
  
  // Not all routes have tolls, estimate ~60% of long routes use toll
  const tollProbability = distance > 50 ? 0.6 : 0.3;
  const tollDistance = distance * tollProbability;
  
  return Math.round(tollDistance * tollRatePerKm);
};

/**
 * Main dynamic pricing calculation with detailed breakdown
 * Now supports multiple transport modes with accurate cost calculations
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
    mode,
    transportMode = 'car' // Default to car if not specified
  } = factors;
  
  // 1. Base cost (fixed)
  const base = baseCost;
  
  let fuelCost = 0;
  let roadCost = 0;
  let tollCost = 0;
  let parkingCost = 0;
  let ticketCost = 0;
  let peakHourSurcharge = 0;
  let weekendSurcharge = 0;
  let trafficSurcharge = 0;
  
  // Transport mode specific calculations
  if (transportMode === 'public_transport') {
    // === PUBLIC TRANSPORT ===
    // Calculate ticket cost (includes all transport fees)
    ticketCost = calculatePublicTransportCost(distance, mode);
    
    // No fuel, toll, or parking costs for public transport
    fuelCost = 0;
    tollCost = 0;
    parkingCost = 0;
    roadCost = 0;
    
    // Public transport has different surcharge calculations
    // Peak hour affects ticket availability and comfort
    const timeMultiplier = getTimeOfDayMultiplier(timeOfDay);
    const dayMultiplier = getDayOfWeekMultiplier(timeOfDay);
    
    peakHourSurcharge = Math.round(ticketCost * (timeMultiplier - 1) * 0.5); // 50% of multiplier effect
    weekendSurcharge = Math.round(ticketCost * (dayMultiplier - 1) * 0.3); // 30% of multiplier effect
    trafficSurcharge = 0; // Traffic doesn't affect public transport as much
    
  } else if (transportMode === 'motorcycle') {
    // === MOTORCYCLE ===
    // 2. Fuel cost (much more efficient than car)
    const consumption = getFuelConsumption('motorcycle');
    fuelCost = Math.round((distance / consumption) * fuelPrice);
    
    // 3. Road cost (lower for motorcycle)
    const roadRatePerKm = {
      fastest: 4000,  // Lower maintenance/tire cost
      cheapest: 1500,
      balanced: 2500
    };
    roadCost = Math.round(distance * roadRatePerKm[mode]);
    
    // 4. Toll cost (50% discount for motorcycles)
    tollCost = calculateTollCost(distance, mode, 'motorcycle');
    
    // 5. Parking cost (cheaper for motorcycles)
    parkingCost = calculateParkingCost('motorcycle');
    
    // 6. Surcharges (same as car but on lower base)
    const timeMultiplier = getTimeOfDayMultiplier(timeOfDay);
    const dayMultiplier = getDayOfWeekMultiplier(timeOfDay);
    const trafficMultiplier = getTrafficMultiplier(trafficLevel);
    
    peakHourSurcharge = Math.round((roadCost + fuelCost) * (timeMultiplier - 1));
    weekendSurcharge = Math.round((roadCost + fuelCost) * (dayMultiplier - 1));
    trafficSurcharge = Math.round((roadCost + fuelCost) * (trafficMultiplier - 1) * 0.7); // Less affected by traffic
    
  } else {
    // === CAR (default) ===
    // 2. Fuel cost (distance-based)
    fuelCost = Math.round((distance / fuelConsumption) * fuelPrice);
    
    // 3. Road cost (mode-dependent)
    const roadRatePerKm = {
      fastest: 8000,
      cheapest: 3000,
      balanced: 5000
    };
    roadCost = Math.round(distance * roadRatePerKm[mode]);
    
    // 4. Toll cost
    tollCost = calculateTollCost(distance, mode, 'car');
    
    // 5. Parking cost
    parkingCost = calculateParkingCost('car');
    
    // 6. Time multipliers
    const timeMultiplier = getTimeOfDayMultiplier(timeOfDay);
    const dayMultiplier = getDayOfWeekMultiplier(timeOfDay);
    const trafficMultiplier = getTrafficMultiplier(trafficLevel);
    
    // Calculate surcharges
    peakHourSurcharge = Math.round((roadCost + fuelCost) * (timeMultiplier - 1));
    weekendSurcharge = Math.round((roadCost + fuelCost) * (dayMultiplier - 1));
    trafficSurcharge = Math.round((roadCost + fuelCost) * (trafficMultiplier - 1));
  }
  
  // Total calculation
  const subtotal = base + fuelCost + roadCost + tollCost + parkingCost + ticketCost;
  const totalSurcharges = peakHourSurcharge + weekendSurcharge + trafficSurcharge;
  const totalCost = subtotal + totalSurcharges;
  
  // Breakdown for transparency
  const breakdown: string[] = [];
  
  // Transport mode indicator
  const modeLabels = {
    car: '🚗 Mobil',
    motorcycle: '🏍️ Motor',
    public_transport: '🚌 Transportasi Umum'
  };
  breakdown.push(`Mode: ${modeLabels[transportMode]}`);
  breakdown.push(`Base cost: Rp ${baseCost.toLocaleString('id-ID')}`);
  
  if (transportMode === 'public_transport') {
    breakdown.push(`Ticket cost (${distance.toFixed(1)} km, ${mode} mode): Rp ${ticketCost.toLocaleString('id-ID')}`);
  } else {
    const consumption = getFuelConsumption(transportMode);
    breakdown.push(`Fuel cost (${distance.toFixed(1)} km @ ${consumption} km/L): Rp ${fuelCost.toLocaleString('id-ID')}`);
    breakdown.push(`Road cost (${mode} mode): Rp ${roadCost.toLocaleString('id-ID')}`);
    
    if (tollCost > 0) {
      breakdown.push(`Toll cost: Rp ${tollCost.toLocaleString('id-ID')}`);
    }
    
    if (parkingCost > 0) {
      breakdown.push(`Parking: Rp ${parkingCost.toLocaleString('id-ID')}`);
    }
  }
  
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
    ticketCost,
    totalCost: Math.round(totalCost),
    breakdown,
    transportMode
  };
};

/**
 * Quick price estimation (simplified for UI)
 */
export const estimateTravelCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced' = 'balanced',
  departureTime?: Date,
  transportMode: TransportMode = 'car'
): number => {
  const now = departureTime || new Date();
  const trafficLevel = estimateTrafficLevel(now);
  const fuelConsumption = getFuelConsumption(transportMode);
  
  const pricing = calculateDynamicPrice({
    baseCost: 50000,
    fuelPrice: getCurrentFuelPrice(),
    fuelConsumption,
    timeOfDay: now,
    dayOfWeek: now.getDay(),
    trafficLevel,
    distance,
    mode,
    transportMode
  });
  
  return pricing.totalCost;
};
