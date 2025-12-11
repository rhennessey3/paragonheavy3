"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Link2 } from "lucide-react";
import { FieldMapper } from "@/components/compliance/FieldMapper";
import { Id } from "@/convex/_generated/dataModel";

export default function FieldMapperPage() {
  const router = useRouter();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");

  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  const selectedJurisdictionData = jurisdictions?.find(
    (j) => j._id === selectedJurisdiction
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/compliance/fields")}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Jurisdictional Field Mapping
            </h1>
            <p className="text-gray-600 text-sm">
              Drag a jurisdiction-specific field from the right and drop it onto a
              corresponding system field on the left to create a mapping.
            </p>
          </div>
        </div>

        {/* Jurisdiction Selector */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Jurisdiction
              </label>
              <Select
                value={selectedJurisdiction}
                onValueChange={setSelectedJurisdiction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state..." />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions?.map((j) => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.name} ({j.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!selectedJurisdiction ? (
          <Card className="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <Link2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select a Jurisdiction
            </h3>
            <p className="text-gray-600 max-w-md">
              Choose a state from the dropdown above to view and create field
              mappings between their fields and your system fields.
            </p>
          </Card>
        ) : (
          <div className="flex-1 min-h-0">
            <FieldMapper
              jurisdictionId={selectedJurisdiction as Id<"jurisdictions">}
              jurisdictionName={selectedJurisdictionData?.name || ""}
              jurisdictionAbbreviation={selectedJurisdictionData?.abbreviation || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
