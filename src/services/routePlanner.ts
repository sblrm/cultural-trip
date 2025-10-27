
import { Destination } from "@/contexts/DestinationsContext";

export interface RouteNode {
  destination: Destination;
  distance: number;
  duration: number;
  cost: number;
}

export interface Route {
  nodes: RouteNode[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
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

// Enhanced cost calculation dengan realistic factors
export const calculateTravelCost = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced' = 'balanced'
): number => {
  const baseCost = 50000; // Base cost untuk perjalanan
  
  // Different cost per km based on optimization mode
  const costPerKm = {
    fastest: 8000,    // Toll roads, faster but more expensive
    cheapest: 3000,   // Avoid tolls, cheaper but slower
    balanced: 5000    // Mix of both
  };
  
  // Fuel efficiency factor (realistic)
  const fuelPrice = 10000; // Rp per liter
  const fuelConsumption = 12; // km per liter (average)
  const fuelCost = (distance / fuelConsumption) * fuelPrice;
  
  // Base travel cost + fuel
  const travelCost = costPerKm[mode] * distance;
  
  return Math.round(baseCost + travelCost + fuelCost);
};

// Enhanced duration calculation dengan realistic speeds
export const calculateTravelDuration = (
  distance: number,
  mode: 'fastest' | 'cheapest' | 'balanced' = 'balanced'
): number => {
  // Average speed based on mode (km/h)
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
  
  const baseTime = (distance / averageSpeed[mode]) * 60; // minutes
  return Math.round(baseTime * trafficBuffer[mode]);
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

// A* Algorithm for Optimal Route Finding
export const findOptimalRoute = (
  startLat: number,
  startLng: number,
  destinations: Destination[],
  maxDestinations: number = 3,
  mode: OptimizationMode = 'balanced'
): Route => {
  if (destinations.length === 0) {
    throw new Error("No destinations provided");
  }

  // Limit destinations
  const targetDestinations = Math.min(maxDestinations, destinations.length);
  
  // Priority queue for A* (sorted by f-score)
  const openSet = new PriorityQueue<AStarState>();
  
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
        totalCost
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
      const distance = calculateDistance(
        fromLat,
        fromLng,
        nextDest.coordinates.latitude,
        nextDest.coordinates.longitude
      );
      
      const duration = calculateTravelDuration(distance, mode);
      const cost = calculateTravelCost(distance, mode);
      
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
          cost
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
