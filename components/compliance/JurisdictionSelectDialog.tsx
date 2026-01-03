"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface Jurisdiction {
  _id: string;
  name: string;
  abbreviation?: string;
}

interface JurisdictionSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jurisdictions: Jurisdiction[] | undefined;
  onSelect: (jurisdictionId: string) => void;
}

export function JurisdictionSelectDialog({
  open,
  onOpenChange,
  jurisdictions,
  onSelect,
}: JurisdictionSelectDialogProps) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");

  const handleContinue = () => {
    if (selectedJurisdiction) {
      onSelect(selectedJurisdiction);
      onOpenChange(false);
      setSelectedJurisdiction("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Select Jurisdiction
            </div>
          </DialogTitle>
          <DialogDescription>
            Choose the jurisdiction for your new policy. You'll be taken to the
            canvas to build it visually.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select
            value={selectedJurisdiction}
            onValueChange={setSelectedJurisdiction}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a jurisdiction..." />
            </SelectTrigger>
            <SelectContent>
              {jurisdictions?.map((j) => (
                <SelectItem key={j._id} value={j._id}>
                  {j.abbreviation ? `${j.abbreviation} - ` : ""}
                  {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selectedJurisdiction}>
            Continue to Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
