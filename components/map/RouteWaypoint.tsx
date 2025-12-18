"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface RouteWaypointProps {
  map: mapboxgl.Map;
  lat: number;
  lng: number;
  order: number;
  onDrag?: (lat: number, lng: number) => void;
  onDelete?: () => void;
}

export function RouteWaypoint({ map, lat, lng, order, onDrag, onDelete }: RouteWaypointProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create custom marker element
    const el = document.createElement("div");
    el.className = "route-waypoint-marker";
    el.innerHTML = `
      <div class="waypoint-pin">
        <div class="waypoint-number">${order}</div>
      </div>
    `;

    // Add styles - pin points downward
    el.style.cursor = "grab";
    
    const pinStyle = `
      .route-waypoint-marker {
        width: 32px;
        height: 40px;
        position: relative;
      }
      .route-waypoint-marker .waypoint-pin {
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
      }
      .route-waypoint-marker .waypoint-pin::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid #3b82f6;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
      }
      .route-waypoint-marker .waypoint-number {
        color: white;
        font-weight: bold;
        font-size: 14px;
        position: relative;
        z-index: 1;
      }
    `;
    
    // Add styles if not already added
    if (!document.getElementById("waypoint-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "waypoint-styles";
      styleSheet.textContent = pinStyle;
      document.head.appendChild(styleSheet);
    }

    // Create marker with anchor at bottom center (where the pin points)
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: !!onDrag,
      anchor: "bottom",
    })
      .setLngLat([lng, lat])
      .addTo(map);

    markerRef.current = marker;

    // Handle drag events
    if (onDrag) {
      marker.on("dragend", () => {
        const { lng: newLng, lat: newLat } = marker.getLngLat();
        onDrag(newLat, newLng);
      });
    }

    // Add delete button on hover
    if (onDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "×";
      deleteBtn.className = "waypoint-delete-btn";
      deleteBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        border: 2px solid white;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        onDelete();
      };
      el.appendChild(deleteBtn);

      el.onmouseenter = () => {
        deleteBtn.style.display = "flex";
      };
      el.onmouseleave = () => {
        deleteBtn.style.display = "none";
      };
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, lat, lng, order, onDrag, onDelete]);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, [lat, lng]);

  // Update order number
  useEffect(() => {
    if (markerRef.current && markerRef.current.getElement()) {
      const numberEl = markerRef.current.getElement().querySelector(".waypoint-number");
      if (numberEl) {
        numberEl.textContent = order.toString();
      }
    }
  }, [order]);

  return null;
}

