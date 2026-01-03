"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileEdit, Send, Loader2 } from "lucide-react";

interface SaveOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (status: "draft" | "published") => void;
  isSaving: boolean;
  policyName: string;
}

export function SaveOptionsDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  policyName,
}: SaveOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"draft" | "published" | null>(null);

  const handleSave = (status: "draft" | "published") => {
    setSelectedOption(status);
    onSave(status);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedOption(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Policy</DialogTitle>
          <DialogDescription>
            Choose how you want to save &quot;{policyName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <Card
            className={`p-4 cursor-pointer transition-all border-2 hover:border-gray-400 ${
              selectedOption === "draft" && isSaving
                ? "border-gray-400 bg-gray-50"
                : "border-gray-200"
            } ${isSaving ? "pointer-events-none" : ""}`}
            onClick={() => !isSaving && handleSave("draft")}
          >
            <div className="flex flex-col items-center text-center gap-2">
              {selectedOption === "draft" && isSaving ? (
                <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
              ) : (
                <FileEdit className="h-8 w-8 text-gray-500" />
              )}
              <div>
                <h4 className="font-medium text-sm">Save as Draft</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Continue editing later
                </p>
              </div>
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border-2 hover:border-green-400 ${
              selectedOption === "published" && isSaving
                ? "border-green-400 bg-green-50"
                : "border-gray-200"
            } ${isSaving ? "pointer-events-none" : ""}`}
            onClick={() => !isSaving && handleSave("published")}
          >
            <div className="flex flex-col items-center text-center gap-2">
              {selectedOption === "published" && isSaving ? (
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              ) : (
                <Send className="h-8 w-8 text-green-600" />
              )}
              <div>
                <h4 className="font-medium text-sm">Save & Publish</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Make it active now
                </p>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
