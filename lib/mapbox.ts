/**
 * Mapbox utilities for road snapping and route management
 */

export interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  order: number;
}

export interface GeocodingResult {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  context?: string;
}

/**
 * Forward geocode a search query to get location suggestions
 */
export async function forwardGeocode(
  query: string,
  accessToken: string,
  options?: { country?: string; types?: string; limit?: number }
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      limit: String(options?.limit ?? 5),
      autocomplete: "true",
    });

    if (options?.country) {
      params.set("country", options.country);
    }

    // Types: address, place, postcode, locality, neighborhood, poi
    if (options?.types) {
      params.set("types", options.types);
    } else {
      // Default to address, place, postcode for logistics use case
      params.set("types", "address,place,postcode,locality");
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      console.error("Mapbox Geocoding API error:", await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map((feature: {
      id: string;
      place_name: string;
      center: [number, number];
      context?: Array<{ text: string }>;
    }) => ({
      id: feature.id,
      placeName: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
      context: feature.context?.map((c) => c.text).join(", "),
    }));
  } catch (error) {
    console.error("Error forward geocoding:", error);
    return [];
  }
}

export interface SnappedCoordinate {
  lng: number;
  lat: number;
}

export interface RoadSegment {
  coordinates: [number, number][];  // [lng, lat] pairs
  distance: number;                 // meters
  duration: number;                 // seconds
  roadClass?: string;               // 'motorway', 'trunk', 'primary', 'secondary', etc.
  lanes?: number;                   // estimated lanes in travel direction
  heading?: number;                 // compass bearing 0-360
  name?: string;                    // road name
  startIndex: number;               // index in full coordinates array
  endIndex: number;                 // index in full coordinates array
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

/**
 * Calculate compass bearing between two coordinates
 * Returns bearing in degrees (0-360) where 0 is North
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Convert numeric bearing to cardinal direction
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Estimate lane count from Mapbox road class
 * This is a heuristic since Mapbox doesn't always provide exact lane counts
 */
function estimateLanesFromRoadClass(roadClass: string): number {
  switch (roadClass) {
    case 'motorway':
    case 'motorway_link':
      return 3; // Typically 2-4 lanes per direction
    case 'trunk':
    case 'trunk_link':
      return 2; // Typically 2-3 lanes per direction
    case 'primary':
    case 'primary_link':
      return 2; // Typically 1-2 lanes per direction
    case 'secondary':
    case 'secondary_link':
    case 'tertiary':
    case 'tertiary_link':
      return 1; // Typically 1 lane per direction
    default:
      return 1; // Conservative estimate
  }
}

/**
 * Get driving route with detailed road segment information
 * Returns both route geometry and road segment metadata
 */
export async function getRouteWithRoadData(
  waypoints: Waypoint[],
  accessToken: string
): Promise<{ geometry: number[][], segments: RoadSegment[] } | null> {
  if (waypoints.length < 2) return null;

  try {
    // Sort waypoints by order and format as coordinates string
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    const coordinates = sorted.map((wp) => `${wp.lng},${wp.lat}`).join(";");

    // Request route with steps for detailed segment information
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
      `access_token=${accessToken}&` +
      `geometries=geojson&` +
      `overview=full&` +
      `steps=true`
    );

    if (!response.ok) {
      console.error("Mapbox Directions API error:", await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const fullGeometry = route.geometry.coordinates;
    const segments: RoadSegment[] = [];

    // Process each leg and its steps to create road segments
    let coordinateIndex = 0;
    
    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            const stepCoords = step.geometry.coordinates;
            const stepLength = stepCoords.length;
            
            if (stepLength > 0) {
              // Calculate bearing from step coordinates
              let bearing: number | undefined;
              if (stepLength >= 2) {
                const [lng1, lat1] = stepCoords[0];
                const [lng2, lat2] = stepCoords[stepLength - 1];
                bearing = calculateBearing(lat1, lng1, lat2, lng2);
              } else if (step.maneuver?.bearing_after !== undefined) {
                bearing = step.maneuver.bearing_after;
              }

              // Extract road class and estimate lanes
              const roadClass = step.class || step.modifier || undefined;
              const estimatedLanes = roadClass ? estimateLanesFromRoadClass(roadClass) : undefined;

              segments.push({
                coordinates: stepCoords,
                distance: step.distance,
                duration: step.duration,
                roadClass: roadClass,
                lanes: estimatedLanes,
                heading: bearing,
                name: step.name || undefined,
                startIndex: coordinateIndex,
                endIndex: coordinateIndex + stepLength - 1,
              });

              coordinateIndex += stepLength;
            }
          }
        }
      }
    }

    return {
      geometry: fullGeometry,
      segments: segments,
    };
  } catch (error) {
    console.error("Error getting route with road data:", error);
    return null;
  }
}

