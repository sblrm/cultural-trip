/**
 * OpenRouteService API Integration
 * 
 * Provides real-time routing, distance matrix, and traffic data
 * Free tier: 2,000 requests/day, 40 requests/minute
 * Docs: https://openrouteservice.org/dev/#/api-docs
 */

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org';

export interface ORSCoordinate {
  lat: number;
  lng: number;
}

export interface ORSMatrixResponse {
  durations: number[][]; // seconds
  distances: number[][]; // meters
  metadata?: {
    query: {
      profile: string;
      sources: number[];
      destinations: number[];
    };
  };
}

export interface ORSDirectionResponse {
  features: Array<{
    properties: {
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
      segments: Array<{
        distance: number;
        duration: number;
        steps: Array<{
          distance: number;
          duration: number;
          type: number;
          instruction: string;
        }>;
      }>;
    };
    geometry: {
      coordinates: number[][];
      type: string;
    };
  }>;
}

export interface RouteData {
  distance: number; // kilometers
  duration: number; // minutes
  instructions?: string[];
  geometry?: number[][];
}

export interface MatrixData {
  from: number; // index
  to: number; // index
  distance: number; // kilometers
  duration: number; // minutes
}

/**
 * Get distance and duration matrix between multiple locations
 * Uses ORS Matrix API for efficient batch calculations
 */
export const getDistanceMatrix = async (
  locations: ORSCoordinate[]
): Promise<MatrixData[]> => {
  if (!ORS_API_KEY) {
    throw new Error('OpenRouteService API key not configured');
  }

  if (locations.length < 2) {
    throw new Error('At least 2 locations required for matrix calculation');
  }

  try {
    // Convert to ORS format: [lng, lat] (not lat, lng!)
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

    const response = await fetch(`${ORS_BASE_URL}/v2/matrix/driving-car`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        locations: coordinates,
        metrics: ['distance', 'duration'],
        units: 'km'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ORS Matrix API error: ${response.status} - ${errorText}`);
    }

    const data: ORSMatrixResponse = await response.json();

    // Convert matrix to flat array of routes
    const results: MatrixData[] = [];
    for (let i = 0; i < data.distances.length; i++) {
      for (let j = 0; j < data.distances[i].length; j++) {
        if (i !== j) { // Skip self-to-self
          results.push({
            from: i,
            to: j,
            distance: data.distances[i][j] / 1000, // meters to km
            duration: data.durations[i][j] / 60 // seconds to minutes
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching ORS distance matrix:', error);
    throw error;
  }
};

/**
 * Get detailed route between two points
 * Uses ORS Directions API for turn-by-turn navigation
 */
export const getRoute = async (
  start: ORSCoordinate,
  end: ORSCoordinate,
  profile: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<RouteData> => {
  if (!ORS_API_KEY) {
    throw new Error('OpenRouteService API key not configured');
  }

  try {
    // Convert to ORS format: [lng, lat]
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(`${ORS_BASE_URL}/v2/directions/${profile}/json`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        instructions: true,
        preference: 'recommended' // Balances distance, duration, and road quality
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ORS Directions API error: ${response.status} - ${errorText}`);
    }

    const data: ORSDirectionResponse = await response.json();
    const route = data.features[0];

    return {
      distance: route.properties.summary.distance / 1000, // meters to km
      duration: route.properties.summary.duration / 60, // seconds to minutes
      instructions: route.properties.segments[0]?.steps.map(step => step.instruction),
      geometry: route.geometry.coordinates
    };
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    throw error;
  }
};

/**
 * Get route with traffic consideration (fastest route)
 * Uses avoid_features to optimize for speed
 */
export const getFastestRoute = async (
  start: ORSCoordinate,
  end: ORSCoordinate
): Promise<RouteData> => {
  if (!ORS_API_KEY) {
    throw new Error('OpenRouteService API key not configured');
  }

  try {
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/json`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        preference: 'fastest', // Prioritize speed
        instructions: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ORS Fastest Route API error: ${response.status} - ${errorText}`);
    }

    const data: ORSDirectionResponse = await response.json();
    const route = data.features[0];

    return {
      distance: route.properties.summary.distance / 1000,
      duration: route.properties.summary.duration / 60
    };
  } catch (error) {
    console.error('Error fetching fastest route:', error);
    throw error;
  }
};

/**
 * Get cheapest route (avoid tolls, ferries)
 */
export const getCheapestRoute = async (
  start: ORSCoordinate,
  end: ORSCoordinate
): Promise<RouteData> => {
  if (!ORS_API_KEY) {
    throw new Error('OpenRouteService API key not configured');
  }

  try {
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/json`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        preference: 'shortest', // Prioritize distance (cheaper)
        options: {
          avoid_features: ['tollways', 'ferries'] // Avoid expensive routes
        },
        instructions: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ORS Cheapest Route API error: ${response.status} - ${errorText}`);
    }

    const data: ORSDirectionResponse = await response.json();
    const route = data.features[0];

    return {
      distance: route.properties.summary.distance / 1000,
      duration: route.properties.summary.duration / 60
    };
  } catch (error) {
    console.error('Error fetching cheapest route:', error);
    throw error;
  }
};

/**
 * Cache for API responses (1 hour TTL)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const getCachedOrFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  return data;
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      cache.delete(key);
    }
  }
};

// Auto-clear cache every 5 minutes
setInterval(clearExpiredCache, 5 * 60 * 1000);
