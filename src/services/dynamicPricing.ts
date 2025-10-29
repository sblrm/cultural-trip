/**
 * Dynamic Pricing Algorithm
 * 
 * Calculates travel costs with real-time factors:
 * - Transport mode (car, motorcycle, bus, train, flight, ship)
 * - Time of day (peak hours, rush hour)
 * - Day of week (weekend surcharge)
 * - Traffic conditions (congestion multiplier)
 * - Fuel prices (current market rates)
 * - Seasonal demand (holiday periods)
 */

export type TransportMode = 'car' | 'motorcycle' | 'bus' | 'train' | 'flight' | 'ship';

export interface PricingFactors {
  baseCost: number;
  fuelPrice: number; // Rp per liter
  fuelConsumption: number; // km per liter
  timeOfDay: Date;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  trafficLevel: 'low' | 'medium' | 'high' | 'severe';
  distance: number; // kilometers
  mode: 'fastest' | 'cheapest' | 'balanced';
  transportMode?: TransportMode; // Transport mode selection
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
  const parkingRates: Record<TransportMode, number> = {
    car: 5000,         // Rp 5,000 for car parking
    motorcycle: 2000,  // Rp 2,000 for motorcycle parking
    bus: 0,            // No parking needed
    train: 0,          // No parking needed
    flight: 0,         // No parking needed
    ship: 0            // No parking needed
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
    bus: 0,            // No personal fuel cost
    train: 0,          // No personal fuel cost
    flight: 0,         // No personal fuel cost
    ship: 0            // No personal fuel cost
  };
  
  return consumptionRates[transportMode];
};

/**
 * Calculate public transport ticket cost by specific mode
 * Realistic Indonesian pricing for bus, train, flight, and ship
 */
export const calculatePublicTransportCost = (
  distance: number,
  transportMode: 'bus' | 'train' | 'flight' | 'ship',
  optimizationMode: 'fastest' | 'cheapest' | 'balanced'
): number => {
  switch (transportMode) {
    case 'bus':
      // Bus transport: cheapest land option
      if (distance < 50) {
        // City bus (TransJakarta, Damri, etc.)
        const baseFare = 3500;
        const perKm = 300;
        return Math.round(baseFare + (distance * perKm));
      } else if (distance < 200) {
        // Intercity bus (AKAP - Antar Kota Antar Provinsi)
        const baseFare = optimizationMode === 'fastest' ? 50000 : 35000; // Executive vs Economy
        const perKm = optimizationMode === 'fastest' ? 600 : 400;
        return Math.round(baseFare + (distance * perKm));
      } else {
        // Long distance bus
        const baseFare = optimizationMode === 'fastest' ? 100000 : 70000;
        const perKm = optimizationMode === 'fastest' ? 500 : 350;
        return Math.round(baseFare + (distance * perKm));
      }
    
    case 'train':
      // Train transport: comfortable and reliable
      if (distance < 100) {
        // Commuter line (KRL Jabodetabek, etc.)
        return 5000; // Flat fare for commuter
      } else if (distance < 300) {
        // Medium distance train (KA Ekonomi/Bisnis)
        const baseFare = optimizationMode === 'fastest' ? 100000 : 50000; // Bisnis vs Ekonomi
        const perKm = optimizationMode === 'fastest' ? 700 : 400;
        return Math.round(baseFare + (distance * perKm));
      } else {
        // Long distance train (KA Eksekutif/Bisnis)
        const baseFare = optimizationMode === 'fastest' ? 200000 : 100000;
        const perKm = optimizationMode === 'fastest' ? 600 : 350;
        return Math.round(baseFare + (distance * perKm));
      }
    
    case 'flight':
      // Flight: fastest but most expensive
      if (distance < 400) {
        // Short haul (e.g., Jakarta-Surabaya)
        const baseFare = optimizationMode === 'cheapest' ? 400000 : 600000; // LCC vs Full service
        const perKm = optimizationMode === 'cheapest' ? 300 : 500;
        return Math.round(baseFare + (distance * perKm));
      } else if (distance < 1500) {
        // Medium haul (e.g., Jakarta-Makassar)
        const baseFare = optimizationMode === 'cheapest' ? 700000 : 1000000;
        const perKm = optimizationMode === 'cheapest' ? 250 : 400;
        return Math.round(baseFare + (distance * perKm));
      } else {
        // Long haul (e.g., Jakarta-Papua)
        const baseFare = optimizationMode === 'cheapest' ? 1500000 : 2500000;
        const perKm = optimizationMode === 'cheapest' ? 200 : 350;
        return Math.round(baseFare + (distance * perKm));
      }
    
    case 'ship':
      // Ship transport: unique for archipelago routes
      if (distance < 200) {
        // Ferry/speed boat (e.g., Jakarta-Kepulauan Seribu)
        const baseFare = optimizationMode === 'fastest' ? 150000 : 75000; // Fast boat vs regular ferry
        const perKm = optimizationMode === 'fastest' ? 500 : 250;
        return Math.round(baseFare + (distance * perKm));
      } else if (distance < 1000) {
        // Medium distance ferry (e.g., Surabaya-Bali, Bakauheni-Merak)
        const baseFare = optimizationMode === 'fastest' ? 300000 : 150000;
        const perKm = optimizationMode === 'fastest' ? 300 : 150;
        return Math.round(baseFare + (distance * perKm));
      } else {
        // Long distance ship (e.g., PELNI routes to Eastern Indonesia)
        const baseFare = optimizationMode === 'fastest' ? 800000 : 400000; // Express vs Economy class
        const perKm = optimizationMode === 'fastest' ? 200 : 100;
        return Math.round(baseFare + (distance * perKm));
      }
    
    default:
      return 0;
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
  
  // Public transport modes don't have toll costs (included in ticket)
  if (['bus', 'train', 'flight', 'ship'].includes(transportMode)) {
    return 0;
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
  if (['bus', 'train', 'flight', 'ship'].includes(transportMode)) {
    // === PUBLIC TRANSPORT ===
    // Calculate ticket cost (includes all transport fees)
    ticketCost = calculatePublicTransportCost(
      distance, 
      transportMode as 'bus' | 'train' | 'flight' | 'ship',
      mode
    );
    
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
  const modeLabels: Record<TransportMode, string> = {
    car: '🚗 Mobil',
    motorcycle: '🏍️ Motor',
    bus: '🚌 Bus',
    train: '� Kereta',
    flight: '✈️ Pesawat',
    ship: '🚢 Kapal Laut'
  };
  breakdown.push(`Mode: ${modeLabels[transportMode]}`);
  breakdown.push(`Base cost: Rp ${baseCost.toLocaleString('id-ID')}`);
  
  if (['bus', 'train', 'flight', 'ship'].includes(transportMode)) {
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
