"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, MapPin, FolderOpen, ChevronRight, Send, ExternalLink, Bell, Settings2, ChevronDown, Maximize2 } from "lucide-react";
import { RouteMap } from "@/components/map/RouteMap";
import type { Waypoint } from "@/lib/mapbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

  const displayRole = formatRole(userProfile?.role);
  const orgName = organization?.name || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [sameAsCustomer, setSameAsCustomer] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState<Waypoint[]>([]);
  const [routeType, setRouteType] = useState<"interstate" | "non-interstate">("interstate");
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Load & Route form state
  const [loadRouteData, setLoadRouteData] = useState({
    origin: "",
    destination: "",
    loadLength: "",
    loadWidth: "",
    loadHeight: "",
    loadWeight: "",
    equipment: "",
    overallLength: "",
    overallWidth: "",
    overallHeight: "",
    overallWeight: "",
  });

  const handleLoadRouteChange = (field: string, value: string) => {
    setLoadRouteData(prev => ({ ...prev, [field]: value }));
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
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const steps = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Load & Route" },
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
          <div className="flex gap-0">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentStep === step.number
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className={`mx-auto px-6 py-8 ${currentStep === 2 ? 'max-w-full' : 'max-w-4xl'}`}>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
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
              </>
            )}

            {/* Step 2: Load & Route - Combined View */}
            {currentStep === 2 && (
              <div className="flex gap-6 h-[calc(100vh-280px)]">
                {/* Left: Map */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
                  {/* Map Toggle */}
                  <div className="absolute top-4 left-4 z-10 flex bg-white rounded-md shadow-sm border border-gray-200">
                    <button className="px-4 py-2 text-sm font-medium bg-white text-gray-900 rounded-l-md border-r border-gray-200">
                      Map
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-r-md">
                      Satellite
                    </button>
                  </div>
                  
                  {/* Fullscreen Button */}
                  <button className="absolute top-4 right-4 z-10 p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50">
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  </button>

                  <RouteMap
                    waypoints={routeWaypoints}
                    onWaypointsChange={(waypoints) => {
                      setRouteWaypoints(waypoints);
                    }}
                    isAddingSegment={false}
                    onSegmentAdded={() => {}}
                  />
                </div>

                {/* Right: Form Panel */}
                <div className="w-[400px] flex-shrink-0 space-y-6 overflow-y-auto">
                  {/* Origin & Destination */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Origin
                      </Label>
                      <Input
                        placeholder="Houston or 77001"
                        value={loadRouteData.origin}
                        onChange={(e) => handleLoadRouteChange("origin", e.target.value)}
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Destination
                      </Label>
                      <Input
                        placeholder="Chicago or 60007"
                        value={loadRouteData.destination}
                        onChange={(e) => handleLoadRouteChange("destination", e.target.value)}
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

                  {/* Load Dimensions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Load Dimensions</h4>
                      <a href="#" className="text-xs text-blue-600 hover:underline">Acceptable Formats</a>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↔</span> Length
                        </Label>
                        <Input
                          placeholder="30'"
                          value={loadRouteData.loadLength}
                          onChange={(e) => handleLoadRouteChange("loadLength", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↗</span> Width
                        </Label>
                        <Input
                          placeholder="5'6&quot;"
                          value={loadRouteData.loadWidth}
                          onChange={(e) => handleLoadRouteChange("loadWidth", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↕</span> Height
                        </Label>
                        <Input
                          placeholder="10'6&quot;"
                          value={loadRouteData.loadHeight}
                          onChange={(e) => handleLoadRouteChange("loadHeight", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">⚖</span> Weight
                        </Label>
                        <Input
                          placeholder="25000"
                          value={loadRouteData.loadWeight}
                          onChange={(e) => handleLoadRouteChange("loadWeight", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Equipment</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Click here to add tractor and trailer"
                        value={loadRouteData.equipment}
                        onChange={(e) => handleLoadRouteChange("equipment", e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        New
                      </Button>
                    </div>
                  </div>

                  {/* Overall Dimensions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Overall Dimensions</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↔</span> Length
                        </Label>
                        <Input
                          placeholder="75'"
                          value={loadRouteData.overallLength}
                          onChange={(e) => handleLoadRouteChange("overallLength", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↗</span> Width
                        </Label>
                        <Input
                          placeholder="8'6&quot;"
                          value={loadRouteData.overallWidth}
                          onChange={(e) => handleLoadRouteChange("overallWidth", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">↕</span> Height
                        </Label>
                        <Input
                          placeholder="13'6&quot;"
                          value={loadRouteData.overallHeight}
                          onChange={(e) => handleLoadRouteChange("overallHeight", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="text-gray-400">⚖</span> Weight
                        </Label>
                        <Input
                          placeholder="80000"
                          value={loadRouteData.overallWeight}
                          onChange={(e) => handleLoadRouteChange("overallWeight", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extra Fields */}
                  <div>
                    <button
                      onClick={() => setShowExtraFields(!showExtraFields)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Extra Fields
                      <ChevronDown className={`h-4 w-4 transition-transform ${showExtraFields ? 'rotate-180' : ''}`} />
                    </button>
                    {showExtraFields && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Additional fields coming soon...</p>
                      </div>
                    )}
                  </div>

                  {/* Calculate Costs Button */}
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Calculate Costs
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
