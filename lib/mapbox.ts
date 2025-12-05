/**
 * Mapbox utilities for road snapping and route management
 */

export interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  order: number;
}

export interface SnappedCoordinate {
  lng: number;
  lat: number;
}

/**
 * Snap a coordinate to the nearest road using Mapbox Map Matching API
 * This only snaps the point to the road, it does NOT route between points
 */
export async function snapToRoad(
  lat: number,
  lng: number,
  accessToken: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use Mapbox Map Matching API to snap a single point to the nearest road
    // Map Matching requires at least 2 coordinates, so we duplicate the point
    // Format: lng,lat;lng,lat (semicolon-separated coordinate pairs)
    const coordinates = `${lng},${lat};${lng},${lat}`;
    
    const response = await fetch(
      `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?access_token=${accessToken}&geometries=geojson&radiuses=100;100`
    );

    if (!response.ok) {
      console.error('Mapbox API error:', await response.text());
      return null;
    }

    const data = await response.json();
    
    // Extract the snapped coordinate from the matched trace
    if (data.matchings && data.matchings.length > 0) {
      const matching = data.matchings[0];
      if (matching.geometry && matching.geometry.coordinates && matching.geometry.coordinates.length > 0) {
        const [snappedLng, snappedLat] = matching.geometry.coordinates[0];
        return { lat: snappedLat, lng: snappedLng };
      }
    }

    // Fallback: if map matching fails, return original coordinate
    return { lat, lng };
  } catch (error) {
    console.error('Error snapping to road:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&limit=1`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || null;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Get driving route between waypoints using Mapbox Directions API
 * Returns the route geometry coordinates that follow roads
 */
export async function getRouteGeometry(
  waypoints: Waypoint[],
  accessToken: string
): Promise<number[][] | null> {
  if (waypoints.length < 2) return null;

  try {
    // Sort waypoints by order and format as coordinates string
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    const coordinates = sorted.map((wp) => `${wp.lng},${wp.lat}`).join(";");

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${accessToken}&geometries=geojson&overview=full`
    );

    if (!response.ok) {
      console.error("Mapbox Directions API error:", await response.text());
      return null;
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates;
    }

    return null;
  } catch (error) {
    console.error("Error getting route geometry:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

