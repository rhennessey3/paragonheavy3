"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, MapPin, FolderOpen, ChevronRight, Send, ExternalLink, Bell, Settings2, ChevronDown, ChevronUp, Maximize2, Map, PanelLeftClose, PanelLeft, PanelRightOpen, PanelRightClose, X } from "lucide-react";
import { RouteMap } from "@/components/map/RouteMap";
import type { Waypoint } from "@/lib/mapbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressAutocomplete, type AddressSelection } from "@/components/ui/address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CostBreakdownTable, MOCK_COST_DATA } from "@/components/dashboard/CostBreakdownTable";
import {
  CombinedAxleConfigurationEditor,
  createEmptyAxleConfiguration,
  type AxleConfiguration,
} from "@/components/ui/axle-configuration-editor";

const formatRole = (role?: string) => {
  if (!role) return "Member";
  const cleanRole = role.replace(/^org:/, "");
  return cleanRole
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function CreateNewBidPage() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(
    api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Trucks and Trailers for the dropdowns
  const trucksList = useQuery(
    api.trucks.getTrucks,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const trailersList = useQuery(
    api.trailers.getTrailers,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const displayRole = formatRole(userProfile?.role);
  const orgName = organization?.name || "";

  const [activeSection, setActiveSection] = useState("load");
  const [sameAsCustomer, setSameAsCustomer] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState<Waypoint[]>([]);
  const [routeType, setRouteType] = useState<"interstate" | "non-interstate">("interstate");
  const [showAxleConfig, setShowAxleConfig] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  
  // Axle configuration state
  const [powerUnitAxleConfig, setPowerUnitAxleConfig] = useState<AxleConfiguration>(
    createEmptyAxleConfiguration(2)
  );
  const [drawnUnitAxleConfig, setDrawnUnitAxleConfig] = useState<AxleConfiguration>(
    createEmptyAxleConfiguration(2)
  );
  const [kingpinToFirstAxle, setKingpinToFirstAxle] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Section refs for scroll navigation
  const loadRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      "load": loadRef,
      "route": routeRef,
      "basic-info": basicInfoRef,
      "review": reviewRef,
    };
    const ref = refs[sectionId];
    if (ref?.current && mainContentRef.current) {
      const container = mainContentRef.current;
      const element = ref.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - 20;
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const container = mainContentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = [
        { id: "load", ref: loadRef },
        { id: "route", ref: routeRef },
        { id: "basic-info", ref: basicInfoRef },
        { id: "review", ref: reviewRef },
      ];
      
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      
      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          const offsetTop = rect.top - containerRect.top + scrollTop;
          if (scrollTop >= offsetTop - 100) {
            setActiveSection(section.id);
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle panel resize
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      // Constrain width between 320px and 800px
      if (newWidth >= 320 && newWidth <= 800) {
        setPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Load & Route form state
  const [loadRouteData, setLoadRouteData] = useState({
    origin: "",
    originCoords: null as { lat: number; lng: number } | null,
    destination: "",
    destinationCoords: null as { lat: number; lng: number } | null,
    loadLength: "",
    loadWidth: "",
    loadHeight: "",
    loadWeight: "",
    truckId: "",
    trailerId: "",
    overallLength: "",
    overallWidth: "",
    overallHeight: "",
    overallWeight: "",
  });

  const handleLoadRouteChange = (field: string, value: string) => {
    setLoadRouteData(prev => ({ ...prev, [field]: value }));
  };
  
  // Update axle config when truck/trailer selection changes
  useEffect(() => {
    if (loadRouteData.truckId && trucksList) {
      const selectedTruck = trucksList.find(t => t._id === loadRouteData.truckId);
      if (selectedTruck) {
        const axleConfig: AxleConfiguration = {
          axleCount: selectedTruck.axles,
          axleWeights: selectedTruck.axleWeights || createEmptyAxleConfiguration(selectedTruck.axles).axleWeights,
          axleDistances: selectedTruck.axleDistances || createEmptyAxleConfiguration(selectedTruck.axles).axleDistances,
        };
        setPowerUnitAxleConfig(axleConfig);
      }
    }
  }, [loadRouteData.truckId, trucksList]);
  
  useEffect(() => {
    if (loadRouteData.trailerId && trailersList) {
      const selectedTrailer = trailersList.find(t => t._id === loadRouteData.trailerId);
      if (selectedTrailer) {
        const axleConfig: AxleConfiguration = {
          axleCount: selectedTrailer.axles,
          axleWeights: selectedTrailer.axleWeights || createEmptyAxleConfiguration(selectedTrailer.axles).axleWeights,
          axleDistances: selectedTrailer.axleDistances || createEmptyAxleConfiguration(selectedTrailer.axles).axleDistances,
        };
        setDrawnUnitAxleConfig(axleConfig);
      }
    }
  }, [loadRouteData.trailerId, trailersList]);

  const handleOriginSelect = (selection: AddressSelection) => {
    setLoadRouteData(prev => ({
      ...prev,
      origin: selection.address,
      originCoords: { lat: selection.lat, lng: selection.lng },
    }));
    // Update waypoints with origin
    updateWaypointsFromAddresses(
      { lat: selection.lat, lng: selection.lng, address: selection.address },
      loadRouteData.destinationCoords ? { ...loadRouteData.destinationCoords, address: loadRouteData.destination } : null
    );
  };

  const handleDestinationSelect = (selection: AddressSelection) => {
    setLoadRouteData(prev => ({
      ...prev,
      destination: selection.address,
      destinationCoords: { lat: selection.lat, lng: selection.lng },
    }));
    // Update waypoints with destination
    updateWaypointsFromAddresses(
      loadRouteData.originCoords ? { ...loadRouteData.originCoords, address: loadRouteData.origin } : null,
      { lat: selection.lat, lng: selection.lng, address: selection.address }
    );
  };

  const updateWaypointsFromAddresses = (
    origin: { lat: number; lng: number; address: string } | null,
    destination: { lat: number; lng: number; address: string } | null
  ) => {
    const newWaypoints: Waypoint[] = [];
    if (origin) {
      newWaypoints.push({
        lat: origin.lat,
        lng: origin.lng,
        address: origin.address,
        order: 1,
      });
    }
    if (destination) {
      newWaypoints.push({
        lat: destination.lat,
        lng: destination.lng,
        address: destination.address,
        order: 2,
      });
    }
    setRouteWaypoints(newWaypoints);
  };

  const [formData, setFormData] = useState({
    bidTitle: "",
    bidId: "BID-GEN-12345",
    bidDescription: "",
    customerName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    shipperName: "",
    shipperContactName: "",
    shipperAddress: "",
    shipperPhone: "",
    shipperEmail: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    console.log("Save as draft", formData);
  };

  const handleSaveAndContinue = () => {
    console.log("Save & Continue", formData);
    // Scroll to next section
    if (activeSection === "load") {
      scrollToSection("route");
    } else if (activeSection === "route") {
      scrollToSection("basic-info");
    } else if (activeSection === "basic-info") {
      scrollToSection("review");
    }
  };

  const sections = [
    { id: "load", label: "Load" },
    { id: "route", label: "Route" },
    { id: "basic-info", label: "Basic Info" },
    { id: "review", label: "Review" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar with User Profile and Notifications */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/loads" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <FolderOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Work</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 px-3 py-1">
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Bid Details
              </span>
            </Badge>
          </div>

          {/* User Profile and Notifications */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pr-3 border-r border-gray-200">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user?.fullName || "User"} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-sm font-medium">
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.fullName || user?.firstName || "User"}
                </p>
                <p className="text-xs text-gray-500">{displayRole}</p>
                {orgName && (
                  <p className="text-xs text-gray-400">{orgName}</p>
                )}
              </div>
            </div>
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Bid Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          {/* Left: Title, Status Badge, and Metadata */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.bidTitle || "New Bid"}
              </h1>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 px-3 py-1 flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Draft
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">#{formData.bidId}</span>
              <span className="text-gray-300">•</span>
              <span>Created at: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-gray-300">•</span>
              <span>Last Edited: Just now</span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Bid
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Save & Continue
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 border-t border-gray-100 pt-4 -mx-6 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex gap-0">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === section.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              
              {/* Toggle Map Button */}
              <button 
                onClick={() => setShowPanel(!showPanel)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                title={showPanel ? "Hide map" : "Show map"}
              >
                <Map className="h-4 w-4" />
                {showPanel ? "Hide Map" : "Show Map"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={mainContentRef} className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl px-6 py-8">

          {/* Form Sections */}
          <div className="space-y-12">
            {/* Section 1: Load */}
            <div ref={loadRef} id="load" className="scroll-mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Load
              </h2>
              <div className="space-y-6">
                {/* Load Dimensions */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Load Dimensions</h4>
                    <a href="#" className="text-xs text-blue-600 hover:underline">Acceptable Formats</a>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↔</span> Length
                      </Label>
                      <Input
                        placeholder="30'"
                        value={loadRouteData.loadLength}
                        onChange={(e) => handleLoadRouteChange("loadLength", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↗</span> Width
                      </Label>
                      <Input
                        placeholder="5'6&quot;"
                        value={loadRouteData.loadWidth}
                        onChange={(e) => handleLoadRouteChange("loadWidth", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↕</span> Height
                      </Label>
                      <Input
                        placeholder="10'6&quot;"
                        value={loadRouteData.loadHeight}
                        onChange={(e) => handleLoadRouteChange("loadHeight", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">⚖</span> Weight
                      </Label>
                      <Input
                        placeholder="25000"
                        value={loadRouteData.loadWeight}
                        onChange={(e) => handleLoadRouteChange("loadWeight", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Equipment</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => router.push("/dashboard/equipment")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Truck Selection */}
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 block">Truck</Label>
                      <Select
                        value={loadRouteData.truckId}
                        onValueChange={(value) => handleLoadRouteChange("truckId", value)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select truck" />
                        </SelectTrigger>
                        <SelectContent>
                          {trucksList && trucksList.length > 0 ? (
                            trucksList.map((truck) => (
                              <SelectItem key={truck._id} value={truck._id}>
                                <span className="font-medium">{truck.name}</span>
                                {truck.make && (
                                  <span className="text-gray-500 ml-2">
                                    {truck.make} {truck.model}
                                  </span>
                                )}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-sm text-gray-500 text-center">
                              No trucks found. Add some first.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Trailer Selection */}
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 block">Trailer</Label>
                      <Select
                        value={loadRouteData.trailerId}
                        onValueChange={(value) => handleLoadRouteChange("trailerId", value)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select trailer" />
                        </SelectTrigger>
                        <SelectContent>
                          {trailersList && trailersList.length > 0 ? (
                            trailersList.map((trailer) => (
                              <SelectItem key={trailer._id} value={trailer._id}>
                                <span className="font-medium">{trailer.name}</span>
                                <span className="text-gray-500 ml-2">
                                  {trailer.axles} axles • {trailer.deckHeight}
                                </span>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-sm text-gray-500 text-center">
                              No trailers found. Add some first.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Overall Dimensions */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Overall Dimensions</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↔</span> Length
                      </Label>
                      <Input
                        placeholder="75'"
                        value={loadRouteData.overallLength}
                        onChange={(e) => handleLoadRouteChange("overallLength", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↗</span> Width
                      </Label>
                      <Input
                        placeholder="8'6&quot;"
                        value={loadRouteData.overallWidth}
                        onChange={(e) => handleLoadRouteChange("overallWidth", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">↕</span> Height
                      </Label>
                      <Input
                        placeholder="13'6&quot;"
                        value={loadRouteData.overallHeight}
                        onChange={(e) => handleLoadRouteChange("overallHeight", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <span className="text-gray-400">⚖</span> Weight
                      </Label>
                      <Input
                        placeholder="80000"
                        value={loadRouteData.overallWeight}
                        onChange={(e) => handleLoadRouteChange("overallWeight", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Axle Configuration */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setShowAxleConfig(!showAxleConfig)}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-900 w-full"
                  >
                    <span className="flex-1 text-left">Axle Configuration</span>
                    {showAxleConfig ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure axle weights and distances for permit applications
                  </p>
                  {showAxleConfig && (
                    <div className="mt-6">
                      <CombinedAxleConfigurationEditor
                        powerUnit={powerUnitAxleConfig}
                        drawnUnit={drawnUnitAxleConfig}
                        kingpinToFirstAxle={kingpinToFirstAxle}
                        onPowerUnitChange={setPowerUnitAxleConfig}
                        onDrawnUnitChange={setDrawnUnitAxleConfig}
                        onKingpinDistanceChange={setKingpinToFirstAxle}
                        showDrawnUnit={!!loadRouteData.trailerId}
                        maxAxlesPerUnit={10}
                      />
                    </div>
                  )}
                </div>

                {/* Calculate Costs & Cost Breakdown */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  >
                    {showCostBreakdown ? "Hide Cost Breakdown" : "Calculate Costs"}
                  </Button>

                  {/* Cost Breakdown Table */}
                  {showCostBreakdown && (
                    <div className="mt-4">
                      <CostBreakdownTable
                        costs={MOCK_COST_DATA}
                        margin={0}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Route */}
            <div ref={routeRef} id="route" className="scroll-mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Route
              </h2>
              <div className="space-y-6">
                {/* Route Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Route</h4>
                  {/* Origin & Destination */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Origin
                      </Label>
                      <AddressAutocomplete
                        placeholder="Houston or 77001"
                        value={loadRouteData.origin}
                        onChange={(value) => handleLoadRouteChange("origin", value)}
                        onSelect={handleOriginSelect}
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Destination
                      </Label>
                      <AddressAutocomplete
                        placeholder="Chicago or 60007"
                        value={loadRouteData.destination}
                        onChange={(value) => handleLoadRouteChange("destination", value)}
                        onSelect={handleDestinationSelect}
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Route Type Toggle */}
                  <RadioGroup
                    value={routeType}
                    onValueChange={(value) => setRouteType(value as "interstate" | "non-interstate")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="interstate" id="interstate" />
                      <Label htmlFor="interstate" className="text-sm font-medium cursor-pointer">Interstate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-interstate" id="non-interstate" />
                      <Label htmlFor="non-interstate" className="text-sm font-medium cursor-pointer">Non-Interstate</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Section 3: Basic Info */}
            <div ref={basicInfoRef} id="basic-info" className="scroll-mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Basic Info
              </h2>
              <div className="space-y-6">
                {/* Bid Details */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Bid Details</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="bidTitle" className="text-sm font-medium text-gray-700 mb-2 block">
                        Bid Title / Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bidTitle"
                        placeholder="e.g., Wind Turbine Transport Bid"
                        value={formData.bidTitle}
                        onChange={(e) => handleInputChange("bidTitle", e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bidId" className="text-sm font-medium text-gray-700 mb-2 block">
                        Bid ID
                      </Label>
                      <div className="relative">
                        <Input
                          id="bidId"
                          value={formData.bidId}
                          onChange={(e) => handleInputChange("bidId", e.target.value)}
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bidDescription" className="text-sm font-medium text-gray-700 mb-2 block">
                        Bid Description
                      </Label>
                      <Textarea
                        id="bidDescription"
                        placeholder="Provide a high-level overview, special instructions, or key details."
                        value={formData.bidDescription}
                        onChange={(e) => handleInputChange("bidDescription", e.target.value)}
                        className="w-full min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="customerName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Customer Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="customerName"
                            placeholder="Search for an existing customer or add a new one"
                            value={formData.customerName}
                            onChange={(e) => handleInputChange("customerName", e.target.value)}
                            className="w-full pl-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contactName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Contact Name
                      </Label>
                      <Input
                        id="contactName"
                        placeholder="e.g., Eleanor Pena"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange("contactName", e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Contact Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        placeholder="e.g., (555) 123-4567"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                        Contact Email
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="e.g., eleanor.pena@constructcorp.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipper Information */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Shipper Information</h3>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sameAsCustomer"
                        checked={sameAsCustomer}
                        onChange={(e) => {
                          setSameAsCustomer(e.target.checked);
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              shipperName: prev.customerName,
                              shipperContactName: prev.contactName,
                              shipperPhone: prev.contactPhone,
                              shipperEmail: prev.contactEmail,
                            }));
                          }
                        }}
                      />
                      <Label htmlFor="sameAsCustomer" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Same as customer
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="shipperName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Shipper Name
                      </Label>
                      <Input
                        id="shipperName"
                        placeholder="Enter shipper name"
                        value={formData.shipperName}
                        onChange={(e) => handleInputChange("shipperName", e.target.value)}
                        disabled={sameAsCustomer}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shipperContactName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Contact Name
                      </Label>
                      <Input
                        id="shipperContactName"
                        placeholder="Enter contact name"
                        value={formData.shipperContactName}
                        onChange={(e) => handleInputChange("shipperContactName", e.target.value)}
                        disabled={sameAsCustomer}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shipperAddress" className="text-sm font-medium text-gray-700 mb-2 block">
                        Address
                      </Label>
                      <Input
                        id="shipperAddress"
                        placeholder="Enter shipper address"
                        value={formData.shipperAddress}
                        onChange={(e) => handleInputChange("shipperAddress", e.target.value)}
                        disabled={sameAsCustomer}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shipperPhone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone
                      </Label>
                      <Input
                        id="shipperPhone"
                        placeholder="Enter phone number"
                        value={formData.shipperPhone}
                        onChange={(e) => handleInputChange("shipperPhone", e.target.value)}
                        disabled={sameAsCustomer}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shipperEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email
                      </Label>
                      <Input
                        id="shipperEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.shipperEmail}
                        onChange={(e) => handleInputChange("shipperEmail", e.target.value)}
                        disabled={sameAsCustomer}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Review */}
            <div ref={reviewRef} id="review" className="scroll-mt-6 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Review
              </h2>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Bid</h3>
                  <p className="text-sm text-gray-500 mb-6">Please review all information before submitting your bid.</p>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Basic Info Summary */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Bid Title</dt>
                          <dd className="text-gray-900 font-medium">{formData.bidTitle || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Bid ID</dt>
                          <dd className="text-gray-900">{formData.bidId}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Customer</dt>
                          <dd className="text-gray-900">{formData.customerName || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Contact</dt>
                          <dd className="text-gray-900">{formData.contactName || "—"}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Route Summary */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Route Details</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Origin</dt>
                          <dd className="text-gray-900 truncate max-w-[200px]">{loadRouteData.origin || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Destination</dt>
                          <dd className="text-gray-900 truncate max-w-[200px]">{loadRouteData.destination || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Route Type</dt>
                          <dd className="text-gray-900 capitalize">{routeType}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Load Dimensions Summary */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Load Dimensions</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Length</dt>
                          <dd className="text-gray-900">{loadRouteData.loadLength || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Width</dt>
                          <dd className="text-gray-900">{loadRouteData.loadWidth || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Height</dt>
                          <dd className="text-gray-900">{loadRouteData.loadHeight || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Weight</dt>
                          <dd className="text-gray-900">{loadRouteData.loadWeight ? `${loadRouteData.loadWeight} lbs` : "—"}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Overall Dimensions Summary */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Overall Dimensions</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Length</dt>
                          <dd className="text-gray-900">{loadRouteData.overallLength || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Width</dt>
                          <dd className="text-gray-900">{loadRouteData.overallWidth || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Height</dt>
                          <dd className="text-gray-900">{loadRouteData.overallHeight || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Weight</dt>
                          <dd className="text-gray-900">{loadRouteData.overallWeight ? `${loadRouteData.overallWeight} lbs` : "—"}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Final Action Buttons */}
                  <div className="mt-8 flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => scrollToSection("basic-info")}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit Bid
                    </Button>
                    <Button
                      onClick={handleSaveDraft}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit Bid
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Sliding Side Panel - Map */}
      <div 
        ref={panelRef}
        style={{ width: panelWidth }}
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 shadow-xl transform z-30 flex flex-col ${
          showPanel ? 'translate-x-0' : 'translate-x-full'
        } ${isResizing ? '' : 'transition-transform duration-300 ease-in-out'}`}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
          }`}
          style={{ marginLeft: -2 }}
        />

        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Route Map</h3>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            title="Close map"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Map Content */}
        <div className="flex-1 relative">
          {/* Map Style Toggle */}
          <div className="absolute top-4 left-4 z-10 flex bg-white rounded-md shadow-sm border border-gray-200">
            <button className="px-3 py-1.5 text-xs font-medium bg-white text-gray-900 rounded-l-md border-r border-gray-200">
              Map
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-r-md">
              Satellite
            </button>
          </div>

          <RouteMap
            waypoints={routeWaypoints}
            onWaypointsChange={(waypoints) => {
              setRouteWaypoints(waypoints);
            }}
            isAddingSegment={false}
            onSegmentAdded={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
