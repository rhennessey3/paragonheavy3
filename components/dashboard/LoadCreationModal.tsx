import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

interface LoadCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgType: "shipper" | "carrier" | "escort";
  editingLoadId?: Id<"loads"> | null;
}

export function LoadCreationModal({ isOpen, onClose, orgType, editingLoadId }: LoadCreationModalProps) {
  const { userId } = useAuth();
  const { user } = useUser();

  const createLoad = useMutation(api.loads.createLoad);
  const updateLoad = useMutation(api.loads.updateLoad);

  // Get user profile first to find their organization
  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  // Then get the organization using the internal ID
  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Fetch load data if editing
  const editingLoadData = useQuery(api.loads.getLoad,
    editingLoadId ? { loadId: editingLoadId } : "skip"
  );

  const [formData, setFormData] = useState({
    loadNumber: `${orgType?.toUpperCase()}-${Date.now()}`,
    origin: {
      address: "",
      city: "",
      state: "",
      zip: "",
    },
    destination: {
      address: "",
      city: "",
      state: "",
      zip: "",
    },
    dimensions: {
      height: 0,
      width: 0,
      length: 0,
      weight: 0,
      description: "",
    },
    pickupDate: "",
    deliveryDate: "",
    specialRequirements: "",
    contactInfo: {
      name: user?.fullName || user?.username || "",
      phone: "",
      email: user?.primaryEmailAddress?.emailAddress || "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingLoadData) {
      setFormData({
        loadNumber: editingLoadData.loadNumber,
        origin: editingLoadData.origin,
        destination: editingLoadData.destination,
        dimensions: {
          ...editingLoadData.dimensions,
          description: editingLoadData.dimensions.description || "",
        },
        pickupDate: editingLoadData.pickupDate ? new Date(editingLoadData.pickupDate).toISOString().split('T')[0] : "",
        deliveryDate: editingLoadData.deliveryDate ? new Date(editingLoadData.deliveryDate).toISOString().split('T')[0] : "",
        specialRequirements: editingLoadData.specialRequirements || "",
        contactInfo: editingLoadData.contactInfo || {
          name: user?.fullName || user?.username || "",
          phone: "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
      });
    }
  }, [editingLoadData, user]);

  const handleAutofill = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    setFormData({
      loadNumber: `${orgType?.toUpperCase()}-${Date.now()}`,
      origin: {
        address: "123 Industrial Parkway",
        city: "Houston",
        state: "TX",
        zip: "77001",
      },
      destination: {
        address: "456 Warehouse Drive",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      },
      dimensions: {
        height: 13.5,
        width: 8.5,
        length: 53,
        weight: 45000,
        description: "Heavy machinery on flatbed trailer",
      },
      pickupDate: today.toISOString().split('T')[0],
      deliveryDate: nextWeek.toISOString().split('T')[0],
      specialRequirements: "Requires police escort in California. Oversize load permit needed.",
      contactInfo: {
        name: user?.fullName || user?.username || "John Doe",
        phone: "(555) 123-4567",
        email: user?.primaryEmailAddress?.emailAddress || "contact@example.com",
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !userProfile?.orgId || !organization) {
      console.error("Missing required data:", { userId, orgId: userProfile?.orgId, organization });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLoadId) {
        // Update existing load
        await updateLoad({
          loadId: editingLoadId,
          ...formData,
          pickupDate: formData.pickupDate ? new Date(formData.pickupDate).getTime() : undefined,
          deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).getTime() : undefined,
        });
      } else {
        // Create new load
        await createLoad({
          ...formData,
          orgId: organization._id,
          pickupDate: formData.pickupDate ? new Date(formData.pickupDate).getTime() : undefined,
          deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).getTime() : undefined,
        });
      }

      // Reset form
      setFormData({
        loadNumber: `${orgType?.toUpperCase()}-${Date.now()}`,
        origin: { address: "", city: "", state: "", zip: "" },
        destination: { address: "", city: "", state: "", zip: "" },
        dimensions: { height: 0, width: 0, length: 0, weight: 0, description: "" },
        pickupDate: "",
        deliveryDate: "",
        specialRequirements: "",
        contactInfo: {
          name: user?.fullName || user?.username || "",
          phone: "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      onClose();
    } catch (error) {
      console.error("Failed to save load:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: section === "dimensions" || section === "contactInfo"
        ? { ...prev[section as keyof typeof prev], [field]: value }
        : { ...prev, [field]: value }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editingLoadId ? "Edit" : "Create New"} Load - {orgType?.charAt(0).toUpperCase() + orgType?.slice(1)}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutofill}
              className="text-xs"
            >
              🎲 Autofill (Test)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loadNumber">Load Number</Label>
                <Input
                  id="loadNumber"
                  value={formData.loadNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, loadNumber: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Origin</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="originAddress">Address</Label>
                    <Input
                      id="originAddress"
                      value={formData.origin.address}
                      onChange={(e) => handleInputChange("origin", "address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originCity">City</Label>
                      <Input
                        id="originCity"
                        value={formData.origin.city}
                        onChange={(e) => handleInputChange("origin", "city", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="originState">State</Label>
                      <Input
                        id="originState"
                        value={formData.origin.state}
                        onChange={(e) => handleInputChange("origin", "state", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="originZip">ZIP Code</Label>
                    <Input
                      id="originZip"
                      value={formData.origin.zip}
                      onChange={(e) => handleInputChange("origin", "zip", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Destination</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="destAddress">Address</Label>
                    <Input
                      id="destAddress"
                      value={formData.destination.address}
                      onChange={(e) => handleInputChange("destination", "address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destCity">City</Label>
                      <Input
                        id="destCity"
                        value={formData.destination.city}
                        onChange={(e) => handleInputChange("destination", "city", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="destState">State</Label>
                      <Input
                        id="destState"
                        value={formData.destination.state}
                        onChange={(e) => handleInputChange("destination", "state", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="destZip">ZIP Code</Label>
                    <Input
                      id="destZip"
                      value={formData.destination.zip}
                      onChange={(e) => handleInputChange("destination", "zip", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Dimensions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="height">Height (ft)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange("dimensions", "height", Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange("dimensions", "width", Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange("dimensions", "length", Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.dimensions.weight}
                    onChange={(e) => handleInputChange("dimensions", "weight", Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.dimensions.description}
                  onChange={(e) => handleInputChange("dimensions", "description", e.target.value)}
                  placeholder="Optional description of cargo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Input
                id="specialRequirements"
                value={formData.specialRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                placeholder="Any special requirements or notes"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactName">Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactInfo.name}
                    onChange={(e) => handleInputChange("contactInfo", "name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleInputChange("contactInfo", "phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleInputChange("contactInfo", "email", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editingLoadId ? "Updating..." : "Creating...") : (editingLoadId ? "Update Load" : "Create Load")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}