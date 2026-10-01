import * as React from "react"
import { cn } from "@/lib/utils"

/** Label + control + help/error text with the aria wiring done once. */
export function Field({
  label,
  htmlFor,
  help,
  error,
  optionalLabel,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor: string
  help?: React.ReactNode
  error?: React.ReactNode
  optionalLabel?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {optionalLabel && <span className="text-muted-foreground ml-1 font-normal">({optionalLabel})</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      ) : help ? (
        <p id={`${htmlFor}-help`} className="text-muted-foreground text-[13px]">
          {help}
        </p>
      ) : null}
    </div>
  )
}

export function fieldAria(id: string, error?: unknown, help?: unknown) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : help ? `${id}-help` : undefined,
  } as const
}
