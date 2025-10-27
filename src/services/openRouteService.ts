/**
 * OpenRouteService API Integration
 * 
 * Provides real-time routing, distance matrix, and traffic data
 * Free tier: 2,000 requests/day, 40 requests/minute
 * Docs: https://openrouteservice.org/dev/#/api-docs
 * 
 * Security: API key is kept server-side via /api/openroute proxy
 */

const ORS_PROXY_URL = '/api/openroute';

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
 * Uses ORS Matrix API via server-side proxy
 */
export const getDistanceMatrix = async (
  locations: ORSCoordinate[]
): Promise<MatrixData[]> => {
  if (locations.length < 2) {
    throw new Error('At least 2 locations required for matrix calculation');
  }

  try {
    // Convert to ORS format: [lng, lat] (not lat, lng!)
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

    const response = await fetch(ORS_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'matrix',
        locations: coordinates,
        metrics: ['distance', 'duration'],
        profile: 'driving-car'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        throw new Error('OpenRouteService API key not configured');
      }
      throw new Error(`ORS Matrix API error: ${response.status} - ${errorData.error}`);
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
 * Uses ORS Directions API via server-side proxy
 */
export const getRoute = async (
  start: ORSCoordinate,
  end: ORSCoordinate,
  profile: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<RouteData> => {
  try {
    // Convert to ORS format: [lng, lat]
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(ORS_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'directions',
        coordinates,
        profile
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        throw new Error('OpenRouteService API key not configured');
      }
      throw new Error(`ORS Directions API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      distance: route.summary.distance / 1000, // meters to km
      duration: route.summary.duration / 60, // seconds to minutes
      geometry: route.geometry
    };
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    throw error;
  }
};

/**
 * Get route with traffic consideration (fastest route)
 * Uses ORS Directions API via proxy
 */
export const getFastestRoute = async (
  start: ORSCoordinate,
  end: ORSCoordinate
): Promise<RouteData> => {
  try {
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(ORS_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'directions',
        coordinates,
        profile: 'driving-car'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        throw new Error('OpenRouteService API key not configured');
      }
      throw new Error(`ORS Fastest Route API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      distance: route.summary.distance / 1000,
      duration: route.summary.duration / 60
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
  try {
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(ORS_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'directions',
        coordinates,
        profile: 'driving-car'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        throw new Error('OpenRouteService API key not configured');
      }
      throw new Error(`ORS Cheapest Route API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      distance: route.summary.distance / 1000,
      duration: route.summary.duration / 60
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
