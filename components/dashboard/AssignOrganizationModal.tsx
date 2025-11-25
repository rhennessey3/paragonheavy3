import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface AssignOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: Id<"loads"> | null;
    // "carrier" or "escort"
    type: "carrier" | "escort";
}

export function AssignOrganizationModal({
    isOpen,
    onClose,
    loadId,
    type,
}: AssignOrganizationModalProps) {
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    // Fetch organizations of the appropriate type
    const organizations = useQuery(api.organizations.getOrganizationsByType, {
        type,
    });

    const assignLoad = useMutation(api.loads.assignLoadToOrganization);

    const handleAssign = async () => {
        if (!loadId || !selectedOrgId) return;
        const args: any = { loadId };
        if (type === "carrier") {
            args.carrierOrgId = selectedOrgId;
        } else {
            args.escortOrgId = selectedOrgId;
        }
        await assignLoad(args);
        onClose();
        setSelectedOrgId("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Load to {type === "carrier" ? "Carrier" : "Escort"} Organization</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {organizations?.length ? (
                        <select
                            className="w-full border rounded p-2"
                            value={selectedOrgId}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                        >
                            <option value="">Select an organization</option>
                            {organizations.map((org) => (
                                <option key={org._id} value={org._id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm text-muted-foreground">No {type} organizations available.</p>
                    )}
                </div>
                <DialogFooter className="flex justify-end space-x-2">
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={handleAssign} disabled={!selectedOrgId}>
                        Assign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
