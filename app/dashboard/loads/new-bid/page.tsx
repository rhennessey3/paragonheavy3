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
import { Search, Plus, Pencil, MapPin, Flag, Upload, AlertTriangle, PlusCircle, FolderOpen, ChevronRight, Send, ExternalLink, Bell, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RouteMap } from "@/components/map/RouteMap";
import { RouteSegmentsCard } from "@/components/map/RouteSegmentsCard";
import type { Waypoint } from "@/lib/mapbox";
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
  const [routeSnappedCoordinates, setRouteSnappedCoordinates] = useState<number[][]>([]);
  const [isAddingSegment, setIsAddingSegment] = useState(false);

  interface LoadItem {
    id: number;
    description: string;
    height: string;
    width: string;
    length: string;
    weight: string;
    originAddress: string;
    destinationAddress: string;
    oversized: boolean;
    overweight: boolean;
  }

  const [loads, setLoads] = useState<LoadItem[]>([
    {
      id: 1,
      description: "",
      height: "",
      width: "",
      length: "",
      weight: "",
      originAddress: "",
      destinationAddress: "",
      oversized: false,
      overweight: false,
    },
  ]);

  const addLoad = () => {
    setLoads([
      ...loads,
      {
        id: loads.length + 1,
        description: "",
        height: "",
        width: "",
        length: "",
        weight: "",
        originAddress: "",
        destinationAddress: "",
        oversized: false,
        overweight: false,
      },
    ]);
  };

  const removeLoad = (id: number) => {
    if (loads.length > 1) {
      setLoads(loads.filter((load) => load.id !== id));
    }
  };

  const updateLoad = (id: number, field: keyof LoadItem, value: string | boolean) => {
    setLoads(
      loads.map((load) =>
        load.id === id ? { ...load, [field]: value } : load
      )
    );
  };

  const totalWeight = loads.reduce((sum, load) => sum + (parseFloat(load.weight) || 0), 0);
  const maxDimensions = loads.reduce(
    (max, load) => ({
      height: Math.max(max.height, parseFloat(load.height) || 0),
      width: Math.max(max.width, parseFloat(load.width) || 0),
      length: Math.max(max.length, parseFloat(load.length) || 0),
    }),
    { height: 0, width: 0, length: 0 }
  );
  const hasOversized = loads.some((load) => load.oversized);

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
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const steps = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Load Details" },
    { number: 3, label: "Route & Stops" },
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
        <div className={`mx-auto px-6 py-8 ${currentStep === 3 ? 'max-w-full' : 'max-w-4xl'}`}>

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

            {/* Step 2: Load Details */}
            {currentStep === 2 && (
              <div className="flex gap-6">
                {/* Load Information */}
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Load Information</h3>
                    
                    <div className="space-y-6">
                      {loads.map((load, index) => (
                        <div
                          key={load.id}
                          className="bg-white rounded-lg p-6 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-semibold text-gray-900">
                              Load {index + 1}
                            </h4>
                            {loads.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLoad(load.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Load Description
                              </Label>
                              <Input
                                placeholder="Caterpillar 395 Excavator"
                                value={load.description}
                                onChange={(e) => updateLoad(load.id, "description", e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Height (ft)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="13.5"
                                  value={load.height}
                                  onChange={(e) => updateLoad(load.id, "height", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Width (ft)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="12"
                                  value={load.width}
                                  onChange={(e) => updateLoad(load.id, "width", e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Length (ft)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="55"
                                  value={load.length}
                                  onChange={(e) => updateLoad(load.id, "length", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Weight (lbs)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="207,000"
                                  value={load.weight}
                                  onChange={(e) => updateLoad(load.id, "weight", e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Origin Address
                              </Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="8201 W Plank Rd, Peoria, IL 61604"
                                  value={load.originAddress}
                                  onChange={(e) => updateLoad(load.id, "originAddress", e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Destination Address
                              </Label>
                              <div className="relative">
                                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="123 Main St, Houston, TX 77002"
                                  value={load.destinationAddress}
                                  onChange={(e) => updateLoad(load.id, "destinationAddress", e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Initial Load Photos
                              </Label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, or GIF (max. 10MB)</p>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">Oversized</div>
                                  <div className="text-sm text-gray-500">Flag if dimensions exceed standard limits.</div>
                                </div>
                                <Switch
                                  checked={load.oversized}
                                  onCheckedChange={(checked) => updateLoad(load.id, "oversized", checked)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">Overweight</div>
                                  <div className="text-sm text-gray-500">Flag if weight exceeds standard limits.</div>
                                </div>
                                <Switch
                                  checked={load.overweight}
                                  onCheckedChange={(checked) => updateLoad(load.id, "overweight", checked)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        onClick={addLoad}
                        className="w-full border-gray-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Load
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bid Summary Sidebar */}
                <div className="w-80">
                  <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Summary</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Number of Loads</span>
                        <span className="font-semibold text-gray-900">{loads.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Combined Weight</span>
                        <span className="font-semibold text-gray-900">
                          {totalWeight > 0 ? `${totalWeight.toLocaleString()} lbs` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maximum Dimensions</span>
                        <span className="font-semibold text-gray-900">
                          {maxDimensions.height > 0 || maxDimensions.width > 0 || maxDimensions.length > 0
                            ? `${maxDimensions.height}' x ${maxDimensions.width}' x ${maxDimensions.length}'`
                            : "-"}
                        </span>
                      </div>

                      {hasOversized && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">
                              Oversized load requires special permits.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Route & Stops */}
            {currentStep === 3 && (
              <div className="relative flex flex-col" style={{ height: 'calc(100vh - 320px)' }}>
                {/* Map Container */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex-1 flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Planning</h3>
                  <div className="flex-1 w-full rounded-lg overflow-hidden relative">
                    <RouteMap
                      waypoints={routeWaypoints}
                      onWaypointsChange={(waypoints, snappedCoords) => {
                        setRouteWaypoints(waypoints);
                        if (snappedCoords) {
                          setRouteSnappedCoordinates(snappedCoords);
                        }
                      }}
                      isAddingSegment={isAddingSegment}
                      onSegmentAdded={() => {
                        setIsAddingSegment(false);
                      }}
                    />
                    
                    {/* Route Segments Card Overlay */}
                    <div className="absolute top-4 left-4 z-10 w-96 max-w-[calc(100%-2rem)]">
                      <RouteSegmentsCard
                        waypoints={routeWaypoints}
                        createdAt={new Date()}
                        lastEdited={new Date()}
                        isAddingSegment={isAddingSegment}
                        onAddSegment={() => {
                          setIsAddingSegment(true);
                        }}
                        onDoneAdding={() => {
                          setIsAddingSegment(false);
                        }}
                        onRemoveWaypoint={(index) => {
                          const updated = routeWaypoints.filter((_, i) => i !== index);
                          const reordered = updated.map((wp, i) => ({
                            ...wp,
                            order: i + 1,
                          }));
                          setRouteWaypoints(reordered);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
