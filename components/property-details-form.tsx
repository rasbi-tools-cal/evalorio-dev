"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface PropertyDetailsData {
  propertyType: string
  surface: string
  rooms: string
  buildingYear: string
}

interface PropertyDetailsFormProps {
  value: PropertyDetailsData
  onChange: (data: PropertyDetailsData) => void
}

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "loft", label: "Loft" },
]

export function PropertyDetailsForm({ value, onChange }: PropertyDetailsFormProps) {
  const handleChange = (field: keyof PropertyDetailsData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-muted/50">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Property Details</h3>
        <p className="text-xs text-muted-foreground">Provide property details for more accurate analysis and pricing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="property-type" className="text-sm font-medium">
            Property Type
          </Label>
          <Select value={value.propertyType} onValueChange={(val) => handleChange("propertyType", val)}>
            <SelectTrigger id="property-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Surface */}
        <div className="space-y-2">
          <Label htmlFor="surface" className="text-sm font-medium">
            Surface (m²)
          </Label>
          <Input
            id="surface"
            type="number"
            min="10"
            max="10000"
            step="0.1"
            placeholder="e.g. 85.5"
            value={value.surface}
            onChange={(e) => handleChange("surface", e.target.value)}
          />
        </div>

        {/* Rooms */}
        <div className="space-y-2">
          <Label htmlFor="rooms" className="text-sm font-medium">
            Number of Rooms
          </Label>
          <Input
            id="rooms"
            type="number"
            min="1"
            max="50"
            placeholder="e.g. 3"
            value={value.rooms}
            onChange={(e) => handleChange("rooms", e.target.value)}
          />
        </div>

        {/* Building Year */}
        <div className="space-y-2">
          <Label htmlFor="building-year" className="text-sm font-medium">
            Building Year
          </Label>
          <Input
            id="building-year"
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            placeholder={`e.g. ${new Date().getFullYear() - 10}`}
            value={value.buildingYear}
            onChange={(e) => handleChange("buildingYear", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
