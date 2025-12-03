"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Plus, ArrowRight, Pencil } from "lucide-react";

export default function CreateNewJobPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [sameAsCustomer, setSameAsCustomer] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobId: "SYS-GEN-12345",
    jobDescription: "",
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

  const handleCancel = () => {
    router.back();
  };

  const handleSaveDraft = () => {
    // TODO: Implement save as draft
    console.log("Save as draft", formData);
  };

  const handleSaveAndContinue = () => {
    // TODO: Implement save and continue to next step
    console.log("Save & Continue", formData);
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const steps = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Route & Stops" },
    { number: 3, label: "Equipment" },
    { number: 4, label: "Documents" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create New Job</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Title and Description */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">New Job - Basic Info</h2>
            <p className="text-gray-600">
              Fill in the essential details to start creating a new job.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentStep === step.number
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {step.number}. {step.label}
              </button>
            ))}
          </div>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Job Details */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Details</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700 mb-2 block">
                    Job Title / Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Wind Turbine Transport"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="jobId" className="text-sm font-medium text-gray-700 mb-2 block">
                    Job ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="jobId"
                      value={formData.jobId}
                      onChange={(e) => handleInputChange("jobId", e.target.value)}
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
                  <Label htmlFor="jobDescription" className="text-sm font-medium text-gray-700 mb-2 block">
                    Job Description
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Provide a high-level overview, special instructions, or key details."
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange("jobDescription", e.target.value)}
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
      </div>
    </div>
  );
}

