"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RouteWaypoint } from "./RouteWaypoint";
import { snapToRoad, reverseGeocode, calculateDistance, getRouteGeometry, type Waypoint } from "@/lib/mapbox";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin } from "lucide-react";

interface RouteMapProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[], snappedCoordinates?: number[][]) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  isAddingSegment?: boolean;
  onSegmentAdded?: () => void;
}

export function RouteMap({
  waypoints,
  onWaypointsChange,
  initialCenter = [-98.5795, 39.8283], // Center of USA
  initialZoom = 4,
  isAddingSegment = false,
  onSegmentAdded,
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snappedCoordinates, setSnappedCoordinates] = useState<number[][]>([]);
  const routeLayerId = "route-line";

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Initialize map (only once)
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      maxPitch: 0,
      projection: "mercator",
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]); // Only depend on mapboxToken, not initialCenter/initialZoom

  // Handle map clicks to add waypoints
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
      // Only allow adding waypoints if explicitly in "add segment" mode or if no waypoints exist
      if (!isAddingSegment && waypoints.length > 0) {
        return;
      }

      if (isLoading) return;

      const { lng, lat } = e.lngLat;
      setIsLoading(true);

      try {
        // Snap to road
        const snapped = await snapToRoad(lat, lng, mapboxToken);
        if (!snapped) {
          setIsLoading(false);
          return;
        }

        // Get address
        const address = await reverseGeocode(snapped.lat, snapped.lng, mapboxToken);

        // Add new waypoint
        const newWaypoint: Waypoint = {
          lat: snapped.lat,
          lng: snapped.lng,
          address: address || undefined,
          order: waypoints.length + 1,
        };

        const updatedWaypoints = [...waypoints, newWaypoint];
        const sorted = updatedWaypoints.sort((a, b) => a.order - b.order);
        const coords = sorted.map((wp) => [wp.lng, wp.lat]);
        onWaypointsChange(updatedWaypoints, coords);
        
        // Stay in add mode - don't call onSegmentAdded here
        // User will exit via Done button or Escape key
      } catch (error) {
        console.error("Error adding waypoint:", error);
      } finally {
        setIsLoading(false);
      }
    };

    map.current.on("click", handleMapClick);

    return () => {
      if (map.current) {
        map.current.off("click", handleMapClick);
      }
    };
  }, [mapboxToken, isAddingSegment, waypoints.length, isLoading, onWaypointsChange]);

  // Handle Escape key to exit add mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAddingSegment && onSegmentAdded) {
        onSegmentAdded();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddingSegment, onSegmentAdded]);

  // Change cursor and lock zoom/pan when in add mode
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const canvas = map.current.getCanvas();
    canvas.style.cursor = isAddingSegment ? "crosshair" : "";

    if (isAddingSegment) {
      // Disable all zoom and pan controls
      map.current.scrollZoom.disable();
      map.current.boxZoom.disable();
      map.current.doubleClickZoom.disable();
      map.current.touchZoomRotate.disable();
      map.current.dragPan.disable();
      map.current.keyboard.disable();
    } else {
      // Re-enable all controls
      map.current.scrollZoom.enable();
      map.current.boxZoom.enable();
      map.current.doubleClickZoom.enable();
      map.current.touchZoomRotate.enable();
      map.current.dragPan.enable();
      map.current.keyboard.enable();
    }
  }, [isAddingSegment, mapLoaded]);

  // Fit bounds when exiting add mode with waypoints
  useEffect(() => {
    if (!map.current || !mapLoaded || isAddingSegment) return;
    
    if (waypoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach((wp) => {
        bounds.extend([wp.lng, wp.lat]);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [mapLoaded]); // Only run when map first loads, not on every waypoint change

  // Update route line when waypoints change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    if (waypoints.length < 2) {
      // Remove route line if less than 2 waypoints
      if (map.current?.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
      }
      if (map.current?.getSource(routeLayerId)) {
        map.current.removeSource(routeLayerId);
      }
      setSnappedCoordinates([]);
      return;
    }

    // Fetch the road-following route from Mapbox Directions API
    const fetchRoute = async () => {
      const routeCoords = await getRouteGeometry(waypoints, mapboxToken);
      
      // Fallback to straight line if route fetch fails
      const coordinates = routeCoords || waypoints
        .sort((a, b) => a.order - b.order)
        .map((wp) => [wp.lng, wp.lat]);

      setSnappedCoordinates(coordinates);

      if (!map.current) return;

      // Update or create route line
      if (map.current.getSource(routeLayerId)) {
        const source = map.current.getSource(routeLayerId) as mapboxgl.GeoJSONSource;
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      } else {
        map.current.addSource(routeLayerId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });

        map.current.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeLayerId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.7,
          },
        });
      }
    };

    fetchRoute();
  }, [waypoints, routeLayerId, mapboxToken]);

  const handleWaypointDrag = useCallback(
    async (index: number, lat: number, lng: number) => {
      if (!mapboxToken || isLoading) return;

      setIsLoading(true);
      try {
        // Snap dragged waypoint to road
        const snapped = await snapToRoad(lat, lng, mapboxToken);
        if (!snapped) {
          setIsLoading(false);
          return;
        }

        // Get address
        const address = await reverseGeocode(snapped.lat, snapped.lng, mapboxToken);

        // Update waypoint
        const updated = [...waypoints];
        updated[index] = {
          ...updated[index],
          lat: snapped.lat,
          lng: snapped.lng,
          address: address || updated[index].address,
        };

        const sorted = updated.sort((a, b) => a.order - b.order);
        const coords = sorted.map((wp) => [wp.lng, wp.lat]);
        onWaypointsChange(updated, coords);
      } catch (error) {
        console.error("Error updating waypoint:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [waypoints, onWaypointsChange, mapboxToken, isLoading]
  );

  const handleWaypointDelete = useCallback(
    (index: number) => {
      const updated = waypoints.filter((_, i) => i !== index);
      // Reorder remaining waypoints
      const reordered = updated.map((wp, i) => ({
        ...wp,
        order: i + 1,
      }));
      const sorted = reordered.sort((a, b) => a.order - b.order);
      const coords = sorted.map((wp) => [wp.lng, wp.lat]);
      onWaypointsChange(reordered, coords);
    },
    [waypoints, onWaypointsChange]
  );

  const calculateTotalDistance = () => {
    if (waypoints.length < 2) return 0;
    let total = 0;
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length - 1; i++) {
      total += calculateDistance(
        sorted[i].lat,
        sorted[i].lng,
        sorted[i + 1].lat,
        sorted[i + 1].lng
      );
    }
    return total;
  };

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Mapbox token not configured</p>
          <p className="text-sm text-gray-500">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Snapping to road...</span>
        </div>
      )}

      {/* Waypoint markers */}
      {map.current &&
        waypoints.map((waypoint, index) => (
          <RouteWaypoint
            key={`${waypoint.lat}-${waypoint.lng}-${index}`}
            map={map.current!}
            lat={waypoint.lat}
            lng={waypoint.lng}
            order={waypoint.order}
            onDrag={(lat, lng) => handleWaypointDrag(index, lat, lng)}
            onDelete={() => handleWaypointDelete(index)}
          />
        ))}

      {/* Route summary */}
      {waypoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {waypoints.length} {waypoints.length === 1 ? "waypoint" : "waypoints"}
              </span>
            </div>
            {waypoints.length >= 2 && (
              <div className="text-sm text-gray-600">
                Distance: {calculateTotalDistance().toFixed(1)} mi
              </div>
            )}
            {waypoints.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWaypointsChange([], [])}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {isAddingSegment && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs z-20">
          <p className="text-sm font-medium">
            Click on the map to add a waypoint. The point will automatically snap to the nearest road.
          </p>
        </div>
      )}
      {waypoints.length === 0 && !isAddingSegment && (
        <div className="absolute top-4 right-4 bg-white px-4 py-3 rounded-lg shadow-lg max-w-xs z-20">
          <p className="text-sm text-gray-700">
            Click "Add New Segment" to start adding waypoints to your route.
          </p>
        </div>
      )}
    </div>
  );
}

