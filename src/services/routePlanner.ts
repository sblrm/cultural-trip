
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

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; 
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

export const calculateTravelCost = (distance: number): number => {
  const baseCost = 50000;
  const costPerKm = 5000;
  return Math.round(baseCost + costPerKm * distance);
};

export const calculateTravelDuration = (distance: number): number => {
  const averageSpeed = 40; 
  return Math.round((distance / averageSpeed) * 60); 
};

export const findOptimalRoute = (
  startLat: number,
  startLng: number,
  destinations: Destination[],
  maxDestinations: number = 3
): Route => {
  if (destinations.length === 0) {
    throw new Error("No destinations provided");
  }

  const startToDestDistances = destinations.map(dest => ({
    destination: dest,
    distance: calculateDistance(
      startLat,
      startLng,
      dest.coordinates.latitude,
      dest.coordinates.longitude
    )
  }));

  startToDestDistances.sort((a, b) => a.distance - b.distance);

  const firstDestination = startToDestDistances[0].destination;
  
  const graph: Map<number, { dest: Destination; distance: number }[]> = new Map();
  
  for (const destA of destinations) {
    const connections: { dest: Destination; distance: number }[] = [];
    
    for (const destB of destinations) {
      if (destA.id !== destB.id) {
        const distance = calculateDistance(
          destA.coordinates.latitude,
          destA.coordinates.longitude,
          destB.coordinates.latitude,
          destB.coordinates.longitude
        );
        connections.push({ dest: destB, distance });
      }
    }
    
    graph.set(destA.id, connections);
  }

  const visited = new Set<number>([firstDestination.id]);
  const route: RouteNode[] = [
    {
      destination: firstDestination,
      distance: startToDestDistances[0].distance,
      duration: calculateTravelDuration(startToDestDistances[0].distance),
      cost: calculateTravelCost(startToDestDistances[0].distance)
    }
  ];

  const remainingDests = Math.min(maxDestinations - 1, destinations.length - 1);
  
  for (let i = 0; i < remainingDests; i++) {
    const lastDest = route[route.length - 1].destination;
    const connections = graph.get(lastDest.id) || [];
    
    connections.sort((a, b) => a.distance - b.distance);
    
    const nextConnection = connections.find(conn => !visited.has(conn.dest.id));
    
    if (nextConnection) {
      visited.add(nextConnection.dest.id);
      
      route.push({
        destination: nextConnection.dest,
        distance: nextConnection.distance,
        duration: calculateTravelDuration(nextConnection.distance),
        cost: calculateTravelCost(nextConnection.distance)
      });
    }
  }

  const totalDistance = route.reduce((sum, node) => sum + node.distance, 0);
  const totalDuration = route.reduce((sum, node) => sum + node.duration, 0);
  const totalCost = route.reduce((sum, node) => sum + node.cost, 0);

  return {
    nodes: route,
    totalDistance,
    totalDuration,
    totalCost
  };
};
