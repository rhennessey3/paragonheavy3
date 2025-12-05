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

    // Add styles
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.cursor = "grab";
    el.style.position = "relative";
    
    const pinStyle = `
      .route-waypoint-marker .waypoint-pin {
        width: 40px;
        height: 40px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .route-waypoint-marker .waypoint-number {
        transform: rotate(45deg);
        color: white;
        font-weight: bold;
        font-size: 14px;
      }
    `;
    
    // Add styles if not already added
    if (!document.getElementById("waypoint-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "waypoint-styles";
      styleSheet.textContent = pinStyle;
      document.head.appendChild(styleSheet);
    }

    // Create marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: !!onDrag,
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

