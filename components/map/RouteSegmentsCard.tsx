"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, MapPin, Maximize2, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import type { Waypoint } from "@/lib/mapbox";

interface RouteSegmentsCardProps {
  routeName?: string;
  routeId?: string;
  createdAt?: Date;
  lastEdited?: Date;
  waypoints: Waypoint[];
  isAddingSegment?: boolean;
  onAddSegment?: () => void;
  onDoneAdding?: () => void;
  onExpand?: () => void;
  onRemoveWaypoint?: (index: number) => void;
}

export function RouteSegmentsCard({
  routeName,
  routeId,
  createdAt,
  lastEdited,
  waypoints,
  isAddingSegment,
  onAddSegment,
  onDoneAdding,
  onExpand,
  onRemoveWaypoint,
}: RouteSegmentsCardProps) {
  const formatDate = (date?: Date) => {
    if (!date) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]}, ${date.getDate()}`;
  };

  const formatTimeAgo = (date?: Date) => {
    if (!date) return "just now";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Generate route name from waypoints if not provided
  const displayName = routeName || (waypoints.length >= 2
    ? `${waypoints[0]?.address?.split(",")[0] || "Origin"} to ${waypoints[waypoints.length - 1]?.address?.split(",")[0] || "Destination"}`
    : "New Route");

  // Generate route ID if not provided
  const displayId = routeId || `#${Math.floor(Math.random() * 10000000)}`;

  const segments = waypoints.length > 0 ? waypoints.length - 1 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Top Section */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
          <div className="flex items-center gap-2">
            {onExpand && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExpand}
                className="h-8 w-8 p-0 border-gray-300"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 px-3 border-gray-300 text-gray-700">
              Option
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 border-gray-300 text-gray-700">
              Option
            </Button>
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-500">
          <div>{displayId}</div>
          {createdAt && (
            <div>Created • at: {formatDate(createdAt)}</div>
          )}
          <div>Last Edited: • {formatTimeAgo(lastEdited || new Date())}</div>
        </div>
      </div>

      {/* Segments Section */}
      <div className="p-6">
        {segments === 0 && waypoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-6 text-center">There are no Segments added yet.</p>
            {isAddingSegment ? (
              <Button
                onClick={onDoneAdding}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                <Check className="h-4 w-4 mr-2" />
                Done Adding
              </Button>
            ) : (
              onAddSegment && (
                <Button
                  onClick={onAddSegment}
                  variant="outline"
                  className="border-gray-300 bg-white hover:bg-gray-50 px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Segment
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Waypoints ({waypoints.length})
              </h3>
              {isAddingSegment ? (
                <Button
                  onClick={onDoneAdding}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done Adding
                </Button>
              ) : (
                onAddSegment && (
                  <Button
                    onClick={onAddSegment}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Segment
                  </Button>
                )
              )}
            </div>
            <div className="space-y-2">
              {waypoints.map((wp, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === waypoints.length - 1;
                const label = isFirst ? "Origin" : isLast ? "Destination" : `Stop ${idx}`;
                
                return (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {label}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {wp.address || `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}
                        </div>
                      </div>
                      {onRemoveWaypoint && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onRemoveWaypoint(idx)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

