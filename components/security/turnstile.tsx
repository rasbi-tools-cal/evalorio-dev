"use client"

import { useLocale } from "next-intl"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { TURNSTILE_SITE_KEY } from "@/lib/env"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
    __turnstileLoading?: Promise<void>
  }
}

function loadScript() {
  if (window.turnstile) return Promise.resolve()
  window.__turnstileLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("turnstile failed to load"))
    document.head.appendChild(script)
  })
  return window.__turnstileLoading
}

export interface TurnstileHandle {
  reset: () => void
}

/** Cloudflare Turnstile (privacy-friendly captcha). Renders nothing when no site key is configured. */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void; action?: string }>(
  function Turnstile({ onToken, action }, ref) {
    const container = useRef<HTMLDivElement>(null)
    const widgetId = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    const locale = useLocale()
    onTokenRef.current = onToken

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
        onTokenRef.current(null)
      },
    }))

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) return
      let cancelled = false
      loadScript()
        .then(() => {
          if (cancelled || !container.current || !window.turnstile) return
          widgetId.current = window.turnstile.render(container.current, {
            sitekey: TURNSTILE_SITE_KEY,
            action,
            language: locale,
            size: "flexible",
            appearance: "interaction-only",
            callback: (token: string) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": () => onTokenRef.current(null),
          })
        })
        .catch(() => onTokenRef.current(null))
      return () => {
        cancelled = true
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }, [action, locale])

    if (!TURNSTILE_SITE_KEY) return null
    return <div ref={container} className="min-h-0 empty:hidden" />
  },
)

export const captchaEnabled = Boolean(TURNSTILE_SITE_KEY)
