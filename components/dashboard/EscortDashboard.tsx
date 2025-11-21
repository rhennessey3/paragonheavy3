import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadCreationModal } from "./LoadCreationModal";

export function EscortDashboard() {
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-2">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">0</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">$0</p>
            <p className="text-sm text-muted-foreground mt-2">Total earnings</p>
          </CardContent>
        </Card>
      </div>
      <div className="p-4 border rounded-lg bg-muted/10">
        <h3 className="font-semibold mb-2">Escort Actions</h3>
        <div className="space-y-2">
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 w-full"
            onClick={() => setIsLoadModalOpen(true)}
          >
            Create New Load
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90 w-full">
            View Schedule
          </button>
        </div>
      </div>
      
      <LoadCreationModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        orgType="escort"
      />
    </div>
  );
}