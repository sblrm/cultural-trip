
import { Destination } from "@/contexts/DestinationsContext";
import {
  getDistanceMatrix,
  getFastestRoute,
  getCheapestRoute,
  getRoute,
  getCachedOrFetch,
  type ORSCoordinate,
  type RouteData
} from './openRouteService';
import {
  calculateDynamicPrice,
  estimateTrafficLevel,
  getCurrentFuelPrice,
  getFuelConsumption,
  type PricingBreakdown,
  type TransportMode
} from './dynamicPricing';

export interface RouteNode {
  destination: Destination;
  distance: number;
  duration: number;
  cost: number;
  pricingBreakdown?: PricingBreakdown;
}

export interface Route {
  nodes: RouteNode[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  isRealTimeData: boolean; // Indicates if using ORS API or fallback
  dataSource: 'ors' | 'fallback';
}

export type OptimizationMode = 'fastest' | 'cheapest' | 'balanced';

// Priority Queue untuk A* Algorithm
class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// State untuk A* search
interface AStarState {
  visited: Set<number>;
  currentDest: Destination | null;
  path: RouteNode[];
  gScore: number; // Actual cost from start
  fScore: number; // gScore + heuristic
}

// Haversine formula untuk fallback calculation
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
};

/**
 * Get real-time route data from ORS API with fallback to Haversine
 */
export const getRouteData = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: OptimizationMode,
  transportMode?: TransportMode
): Promise<{ data: RouteData; isRealTime: boolean }> => {
  const start: ORSCoordinate = { lat: startLat, lng: startLng };
  const end: ORSCoordinate = { lat: endLat, lng: endLng };

  // For flight, ship, and train, always use direct distance calculation
  // These modes don't follow roads
  if (transportMode === 'flight' || transportMode === 'ship' || transportMode === 'train') {
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const duration = calculateTravelDuration(distance, mode, transportMode);
    
    return {
      data: { distance, duration },
      isRealTime: false // Direct calculation, not from ORS
    };
  }

  try {
    // Try to use real-time API based on optimization mode (for road transport)
    let routeData: RouteData;

    if (mode === 'fastest') {
      routeData = await getCachedOrFetch(
        `fastest_${startLat}_${startLng}_${endLat}_${endLng}`,
        () => getFastestRoute(start, end)
      );
    } else if (mode === 'cheapest') {
      routeData = await getCachedOrFetch(
        `cheapest_${startLat}_${startLng}_${endLat}_${endLng}`,
        () => getCheapestRoute(start, end)
      );
    } else {
      routeData = await getCachedOrFetch(
        `balanced_${startLat}_${startLng}_${endLat}_${endLng}`,
        () => getRoute(start, end, 'driving-car')
      );
    }

    return { data: routeData, isRealTime: true };
  } catch (error) {
    console.warn('ORS API unavailable, falling back to Haversine calculation:', error);

    // Fallback to Haversine calculation
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const duration = calculateTravelDuration(distance, mode, transportMode);

    return {
      data: { distance, duration },
      isRealTime: false
    };
  }
};

// Enhanced cost calculation dengan dynamic pricing
export const calculateTravelCost = (
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

// Get detailed pricing breakdown
export const getTravelCostBreakdown = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced' = 'balanced',
  departureTime?: Date,
  transportMode: TransportMode = 'car'
): PricingBreakdown => {
  const now = departureTime || new Date();
  const trafficLevel = estimateTrafficLevel(now);
  const fuelConsumption = getFuelConsumption(transportMode);

  return calculateDynamicPrice({
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
};

// Enhanced duration calculation dengan realistic speeds per transport mode
export const calculateTravelDuration = (
  distance: number,
  optimizationMode: 'fastest' | 'cheapest' | 'balanced' = 'balanced',
  transportMode?: TransportMode
): number => {
  // If transportMode is provided, use transport-specific speeds
  if (transportMode) {
    // Average speed based on transport mode (km/h)
    const transportSpeeds: Record<TransportMode, number> = {
      car: 60,           // Average car speed with traffic
      motorcycle: 50,    // Motorcycle average speed
      bus: 45,           // Bus with stops
      train: 80,         // Train average speed (including stops)
      flight: 700,       // Average flight speed (including taxi time)
      ship: 40           // Ferry/ship average speed
    };
    
    // Traffic/delay buffers per transport mode
    const delayBuffers: Record<TransportMode, number> = {
      car: 1.20,         // 20% buffer for traffic
      motorcycle: 1.15,  // 15% buffer (can navigate traffic better)
      bus: 1.30,         // 30% buffer (stops + traffic)
      train: 1.10,       // 10% buffer (station delays)
      flight: 1.50,      // 50% buffer (check-in, boarding, taxi, landing)
      ship: 1.15         // 15% buffer (boarding, port delays)
    };
    
    const baseTime = (distance / transportSpeeds[transportMode]) * 60; // minutes
    return Math.round(baseTime * delayBuffers[transportMode]);
  }
  
  // Fallback to optimization mode for road transport
  const averageSpeed = {
    fastest: 60,    // Highway/toll roads
    cheapest: 35,   // Non-toll, city roads
    balanced: 45    // Mix
  };
  
  // Add traffic buffer (15-30% depending on mode)
  const trafficBuffer = {
    fastest: 1.15,
    cheapest: 1.30,
    balanced: 1.20
  };
  
  const baseTime = (distance / averageSpeed[optimizationMode]) * 60; // minutes
  return Math.round(baseTime * trafficBuffer[optimizationMode]);
};

// Calculate heuristic for A* (estimated cost to visit all remaining destinations)
const calculateHeuristic = (
  currentDest: Destination | null,
  remainingDests: Destination[],
  mode: OptimizationMode,
  startLat: number,
  startLng: number
): number => {
  if (remainingDests.length === 0) return 0;

  // Use minimum spanning tree estimation as heuristic
  let heuristic = 0;
  
  // If no current destination, estimate from start point
  const fromLat = currentDest?.coordinates.latitude ?? startLat;
  const fromLng = currentDest?.coordinates.longitude ?? startLng;
  
  // Find nearest unvisited destination (admissible heuristic)
  let minDistance = Infinity;
  for (const dest of remainingDests) {
    const distance = calculateDistance(
      fromLat,
      fromLng,
      dest.coordinates.latitude,
      dest.coordinates.longitude
    );
    minDistance = Math.min(minDistance, distance);
  }
  
  // Estimate cost based on optimization mode
  if (mode === 'fastest') {
    heuristic = calculateTravelDuration(minDistance, mode);
  } else if (mode === 'cheapest') {
    heuristic = calculateTravelCost(minDistance, mode);
  } else {
    // Balanced: weighted combination
    const duration = calculateTravelDuration(minDistance, mode);
    const cost = calculateTravelCost(minDistance, mode);
    heuristic = (duration * 100) + (cost / 1000); // Normalize and combine
  }
  
  return heuristic;
};

// Calculate actual cost (g-score) based on optimization mode
const calculateGScore = (
  distance: number,
  mode: OptimizationMode
): number => {
  if (mode === 'fastest') {
    return calculateTravelDuration(distance, mode);
  } else if (mode === 'cheapest') {
    return calculateTravelCost(distance, mode);
  } else {
    // Balanced: weighted combination
    const duration = calculateTravelDuration(distance, mode);
    const cost = calculateTravelCost(distance, mode);
    return (duration * 100) + (cost / 1000);
  }
};

// A* Algorithm for Optimal Route Finding dengan Real-time Data
export const findOptimalRoute = async (
  startLat: number,
  startLng: number,
  destinations: Destination[],
  maxDestinations: number = 3,
  mode: OptimizationMode = 'balanced',
  departureTime?: Date,
  transportMode: TransportMode = 'car'
): Promise<Route> => {
  if (destinations.length === 0) {
    throw new Error("No destinations provided");
  }

  const now = departureTime || new Date();

  // Limit destinations
  const targetDestinations = Math.min(maxDestinations, destinations.length);
  
  // Priority queue for A* (sorted by f-score)
  const openSet = new PriorityQueue<AStarState>();
  
  // Track if we're using real-time data
  let usedRealTimeData = false;
  
  // Initial state: start from user location
  const initialState: AStarState = {
    visited: new Set<number>(),
    currentDest: null,
    path: [],
    gScore: 0,
    fScore: calculateHeuristic(null, destinations, mode, startLat, startLng)
  };
  
  openSet.enqueue(initialState, initialState.fScore);
  
  let bestRoute: Route | null = null;
  let bestScore = Infinity;
  
  // A* search
  while (!openSet.isEmpty()) {
    const currentState = openSet.dequeue()!;
    
    // Goal check: visited enough destinations
    if (currentState.visited.size >= targetDestinations) {
      // Found a complete route
      const totalDistance = currentState.path.reduce((sum, node) => sum + node.distance, 0);
      const totalDuration = currentState.path.reduce((sum, node) => sum + node.duration, 0);
      const totalCost = currentState.path.reduce((sum, node) => sum + node.cost, 0);
      
      const route: Route = {
        nodes: currentState.path,
        totalDistance,
        totalDuration,
        totalCost,
        isRealTimeData: usedRealTimeData,
        dataSource: usedRealTimeData ? 'ors' : 'fallback'
      };
      
      // Keep best route
      if (currentState.gScore < bestScore) {
        bestScore = currentState.gScore;
        bestRoute = route;
      }
      
      continue; // Continue searching for better routes
    }
    
    // Get current position
    const fromLat = currentState.currentDest?.coordinates.latitude ?? startLat;
    const fromLng = currentState.currentDest?.coordinates.longitude ?? startLng;
    
    // Expand to unvisited destinations
    const unvisited = destinations.filter(dest => !currentState.visited.has(dest.id));
    
    for (const nextDest of unvisited) {
      // Try to get real-time route data with fallback
      const routeResult = await getRouteData(
        fromLat,
        fromLng,
        nextDest.coordinates.latitude,
        nextDest.coordinates.longitude,
        mode,
        transportMode // Pass transport mode for correct duration calculation
      );

      if (routeResult.isRealTime) {
        usedRealTimeData = true;
      }

      const distance = routeResult.data.distance;
      const duration = routeResult.data.duration;
      
      // Calculate cost with dynamic pricing and transport mode
      const costBreakdown = getTravelCostBreakdown(distance, mode, now, transportMode);
      const cost = costBreakdown.totalCost;
      
      const edgeCost = calculateGScore(distance, mode);
      const newGScore = currentState.gScore + edgeCost;
      
      // Create new state
      const newVisited = new Set(currentState.visited);
      newVisited.add(nextDest.id);
      
      const newPath = [
        ...currentState.path,
        {
          destination: nextDest,
          distance,
          duration,
          cost,
          pricingBreakdown: costBreakdown
        }
      ];
      
      const remainingDests = destinations.filter(d => !newVisited.has(d.id));
      const heuristic = calculateHeuristic(nextDest, remainingDests, mode, startLat, startLng);
      const newFScore = newGScore + heuristic;
      
      const newState: AStarState = {
        visited: newVisited,
        currentDest: nextDest,
        path: newPath,
        gScore: newGScore,
        fScore: newFScore
      };
      
      openSet.enqueue(newState, newFScore);
    }
  }
  
  // Return best route found
  if (!bestRoute) {
    throw new Error("No valid route found");
  }
  
  return bestRoute;
};
