"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Truck, Container, ChevronDown, ChevronUp } from "lucide-react";
import {
  AxleConfigurationEditor,
  createEmptyAxleConfiguration,
  type AxleConfiguration,
  type AxleWeight,
  type AxleDistance,
} from "@/components/ui/axle-configuration-editor";

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
];

// Truck form data
interface TruckFormData {
  name: string;
  make: string;
  model: string;
  axles: string;
  emptyWeight: string;
  usDotNumber: string;
  plateNumber: string;
  vinNumber: string;
  registrationState: string;
  axleConfig: AxleConfiguration;
}

const initialTruckForm: TruckFormData = {
  name: "",
  make: "",
  model: "",
  axles: "2",
  emptyWeight: "",
  usDotNumber: "",
  plateNumber: "",
  vinNumber: "",
  registrationState: "",
  axleConfig: createEmptyAxleConfiguration(2),
};

// Trailer form data
interface TrailerFormData {
  name: string;
  axles: string;
  deckHeight: string;
  emptyWeight: string;
  plateNumber: string;
  vinNumber: string;
  registrationState: string;
  axleConfig: AxleConfiguration;
}

const initialTrailerForm: TrailerFormData = {
  name: "",
  axles: "2",
  deckHeight: "",
  emptyWeight: "",
  plateNumber: "",
  vinNumber: "",
  registrationState: "",
  axleConfig: createEmptyAxleConfiguration(2),
};

export default function EquipmentPage() {
  const { user } = useUser();
  const userId = user?.id;
  const { toast } = useToast();

  // Active tab
  const [activeTab, setActiveTab] = useState<"trucks" | "trailers">("trucks");

  // Truck state
  const [isTruckAddOpen, setIsTruckAddOpen] = useState(false);
  const [isTruckEditOpen, setIsTruckEditOpen] = useState(false);
  const [isTruckDeleteOpen, setIsTruckDeleteOpen] = useState(false);
  const [truckForm, setTruckForm] = useState<TruckFormData>(initialTruckForm);
  const [editingTruckId, setEditingTruckId] = useState<Id<"trucks"> | null>(null);
  const [deletingTruck, setDeletingTruck] = useState<{ id: Id<"trucks">; name: string } | null>(null);

  // Trailer state
  const [isTrailerAddOpen, setIsTrailerAddOpen] = useState(false);
  const [isTrailerEditOpen, setIsTrailerEditOpen] = useState(false);
  const [isTrailerDeleteOpen, setIsTrailerDeleteOpen] = useState(false);
  const [trailerForm, setTrailerForm] = useState<TrailerFormData>(initialTrailerForm);
  const [editingTrailerId, setEditingTrailerId] = useState<Id<"trailers"> | null>(null);
  const [deletingTrailer, setDeletingTrailer] = useState<{ id: Id<"trailers">; name: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Axle config expansion state
  const [showTruckAxleConfig, setShowTruckAxleConfig] = useState(false);
  const [showTrailerAxleConfig, setShowTrailerAxleConfig] = useState(false);

  // Queries
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const trucks = useQuery(
    api.trucks.getTrucks,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const trailers = useQuery(
    api.trailers.getTrailers,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const defaultTruckCount = useQuery(
    api.trucks.getDefaultTruckCount,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const defaultTrailerCount = useQuery(
    api.trailers.getDefaultTrailerCount,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Truck mutations
  const createTruck = useMutation(api.trucks.createTruck);
  const updateTruck = useMutation(api.trucks.updateTruck);
  const deleteTruck = useMutation(api.trucks.deleteTruck);
  const seedDefaultTrucks = useMutation(api.trucks.seedDefaultTrucks);
  const removeDefaultTrucks = useMutation(api.trucks.removeDefaultTrucks);

  // Trailer mutations
  const createTrailer = useMutation(api.trailers.createTrailer);
  const updateTrailer = useMutation(api.trailers.updateTrailer);
  const deleteTrailer = useMutation(api.trailers.deleteTrailer);
  const seedDefaultTrailers = useMutation(api.trailers.seedDefaultTrailers);
  const removeDefaultTrailers = useMutation(api.trailers.removeDefaultTrailers);

  // Loading state
  if (!userProfile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading equipment...</p>
        </div>
      </div>
    );
  }

  const formatWeight = (weight: number) => weight.toLocaleString() + " lbs";

  // ============ TRUCK HANDLERS ============
  const handleTruckInputChange = (field: keyof TruckFormData, value: string) => {
    setTruckForm((prev) => {
      const updated = { ...prev, [field]: value };
      
      // When axle count changes, update the axle configuration
      if (field === "axles") {
        const axleCount = parseInt(value) || 2;
        if (axleCount !== prev.axleConfig.axleCount && axleCount >= 1 && axleCount <= 15) {
          updated.axleConfig = createEmptyAxleConfiguration(axleCount);
        }
      }
      
      return updated;
    });
  };
  
  const handleTruckAxleConfigChange = (config: AxleConfiguration) => {
    setTruckForm((prev) => ({
      ...prev,
      axleConfig: config,
      axles: config.axleCount.toString(),
    }));
  };

  const resetTruckForm = () => {
    setTruckForm(initialTruckForm);
    setEditingTruckId(null);
    setShowTruckAxleConfig(false);
  };

  const handleAddTruck = async () => {
    if (!userProfile?.orgId) return;

    const axles = parseInt(truckForm.axles);
    const weight = parseInt(truckForm.emptyWeight.replace(/,/g, ""));

    if (!truckForm.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (isNaN(axles) || axles < 1) {
      toast({ title: "Error", description: "Valid axle count is required", variant: "destructive" });
      return;
    }
    if (isNaN(weight) || weight < 1) {
      toast({ title: "Error", description: "Valid weight is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTruck({
        orgId: userProfile.orgId,
        name: truckForm.name.trim(),
        make: truckForm.make.trim() || undefined,
        model: truckForm.model.trim() || undefined,
        axles,
        emptyWeight: weight,
        usDotNumber: truckForm.usDotNumber.trim() || undefined,
        plateNumber: truckForm.plateNumber.trim() || undefined,
        vinNumber: truckForm.vinNumber.trim() || undefined,
        registrationState: truckForm.registrationState || undefined,
        axleWeights: truckForm.axleConfig.axleWeights,
        axleDistances: truckForm.axleConfig.axleDistances,
      });

      toast({ title: "Success", description: "Truck added successfully" });
      setIsTruckAddOpen(false);
      resetTruckForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add truck", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTruck = (truck: NonNullable<typeof trucks>[number]) => {
    // Build axle configuration from truck data or create empty one
    const axleConfig: AxleConfiguration = {
      axleCount: truck.axles,
      axleWeights: truck.axleWeights || createEmptyAxleConfiguration(truck.axles).axleWeights,
      axleDistances: truck.axleDistances || createEmptyAxleConfiguration(truck.axles).axleDistances,
    };
    
    setTruckForm({
      name: truck.name,
      make: truck.make || "",
      model: truck.model || "",
      axles: truck.axles.toString(),
      emptyWeight: truck.emptyWeight.toString(),
      usDotNumber: truck.usDotNumber || "",
      plateNumber: truck.plateNumber || "",
      vinNumber: truck.vinNumber || "",
      registrationState: truck.registrationState || "",
      axleConfig,
    });
    setEditingTruckId(truck._id);
    setShowTruckAxleConfig(!!truck.axleWeights?.length || !!truck.axleDistances?.length);
    setIsTruckEditOpen(true);
  };

  const handleUpdateTruck = async () => {
    if (!editingTruckId) return;

    const axles = parseInt(truckForm.axles);
    const weight = parseInt(truckForm.emptyWeight.replace(/,/g, ""));

    if (!truckForm.name.trim() || isNaN(axles) || isNaN(weight)) {
      toast({ title: "Error", description: "Name, axles, and weight are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTruck({
        truckId: editingTruckId,
        name: truckForm.name.trim(),
        make: truckForm.make.trim() || undefined,
        model: truckForm.model.trim() || undefined,
        axles,
        emptyWeight: weight,
        usDotNumber: truckForm.usDotNumber.trim() || undefined,
        plateNumber: truckForm.plateNumber.trim() || undefined,
        vinNumber: truckForm.vinNumber.trim() || undefined,
        registrationState: truckForm.registrationState || undefined,
        axleWeights: truckForm.axleConfig.axleWeights,
        axleDistances: truckForm.axleConfig.axleDistances,
      });

      toast({ title: "Success", description: "Truck updated successfully" });
      setIsTruckEditOpen(false);
      resetTruckForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update truck", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTruck = async () => {
    if (!deletingTruck) return;

    setIsSubmitting(true);
    try {
      await deleteTruck({ truckId: deletingTruck.id });
      toast({ title: "Success", description: "Truck deleted successfully" });
      setIsTruckDeleteOpen(false);
      setDeletingTruck(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete truck", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedTrucks = async () => {
    if (!userProfile?.orgId) return;
    setIsSubmitting(true);
    try {
      const result = await seedDefaultTrucks({ orgId: userProfile.orgId });
      toast({ title: "Success", description: `Added ${result.created} default trucks` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to seed trucks", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDefaultTrucks = async () => {
    if (!userProfile?.orgId) return;
    setIsSubmitting(true);
    try {
      const result = await removeDefaultTrucks({ orgId: userProfile.orgId });
      toast({ title: "Success", description: `Removed ${result.removed} default trucks` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove trucks", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ TRAILER HANDLERS ============
  const handleTrailerInputChange = (field: keyof TrailerFormData, value: string) => {
    setTrailerForm((prev) => {
      const updated = { ...prev, [field]: value };
      
      // When axle count changes, update the axle configuration
      if (field === "axles") {
        const axleCount = parseInt(value) || 2;
        if (axleCount !== prev.axleConfig.axleCount && axleCount >= 1 && axleCount <= 15) {
          updated.axleConfig = createEmptyAxleConfiguration(axleCount);
        }
      }
      
      return updated;
    });
  };
  
  const handleTrailerAxleConfigChange = (config: AxleConfiguration) => {
    setTrailerForm((prev) => ({
      ...prev,
      axleConfig: config,
      axles: config.axleCount.toString(),
    }));
  };

  const resetTrailerForm = () => {
    setTrailerForm(initialTrailerForm);
    setEditingTrailerId(null);
    setShowTrailerAxleConfig(false);
  };

  const handleAddTrailer = async () => {
    if (!userProfile?.orgId) return;

    const axles = parseInt(trailerForm.axles);
    const weight = parseInt(trailerForm.emptyWeight.replace(/,/g, ""));

    if (!trailerForm.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (isNaN(axles) || axles < 1) {
      toast({ title: "Error", description: "Valid axle count is required", variant: "destructive" });
      return;
    }
    if (!trailerForm.deckHeight.trim()) {
      toast({ title: "Error", description: "Deck height is required", variant: "destructive" });
      return;
    }
    if (isNaN(weight) || weight < 1) {
      toast({ title: "Error", description: "Valid weight is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrailer({
        orgId: userProfile.orgId,
        name: trailerForm.name.trim(),
        axles,
        deckHeight: trailerForm.deckHeight.trim(),
        emptyWeight: weight,
        plateNumber: trailerForm.plateNumber.trim() || undefined,
        vinNumber: trailerForm.vinNumber.trim() || undefined,
        registrationState: trailerForm.registrationState || undefined,
        axleWeights: trailerForm.axleConfig.axleWeights,
        axleDistances: trailerForm.axleConfig.axleDistances,
      });

      toast({ title: "Success", description: "Trailer added successfully" });
      setIsTrailerAddOpen(false);
      resetTrailerForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add trailer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTrailer = (trailer: NonNullable<typeof trailers>[number]) => {
    // Build axle configuration from trailer data or create empty one
    const axleConfig: AxleConfiguration = {
      axleCount: trailer.axles,
      axleWeights: trailer.axleWeights || createEmptyAxleConfiguration(trailer.axles).axleWeights,
      axleDistances: trailer.axleDistances || createEmptyAxleConfiguration(trailer.axles).axleDistances,
    };
    
    setTrailerForm({
      name: trailer.name,
      axles: trailer.axles.toString(),
      deckHeight: trailer.deckHeight,
      emptyWeight: trailer.emptyWeight.toString(),
      plateNumber: trailer.plateNumber || "",
      vinNumber: trailer.vinNumber || "",
      registrationState: trailer.registrationState || "",
      axleConfig,
    });
    setEditingTrailerId(trailer._id);
    setShowTrailerAxleConfig(!!trailer.axleWeights?.length || !!trailer.axleDistances?.length);
    setIsTrailerEditOpen(true);
  };

  const handleUpdateTrailer = async () => {
    if (!editingTrailerId) return;

    const axles = parseInt(trailerForm.axles);
    const weight = parseInt(trailerForm.emptyWeight.replace(/,/g, ""));

    if (!trailerForm.name.trim() || isNaN(axles) || !trailerForm.deckHeight.trim() || isNaN(weight)) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTrailer({
        trailerId: editingTrailerId,
        name: trailerForm.name.trim(),
        axles,
        deckHeight: trailerForm.deckHeight.trim(),
        emptyWeight: weight,
        plateNumber: trailerForm.plateNumber.trim() || undefined,
        vinNumber: trailerForm.vinNumber.trim() || undefined,
        registrationState: trailerForm.registrationState || undefined,
        axleWeights: trailerForm.axleConfig.axleWeights,
        axleDistances: trailerForm.axleConfig.axleDistances,
      });

      toast({ title: "Success", description: "Trailer updated successfully" });
      setIsTrailerEditOpen(false);
      resetTrailerForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update trailer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrailer = async () => {
    if (!deletingTrailer) return;

    setIsSubmitting(true);
    try {
      await deleteTrailer({ trailerId: deletingTrailer.id });
      toast({ title: "Success", description: "Trailer deleted successfully" });
      setIsTrailerDeleteOpen(false);
      setDeletingTrailer(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete trailer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedTrailers = async () => {
    if (!userProfile?.orgId) return;
    setIsSubmitting(true);
    try {
      const result = await seedDefaultTrailers({ orgId: userProfile.orgId });
      toast({ title: "Success", description: `Added ${result.created} default trailers` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to seed trailers", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDefaultTrailers = async () => {
    if (!userProfile?.orgId) return;
    setIsSubmitting(true);
    try {
      const result = await removeDefaultTrailers({ orgId: userProfile.orgId });
      toast({ title: "Success", description: `Removed ${result.removed} default trailers` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove trailers", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasTruckDefaults = (defaultTruckCount ?? 0) > 0;
  const hasTrailerDefaults = (defaultTrailerCount ?? 0) > 0;
  const trucksEmpty = !trucks || trucks.length === 0;
  const trailersEmpty = !trailers || trailers.length === 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your trucks and trailers</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "trucks" | "trailers")}>
        <TabsList className="mb-6">
          <TabsTrigger value="trucks" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Trucks ({trucks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="trailers" className="flex items-center gap-2">
            <Container className="h-4 w-4" />
            Trailers ({trailers?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TRUCKS TAB */}
        <TabsContent value="trucks">
          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex gap-3">
              {hasTruckDefaults && (
                <Button variant="outline" onClick={handleRemoveDefaultTrucks} disabled={isSubmitting}>
                  Remove default trucks
                </Button>
              )}
              {trucksEmpty && (
                <Button variant="outline" onClick={handleSeedTrucks} disabled={isSubmitting}>
                  Add default trucks
                </Button>
              )}
              <Button onClick={() => setIsTruckAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Truck
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Make/Model</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">US DOT #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Plate/VIN</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">State</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Axles</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Empty Weight</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trucks?.map((truck) => (
                  <tr key={truck._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button onClick={() => handleEditTruck(truck)} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        {truck.name}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-900">
                      {truck.make && truck.model ? `${truck.make} ${truck.model}` : truck.make || truck.model || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-900 font-mono text-sm">{truck.usDotNumber || "-"}</td>
                    <td className="px-4 py-4 text-gray-900">
                      <div className="text-sm">
                        {truck.plateNumber && <div className="font-mono">{truck.plateNumber}</div>}
                        {truck.vinNumber && <div className="text-gray-500 text-xs font-mono">{truck.vinNumber}</div>}
                        {!truck.plateNumber && !truck.vinNumber && "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{truck.registrationState || "-"}</td>
                    <td className="px-4 py-4 text-gray-900">{truck.axles}</td>
                    <td className="px-4 py-4 text-gray-900">{formatWeight(truck.emptyWeight)}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleEditTruck(truck)} className="text-blue-600 hover:text-blue-800 hover:underline mr-4">Edit</button>
                      <button onClick={() => { setDeletingTruck({ id: truck._id, name: truck.name }); setIsTruckDeleteOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {trucksEmpty && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No trucks found. Add your first one or load the defaults.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TRAILERS TAB */}
        <TabsContent value="trailers">
          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex gap-3">
              {hasTrailerDefaults && (
                <Button variant="outline" onClick={handleRemoveDefaultTrailers} disabled={isSubmitting}>
                  Remove default trailers
                </Button>
              )}
              {trailersEmpty && (
                <Button variant="outline" onClick={handleSeedTrailers} disabled={isSubmitting}>
                  Add default trailers
                </Button>
              )}
              <Button onClick={() => setIsTrailerAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Trailer
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Plate/VIN</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">State</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Axles</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Deck Height</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Empty Weight</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trailers?.map((trailer) => (
                  <tr key={trailer._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button onClick={() => handleEditTrailer(trailer)} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        {trailer.name}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-900">
                      <div className="text-sm">
                        {trailer.plateNumber && <div className="font-mono">{trailer.plateNumber}</div>}
                        {trailer.vinNumber && <div className="text-gray-500 text-xs font-mono">{trailer.vinNumber}</div>}
                        {!trailer.plateNumber && !trailer.vinNumber && "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{trailer.registrationState || "-"}</td>
                    <td className="px-4 py-4 text-gray-900">{trailer.axles}</td>
                    <td className="px-4 py-4 text-gray-900">{trailer.deckHeight}</td>
                    <td className="px-4 py-4 text-gray-900">{formatWeight(trailer.emptyWeight)}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleEditTrailer(trailer)} className="text-blue-600 hover:text-blue-800 hover:underline mr-4">Edit</button>
                      <button onClick={() => { setDeletingTrailer({ id: trailer._id, name: trailer.name }); setIsTrailerDeleteOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {trailersEmpty && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No trailers found. Add your first one or load the defaults.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* TRUCK DIALOGS */}
      <Dialog open={isTruckAddOpen} onOpenChange={setIsTruckAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Truck</DialogTitle>
            <DialogDescription>Enter the details for the new truck.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="truck-name">Name *</Label>
              <Input id="truck-name" placeholder="e.g., Day Cab, Sleeper" value={truckForm.name} onChange={(e) => handleTruckInputChange("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="truck-make">Make</Label>
                <Input id="truck-make" placeholder="e.g., Peterbilt" value={truckForm.make} onChange={(e) => handleTruckInputChange("make", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="truck-model">Model</Label>
                <Input id="truck-model" placeholder="e.g., 389" value={truckForm.model} onChange={(e) => handleTruckInputChange("model", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="truck-axles">Axles *</Label>
                <Input id="truck-axles" type="number" min="1" max="15" placeholder="e.g., 3" value={truckForm.axles} onChange={(e) => handleTruckInputChange("axles", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="truck-weight">Empty Weight (lbs) *</Label>
                <Input id="truck-weight" type="number" min="1" placeholder="e.g., 20000" value={truckForm.emptyWeight} onChange={(e) => handleTruckInputChange("emptyWeight", e.target.value)} />
              </div>
            </div>
            
            {/* Vehicle Registration Fields */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vehicle Registration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="truck-usdot">US DOT #</Label>
                  <Input id="truck-usdot" placeholder="e.g., 1234567" value={truckForm.usDotNumber} onChange={(e) => handleTruckInputChange("usDotNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="truck-plate">Plate #</Label>
                  <Input id="truck-plate" placeholder="e.g., ABC1234" value={truckForm.plateNumber} onChange={(e) => handleTruckInputChange("plateNumber", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="truck-vin">VIN #</Label>
                  <Input id="truck-vin" placeholder="Last 6 digits or full VIN" value={truckForm.vinNumber} onChange={(e) => handleTruckInputChange("vinNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="truck-state">Registration State</Label>
                  <select
                    id="truck-state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={truckForm.registrationState}
                    onChange={(e) => handleTruckInputChange("registrationState", e.target.value)}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.value} - {state.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Axle Configuration Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowTruckAxleConfig(!showTruckAxleConfig)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showTruckAxleConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Axle Configuration (Optional)
              </button>
              {showTruckAxleConfig && (
                <div className="mt-4">
                  <AxleConfigurationEditor
                    value={truckForm.axleConfig}
                    onChange={handleTruckAxleConfigChange}
                    unitType="power"
                    maxAxles={10}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTruckAddOpen(false); resetTruckForm(); }}>Cancel</Button>
            <Button onClick={handleAddTruck} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Adding..." : "Add Truck"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTruckEditOpen} onOpenChange={setIsTruckEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>Update the truck details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-truck-name">Name *</Label>
              <Input id="edit-truck-name" placeholder="e.g., Day Cab, Sleeper" value={truckForm.name} onChange={(e) => handleTruckInputChange("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-truck-make">Make</Label>
                <Input id="edit-truck-make" placeholder="e.g., Peterbilt" value={truckForm.make} onChange={(e) => handleTruckInputChange("make", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-truck-model">Model</Label>
                <Input id="edit-truck-model" placeholder="e.g., 389" value={truckForm.model} onChange={(e) => handleTruckInputChange("model", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-truck-axles">Axles *</Label>
                <Input id="edit-truck-axles" type="number" min="1" max="15" placeholder="e.g., 3" value={truckForm.axles} onChange={(e) => handleTruckInputChange("axles", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-truck-weight">Empty Weight (lbs) *</Label>
                <Input id="edit-truck-weight" type="number" min="1" placeholder="e.g., 20000" value={truckForm.emptyWeight} onChange={(e) => handleTruckInputChange("emptyWeight", e.target.value)} />
              </div>
            </div>
            
            {/* Vehicle Registration Fields */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vehicle Registration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-truck-usdot">US DOT #</Label>
                  <Input id="edit-truck-usdot" placeholder="e.g., 1234567" value={truckForm.usDotNumber} onChange={(e) => handleTruckInputChange("usDotNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-truck-plate">Plate #</Label>
                  <Input id="edit-truck-plate" placeholder="e.g., ABC1234" value={truckForm.plateNumber} onChange={(e) => handleTruckInputChange("plateNumber", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-truck-vin">VIN #</Label>
                  <Input id="edit-truck-vin" placeholder="Last 6 digits or full VIN" value={truckForm.vinNumber} onChange={(e) => handleTruckInputChange("vinNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-truck-state">Registration State</Label>
                  <select
                    id="edit-truck-state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={truckForm.registrationState}
                    onChange={(e) => handleTruckInputChange("registrationState", e.target.value)}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.value} - {state.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Axle Configuration Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowTruckAxleConfig(!showTruckAxleConfig)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showTruckAxleConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Axle Configuration (Optional)
              </button>
              {showTruckAxleConfig && (
                <div className="mt-4">
                  <AxleConfigurationEditor
                    value={truckForm.axleConfig}
                    onChange={handleTruckAxleConfigChange}
                    unitType="power"
                    maxAxles={10}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTruckEditOpen(false); resetTruckForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateTruck} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTruckDeleteOpen} onOpenChange={setIsTruckDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Truck</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deletingTruck?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTruckDeleteOpen(false); setDeletingTruck(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTruck} disabled={isSubmitting}>{isSubmitting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRAILER DIALOGS */}
      <Dialog open={isTrailerAddOpen} onOpenChange={setIsTrailerAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Trailer</DialogTitle>
            <DialogDescription>Enter the details for the new trailer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trailer-name">Name *</Label>
              <Input id="trailer-name" placeholder="e.g., Flatbed, Step Deck" value={trailerForm.name} onChange={(e) => handleTrailerInputChange("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trailer-axles">Axles *</Label>
                <Input id="trailer-axles" type="number" min="1" max="15" placeholder="e.g., 3" value={trailerForm.axles} onChange={(e) => handleTrailerInputChange("axles", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="trailer-deckHeight">Deck Height *</Label>
                <Input id="trailer-deckHeight" placeholder={'e.g., 5\'0"'} value={trailerForm.deckHeight} onChange={(e) => handleTrailerInputChange("deckHeight", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="trailer-weight">Empty Weight (lbs) *</Label>
              <Input id="trailer-weight" type="number" min="1" placeholder="e.g., 15000" value={trailerForm.emptyWeight} onChange={(e) => handleTrailerInputChange("emptyWeight", e.target.value)} />
            </div>
            
            {/* Vehicle Registration Fields */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vehicle Registration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trailer-plate">Plate #</Label>
                  <Input id="trailer-plate" placeholder="e.g., ABC1234" value={trailerForm.plateNumber} onChange={(e) => handleTrailerInputChange("plateNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="trailer-vin">VIN #</Label>
                  <Input id="trailer-vin" placeholder="Last 6 digits or full VIN" value={trailerForm.vinNumber} onChange={(e) => handleTrailerInputChange("vinNumber", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="trailer-state">Registration State</Label>
                  <select
                    id="trailer-state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={trailerForm.registrationState}
                    onChange={(e) => handleTrailerInputChange("registrationState", e.target.value)}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.value} - {state.label}</option>
                    ))}
                  </select>
                </div>
                <div></div>
              </div>
            </div>
            
            {/* Axle Configuration Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowTrailerAxleConfig(!showTrailerAxleConfig)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showTrailerAxleConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Axle Configuration (Optional)
              </button>
              {showTrailerAxleConfig && (
                <div className="mt-4">
                  <AxleConfigurationEditor
                    value={trailerForm.axleConfig}
                    onChange={handleTrailerAxleConfigChange}
                    unitType="drawn"
                    maxAxles={10}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTrailerAddOpen(false); resetTrailerForm(); }}>Cancel</Button>
            <Button onClick={handleAddTrailer} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Adding..." : "Add Trailer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrailerEditOpen} onOpenChange={setIsTrailerEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trailer</DialogTitle>
            <DialogDescription>Update the trailer details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-trailer-name">Name *</Label>
              <Input id="edit-trailer-name" placeholder="e.g., Flatbed, Step Deck" value={trailerForm.name} onChange={(e) => handleTrailerInputChange("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-trailer-axles">Axles *</Label>
                <Input id="edit-trailer-axles" type="number" min="1" max="15" placeholder="e.g., 3" value={trailerForm.axles} onChange={(e) => handleTrailerInputChange("axles", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-trailer-deckHeight">Deck Height *</Label>
                <Input id="edit-trailer-deckHeight" placeholder={'e.g., 5\'0"'} value={trailerForm.deckHeight} onChange={(e) => handleTrailerInputChange("deckHeight", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-trailer-weight">Empty Weight (lbs) *</Label>
              <Input id="edit-trailer-weight" type="number" min="1" placeholder="e.g., 15000" value={trailerForm.emptyWeight} onChange={(e) => handleTrailerInputChange("emptyWeight", e.target.value)} />
            </div>
            
            {/* Vehicle Registration Fields */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vehicle Registration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-trailer-plate">Plate #</Label>
                  <Input id="edit-trailer-plate" placeholder="e.g., ABC1234" value={trailerForm.plateNumber} onChange={(e) => handleTrailerInputChange("plateNumber", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-trailer-vin">VIN #</Label>
                  <Input id="edit-trailer-vin" placeholder="Last 6 digits or full VIN" value={trailerForm.vinNumber} onChange={(e) => handleTrailerInputChange("vinNumber", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-trailer-state">Registration State</Label>
                  <select
                    id="edit-trailer-state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={trailerForm.registrationState}
                    onChange={(e) => handleTrailerInputChange("registrationState", e.target.value)}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.value} - {state.label}</option>
                    ))}
                  </select>
                </div>
                <div></div>
              </div>
            </div>
            
            {/* Axle Configuration Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowTrailerAxleConfig(!showTrailerAxleConfig)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showTrailerAxleConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Axle Configuration (Optional)
              </button>
              {showTrailerAxleConfig && (
                <div className="mt-4">
                  <AxleConfigurationEditor
                    value={trailerForm.axleConfig}
                    onChange={handleTrailerAxleConfigChange}
                    unitType="drawn"
                    maxAxles={10}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTrailerEditOpen(false); resetTrailerForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateTrailer} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrailerDeleteOpen} onOpenChange={setIsTrailerDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Trailer</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deletingTrailer?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTrailerDeleteOpen(false); setDeletingTrailer(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTrailer} disabled={isSubmitting}>{isSubmitting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






