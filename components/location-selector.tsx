"use client"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Globe, Building2 } from "lucide-react"

export interface LocationData {
  country: string
  city: string
  address?: string
}

interface LocationSelectorProps {
  value: LocationData
  onChange: (location: LocationData) => void
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "GR", name: "Greece" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
]

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-muted/50">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Property Location
        </h3>
        <p className="text-xs text-muted-foreground">
          Providing location helps us give more accurate pricing and location-specific marketing content
        </p>
      </div>

      <div className="space-y-4">
        {/* Country Selection */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Country *
          </Label>
          <Select value={value.country} onValueChange={(country) => onChange({ ...value, country })}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Input */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            City *
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="e.g., Paris, London, New York"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            required
          />
        </div>

        {/* Address Input (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address (Optional)
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="e.g., 123 Main Street, District 5"
            value={value.address || ""}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Street address or neighborhood for more precise pricing estimates
          </p>
        </div>
      </div>
    </div>
  )
}
