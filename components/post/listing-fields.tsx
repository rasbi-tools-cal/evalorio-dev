"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { LocationPickerMap } from "@/components/map"
import { LocationAutocomplete } from "@/components/search/location-autocomplete"
import { Field, fieldAria } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "@/i18n/navigation"
import { ENERGY_RATINGS, FEATURES, PROPERTY_TYPES, type Feature, type PropertyType } from "@/lib/catalog"
import type { WizardListing } from "@/lib/listings/wizard"
import { createClient } from "@/lib/supabase/client"
import { cn, containsContactInfo } from "@/lib/utils"
import { PhotoUploader } from "./photo-uploader"

/** Shared state, fields and validation for the post wizard and the single-page editor. */

export type Errors = Partial<Record<string, string>>
type T = (key: string, values?: Record<string, string | number>) => string

const NO_ROOMS: PropertyType[] = ["land", "garage", "commercial", "office"]
const NUM_FIELDS = ["price", "area_m2", "bedrooms", "bathrooms", "floor", "year_built"] as const
type NumField = (typeof NUM_FIELDS)[number]

function toInt(value: string) {
  if (value.trim() === "") return null
  const n = Number(value.replace(/[^\d-]/g, ""))
  return Number.isFinite(n) ? Math.round(n) : NaN
}

export function useListingForm(initial: WizardListing) {
  const [listing, setListing] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  // Raw text for numeric inputs so people can type freely ("235 000").
  const [nums, setNums] = useState<Record<NumField, string>>(
    () => Object.fromEntries(NUM_FIELDS.map((k) => [k, initial[k]?.toString() ?? ""])) as Record<NumField, string>,
  )
  const update = (patch: Partial<WizardListing>) => setListing((l) => ({ ...l, ...patch }))
  const setNum = (key: NumField, value: string) => setNums((n) => ({ ...n, [key]: value }))
  return { listing, update, errors, setErrors, nums, setNum }
}
export type ListingForm = ReturnType<typeof useListingForm>

// --- validation ----------------------------------------------------------------------------------

export function validateLocation(listing: WizardListing, tv: T): Errors {
  const errs: Errors = {}
  if (!listing.city) errs.city = tv("city")
  if (!listing.point) errs.location = tv("location")
  return errs
}

export function locationPayload(listing: WizardListing) {
  return {
    cityId: listing.city!.id,
    neighborhoodId: listing.neighborhoodId,
    lat: listing.point![0],
    lng: listing.point![1],
    address: listing.address,
    showExact: listing.showExact,
  }
}

export function validateDetails(listing: WizardListing, nums: Record<NumField, string>, tv: T) {
  const errs: Errors = {}
  const v = Object.fromEntries(NUM_FIELDS.map((k) => [k, toInt(nums[k])])) as Record<NumField, number | null>
  if (v.price == null || Number.isNaN(v.price) || v.price < 1 || v.price > 100_000_000) errs.price = tv("price")
  if (v.area_m2 == null || Number.isNaN(v.area_m2) || v.area_m2 < 1 || v.area_m2 > 100_000) errs.area_m2 = tv("area")
  for (const k of ["bedrooms", "bathrooms", "floor", "year_built"] as const) if (Number.isNaN(v[k])) errs[k] = tv("number")
  if (v.year_built != null && (v.year_built < 1500 || v.year_built > 2100)) errs.year_built = tv("number")
  const title = listing.title?.trim() ?? ""
  if (title && (title.length < 5 || title.length > 120)) errs.title = tv("title")
  if ((listing.description?.length ?? 0) > 5000) errs.description = tv("description")
  if (title && containsContactInfo(title)) errs.title = tv("noContactInText")
  if (listing.description && containsContactInfo(listing.description)) errs.description = tv("noContactInText")
  const payload = {
    operation: listing.operation,
    property_type: listing.property_type,
    price: v.price,
    area_m2: v.area_m2,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    floor: v.floor,
    exterior: listing.exterior,
    year_built: v.year_built,
    energy_rating: (listing.energy_rating as (typeof ENERGY_RATINGS)[number]) || null,
    features: listing.features as Feature[],
    title: title || null,
    description: listing.description?.trim() || null,
  }
  return { errors: errs, payload }
}

export function validateContact(listing: WizardListing, tv: T) {
  const errs: Errors = {}
  const contactName = listing.contactName?.trim() ?? ""
  const contactPhone = listing.contactPhone?.trim() ?? ""
  if (contactName.length < 2) errs.contactName = tv("required")
  if (contactPhone && !/^\+?[0-9 ()-]{6,20}$/.test(contactPhone)) errs.contactPhone = tv("phone")
  return { errors: errs, payload: { contactName, contactPhone: contactPhone || null, showPhone: listing.showPhone } }
}

/** Message for a failed server action; field errors go next to the field. */
export function serverErrorMessage(error: string, tv: T, tc: T) {
  const known = ["noContactInText", "title", "price", "area", "city", "location", "photos", "terms", "phone"]
  return known.includes(error) ? tv(error) : error === "rate_limited" ? tc("rateLimited") : tc("genericError")
}

export function focusFirstError(errs: Errors) {
  const first = Object.keys(errs)[0]
  if (first) document.getElementById(first)?.focus()
}

// --- fields --------------------------------------------------------------------------------------

export function ChoiceGroup<V extends string>({
  name,
  label,
  options,
  value,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  name: string
  label: string
  options: { value: V; label: string }[]
  value: V | null
  onChange: (v: V) => void
  columns?: string
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-base font-semibold">{label}</legend>
      <div className={cn("grid gap-2", columns)}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center justify-center rounded-lg border px-3 py-3 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px]",
              value === o.value ? "border-primary bg-primary-soft text-primary-soft-foreground" : "hover:bg-surface-low",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function BasicsFields({ form }: { form: ListingForm }) {
  const t = useTranslations("post")
  const tt = useTranslations("types")
  const { listing, update } = form
  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        name="operation"
        label={t("operationQuestion")}
        value={listing.operation}
        onChange={(v) => update({ operation: v })}
        columns="grid-cols-2"
        options={[
          { value: "sale", label: t("sell") },
          { value: "rent", label: t("rentOut") },
        ]}
      />
      <ChoiceGroup
        name="type"
        label={t("typeQuestion")}
        value={listing.property_type}
        onChange={(v) => update({ property_type: v })}
        options={PROPERTY_TYPES.filter((p) => !(listing.operation === "sale" && p === "room")).map((p) => ({ value: p, label: tt(p) }))}
      />
    </div>
  )
}

export function LocationFields({ form }: { form: ListingForm }) {
  const t = useTranslations("post")
  const tc = useTranslations("common")
  const { listing, update, errors } = form
  const [hoodsByCity, setHoodsByCity] = useState<{ cityId: number; list: { id: number; name: string }[] } | null>(null)

  const cityId = listing.city?.id
  useEffect(() => {
    if (!cityId) return
    createClient()
      .from("neighborhoods")
      .select("id, name")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data }) => setHoodsByCity({ cityId, list: data ?? [] }))
  }, [cityId])
  const neighborhoods = hoodsByCity && hoodsByCity.cityId === cityId ? hoodsByCity.list : []

  return (
    <div className="flex flex-col gap-6">
      <Field label={t("city")} htmlFor="city" error={errors.city}>
        <LocationAutocomplete
          inputId="city"
          value={listing.city}
          placeholder={t("cityPlaceholder")}
          invalid={!!errors.city}
          describedBy={errors.city ? "city-error" : undefined}
          onChange={(city) => update({ city, neighborhoodId: null, point: city ? [city.lat, city.lng] : null })}
        />
      </Field>
      {neighborhoods.length > 0 && (
        <Field label={t("neighbourhood")} htmlFor="neighborhood" optionalLabel={tc("optional")}>
          <NativeSelect
            id="neighborhood"
            value={listing.neighborhoodId ?? ""}
            onChange={(e) => update({ neighborhoodId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t("noNeighbourhood")}</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label={t("address")} htmlFor="address" help={t("addressHelp")} optionalLabel={tc("optional")}>
        <Input
          {...fieldAria("address", undefined, true)}
          value={listing.address ?? ""}
          maxLength={200}
          autoComplete="street-address"
          onChange={(e) => update({ address: e.target.value })}
        />
      </Field>
      {listing.city && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{t("pinHelp")}</p>
          <LocationPickerMap
            key={listing.city.id}
            center={[listing.city.lat, listing.city.lng]}
            value={listing.point}
            onChange={(point) => update({ point })}
            label={t("pinHelp")}
          />
          {errors.location && (
            <p id="location" tabIndex={-1} role="alert" className="text-destructive text-sm">
              {errors.location}
            </p>
          )}
          <label className="mt-2 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="accent-primary mt-1 size-4"
              checked={listing.showExact}
              onChange={(e) => update({ showExact: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-medium">{t("showExactLocation")}</span>
              <span className="text-muted-foreground block text-[13px]">{t("showExactLocationHelp")}</span>
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

export function DetailsFields({ form }: { form: ListingForm }) {
  const t = useTranslations("post")
  const tf = useTranslations("features")
  const te = useTranslations("energy")
  const tc = useTranslations("common")
  const { listing, update, errors, nums, setNum } = form
  const noRooms = NO_ROOMS.includes(listing.property_type)

  const num = (key: NumField, label: string, opts: { help?: string; optional?: boolean; big?: boolean } = {}) => (
    <Field label={label} htmlFor={key} help={opts.help} error={errors[key]} optionalLabel={opts.optional ? tc("optional") : undefined}>
      <Input
        {...fieldAria(key, errors[key], opts.help)}
        inputMode="numeric"
        value={nums[key]}
        onChange={(e) => setNum(key, e.target.value)}
        className={opts.big ? "text-lg font-semibold" : undefined}
      />
    </Field>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {num("price", listing.operation === "rent" ? `${t("priceRent")} (€)` : `${t("price")} (€)`, { big: true })}
        {num("area_m2", t("area"))}
        {!noRooms && num("bedrooms", t("bedrooms"))}
        {!noRooms && num("bathrooms", t("bathrooms"))}
        {num("floor", t("floor"), { help: t("floorHelp"), optional: true })}
        {num("year_built", t("yearBuilt"), { optional: true })}
        <Field label={t("exteriorQuestion")} htmlFor="exterior" optionalLabel={tc("optional")}>
          <NativeSelect
            id="exterior"
            value={listing.exterior == null ? "" : listing.exterior ? "exterior" : "interior"}
            onChange={(e) => update({ exterior: e.target.value === "" ? null : e.target.value === "exterior" })}
          >
            <option value="">—</option>
            <option value="exterior">{t("exterior")}</option>
            <option value="interior">{t("interior")}</option>
          </NativeSelect>
        </Field>
        <Field label={t("energyRating")} htmlFor="energy_rating" optionalLabel={tc("optional")}>
          <NativeSelect id="energy_rating" value={listing.energy_rating ?? ""} onChange={(e) => update({ energy_rating: e.target.value || null })}>
            <option value="">—</option>
            {ENERGY_RATINGS.map((r) => (
              <option key={r} value={r}>
                {r === "exempt" ? te("exempt") : r === "pending" ? te("pending") : r}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t("features")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FEATURES.map((f) => {
            const checked = listing.features.includes(f)
            return (
              <label
                key={f}
                className={cn(
                  "has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm has-[:focus-visible]:ring-[3px]",
                  checked ? "border-primary bg-primary-soft" : "hover:bg-surface-low",
                )}
              >
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={checked}
                  onChange={() => update({ features: checked ? listing.features.filter((x) => x !== f) : [...listing.features, f] })}
                />
                {tf(f)}
              </label>
            )
          })}
        </div>
      </fieldset>

      <Field label={t("listingTitle")} htmlFor="title" help={t("listingTitleHelp")} error={errors.title} optionalLabel={tc("optional")}>
        <Input
          {...fieldAria("title", errors.title, true)}
          value={listing.title ?? ""}
          maxLength={120}
          placeholder={t("listingTitlePlaceholder")}
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>
      <Field
        label={t("description")}
        htmlFor="description"
        help={t("descriptionHelp", { count: listing.description?.length ?? 0 })}
        error={errors.description}
        optionalLabel={tc("optional")}
      >
        <Textarea
          {...fieldAria("description", errors.description, true)}
          value={listing.description ?? ""}
          maxLength={5000}
          rows={8}
          placeholder={t("descriptionPlaceholder")}
          onChange={(e) => update({ description: e.target.value })}
        />
      </Field>
    </div>
  )
}

export function PhotosField({ form, onBusyChange }: { form: ListingForm; onBusyChange: (busy: boolean) => void }) {
  const { listing, update, errors, setErrors } = form
  return (
    <div className="flex flex-col gap-3">
      <PhotoUploader
        listingId={listing.id}
        ownerId={listing.ownerId}
        photos={listing.photos}
        onBusyChange={onBusyChange}
        onChange={(photos) => {
          update({ photos })
          if (photos.length) setErrors((e) => ({ ...e, photos: undefined }))
        }}
      />
      {errors.photos && (
        <p id="photos" tabIndex={-1} role="alert" className="text-destructive text-sm">
          {errors.photos}
        </p>
      )}
    </div>
  )
}

export function ContactFields({ form }: { form: ListingForm }) {
  const t = useTranslations("post")
  const tc = useTranslations("common")
  const { listing, update, errors } = form
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("contactName")} htmlFor="contactName" error={errors.contactName}>
          <Input
            {...fieldAria("contactName", errors.contactName)}
            value={listing.contactName ?? ""}
            maxLength={60}
            autoComplete="name"
            onChange={(e) => update({ contactName: e.target.value })}
          />
        </Field>
        <Field label={t("contactPhone")} htmlFor="contactPhone" help={t("contactPhoneHelp")} error={errors.contactPhone} optionalLabel={tc("optional")}>
          <Input
            {...fieldAria("contactPhone", errors.contactPhone, true)}
            type="tel"
            value={listing.contactPhone ?? ""}
            maxLength={20}
            autoComplete="tel"
            placeholder="+34 600 000 000"
            onChange={(e) => update({ contactPhone: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="accent-primary size-4" checked={listing.showPhone} onChange={(e) => update({ showPhone: e.target.checked })} />
        {t("showPhone")}
      </label>
    </div>
  )
}

/** Review notice + terms checkbox shown before a listing is submitted for publication. */
export function PublishTerms({
  trusted,
  emailConfirmed,
  accepted,
  onAccept,
  error,
}: {
  trusted: boolean
  emailConfirmed: boolean
  accepted: boolean
  onAccept: (v: boolean) => void
  error?: string
}) {
  const t = useTranslations("post")
  return (
    <div className="bg-surface rounded-lg border p-5">
      <h2 className="font-semibold">{t("reviewTitle")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{trusted ? t("reviewTextTrusted") : t("reviewText")}</p>
      {!emailConfirmed && (
        <p role="alert" className="bg-warning-soft text-warning mt-3 rounded-md px-3 py-2 text-sm">
          {t("verifyEmailFirst")}
        </p>
      )}
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
        <input
          id="terms"
          type="checkbox"
          className="accent-primary mt-0.5 size-4"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? "terms-error" : undefined}
        />
        <span>
          {t.rich("terms", {
            terms: (chunks) => (
              <Link href="/terms" className="text-primary underline" target="_blank">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {error && (
        <p id="terms-error" role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
