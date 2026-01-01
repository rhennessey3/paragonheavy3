"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface DimensionInputProps {
  value: number; // Stored as decimal feet (e.g., 14.5 for 14'6")
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * DimensionInput - A component for entering measurements in feet and inches
 * 
 * Converts between:
 * - Display format: separate feet and inches inputs
 * - Storage format: decimal feet (e.g., 14.5 for 14'6")
 */
export function DimensionInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  disabled = false 
}: DimensionInputProps) {
  // Convert decimal feet to feet and inches for display
  const decimalToFeetInches = (decimal: number): { feet: number; inches: number } => {
    const feet = Math.floor(decimal);
    const inches = Math.round((decimal - feet) * 12);
    
    // Handle edge case where rounding gives us 12 inches
    if (inches === 12) {
      return { feet: feet + 1, inches: 0 };
    }
    
    return { feet, inches };
  };

  // Convert feet and inches to decimal feet for storage
  const feetInchesToDecimal = (feet: number, inches: number): number => {
    // Ensure inches are in valid range (0-11)
    const normalizedInches = inches % 12;
    const extraFeet = Math.floor(inches / 12);
    return feet + extraFeet + (normalizedInches / 12);
  };

  const { feet: initialFeet, inches: initialInches } = decimalToFeetInches(value || 0);
  const [feet, setFeet] = useState(initialFeet);
  const [inches, setInches] = useState(initialInches);

  // Update local state when value prop changes
  useEffect(() => {
    const { feet: newFeet, inches: newInches } = decimalToFeetInches(value || 0);
    setFeet(newFeet);
    setInches(newInches);
  }, [value]);

  const handleFeetChange = (newFeet: number) => {
    setFeet(newFeet);
    const decimal = feetInchesToDecimal(newFeet, inches);
    onChange(decimal);
  };

  const handleInchesChange = (newInches: number) => {
    // Clamp inches to 0-11 range
    const clampedInches = Math.max(0, Math.min(11, newInches));
    setInches(clampedInches);
    const decimal = feetInchesToDecimal(feet, clampedInches);
    onChange(decimal);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Input
        type="number"
        className="w-20"
        value={feet}
        onChange={(e) => handleFeetChange(parseInt(e.target.value) || 0)}
        placeholder={placeholder || "0"}
        disabled={disabled}
        min={0}
      />
      <span className="text-sm text-gray-500">ft</span>
      <Input
        type="number"
        className="w-16"
        value={inches}
        onChange={(e) => handleInchesChange(parseInt(e.target.value) || 0)}
        placeholder="0"
        disabled={disabled}
        min={0}
        max={11}
      />
      <span className="text-sm text-gray-500">in</span>
    </div>
  );
}





