"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  MapPin, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowRight,
  Database,
  ClipboardList
} from "lucide-react";

export default function CompliancePage() {
  const router = useRouter();
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const allRules = useQuery(api.compliance.searchRules, {});
  const seedStates = useMutation(api.compliance.seedUSStates);
  const seedRules = useMutation(api.compliance.seedSampleRules);

  const stats = {
    totalJurisdictions: jurisdictions?.length || 0,
    totalRules: allRules?.length || 0,
    publishedRules: allRules?.filter(r => r.status === "published").length || 0,
    draftRules: allRules?.filter(r => r.status === "draft").length || 0,
    inReviewRules: allRules?.filter(r => r.status === "in_review").length || 0,
  };

  const handleSeedData = async () => {
    try {
      await seedStates({});
      await seedRules({});
      alert("Sample data seeded successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Error seeding data. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white">
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compliance Studio</h1>
              <p className="text-gray-600 mt-1">
                Manage transportation rules and regulations across jurisdictions
              </p>
            </div>
            <div className="flex gap-3">
              {stats.totalJurisdictions === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSeedData}
                  className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Seed Sample Data
                </Button>
              )}
              <Button
                onClick={() => router.push("/dashboard/compliance/rules/new")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jurisdictions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJurisdictions}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Published Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publishedRules}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inReviewRules}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Draft Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draftRules}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/dashboard/compliance/rules")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules Management</h3>
                  <p className="text-gray-600 mb-4">
                    Create, edit, and publish compliance rules for heavy haul transportation. 
                    Define dimension limits, escort requirements, time restrictions, and more.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    View All Rules
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/dashboard/compliance/jurisdictions")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Jurisdictions</h3>
                  <p className="text-gray-600 mb-4">
                    View and manage jurisdictions including states, counties, and cities. 
                    Each jurisdiction can have its own set of compliance rules.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    View Jurisdictions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/dashboard/compliance/fields")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Dictionary</h3>
                  <p className="text-gray-600 mb-4">
                    Manage the 29 canonical system fields and map state-specific field labels
                    for permit data standardization.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    Manage Fields
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Database className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/dashboard/compliance/permit-types")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Permit Types</h3>
                  <p className="text-gray-600 mb-4">
                    Configure which fields are required, optional, or hidden for each
                    permit form type.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    Configure Forms
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ClipboardList className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity / Info */}
          {stats.totalRules === 0 && (
            <Card className="mt-6 p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Getting Started</h4>
                  <p className="text-yellow-700 mt-1">
                    No compliance rules have been created yet. Click "Seed Sample Data" above to 
                    populate US states and sample rules for Illinois and Pennsylvania, or create 
                    your first rule manually.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
