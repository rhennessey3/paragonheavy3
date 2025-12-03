"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function GeneralSettingsTab() {
  const { user } = useUser();
  const userId = user?.id;
  const { toast } = useToast();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "org:admin";

  if (!userProfile || !organization) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleLeaveOrganization = () => {
    toast({
      title: "Coming Soon",
      description: "Leave organization will be available in a future update.",
    });
    setShowLeaveDialog(false);
  };

  const handleDeleteOrganization = () => {
    toast({
      title: "Coming Soon",
      description: "Delete organization will be available in a future update.",
    });
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-4">General Settings</h3>

      {/* Organization Profile */}
      <div className="flex items-center justify-between py-4 border-b">
        <div className="text-sm text-muted-foreground">Organization Profile</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">{organization.name}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            Update profile
          </Button>
        </div>
      </div>

      {/* Leave Organization */}
      <div className="flex items-center justify-between py-4 border-b">
        <div className="text-sm text-muted-foreground">Leave organization</div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowLeaveDialog(true)}
        >
          Leave organization
        </Button>
      </div>

      {/* Delete Organization */}
      {isAdmin && (
        <div className="flex items-center justify-between py-4 border-b">
          <div className="text-sm text-muted-foreground">Delete organization</div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete organization
          </Button>
        </div>
      )}

      {/* Leave Organization Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {organization.name}? You will lose access to all organization resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveOrganization}>
              Leave organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {organization.name}? This action cannot be undone.
              All members will lose access and all data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrganization}>
              Delete organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

