/**
 * OpenRouteService API Proxy
 * 
 * Server-side proxy to protect ORS API key from browser exposure
 * Provides routing and directions data for trip planning
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RouteRequest {
  coordinates: [number, number][];
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular';
}

interface MatrixRequest {
  locations: [number, number][];
  metrics?: string[];
  profile?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    console.warn('ORS_API_KEY not configured');
    return res.status(503).json({ 
      error: 'OpenRouteService API key not configured',
      fallback: true 
    });
  }

  try {
    const { endpoint, ...requestBody } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    let url = '';
    let body: any = {};

    switch (endpoint) {
      case 'directions':
        const { coordinates, profile = 'driving-car' } = requestBody as RouteRequest;
        
        if (!coordinates || coordinates.length < 2) {
          return res.status(400).json({ error: 'Invalid coordinates' });
        }

        url = `https://api.openrouteservice.org/v2/directions/${profile}`;
        body = {
          coordinates,
          instructions: false,
          geometry: true,
          // Request GeoJSON format instead of encoded polyline
          format: 'geojson',
        };
        break;

      case 'matrix':
        const { locations, metrics = ['distance', 'duration'], profile: matrixProfile = 'driving-car' } = requestBody as MatrixRequest;
        
        if (!locations || locations.length < 2) {
          return res.status(400).json({ error: 'Invalid locations' });
        }

        url = `https://api.openrouteservice.org/v2/matrix/${matrixProfile}`;
        body = {
          locations,
          metrics,
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid endpoint' });
    }

    // Call OpenRouteService API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ORS API error:', response.status, errorText);
      
      // Rate limit or quota exceeded
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          fallback: true 
        });
      }

      return res.status(response.status).json({ 
        error: 'OpenRouteService API error',
        fallback: true,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('OpenRouteService proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      fallback: true,
      message: error?.message || 'Unknown error'
    });
  }
}
