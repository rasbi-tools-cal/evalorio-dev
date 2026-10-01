/**
 * Sign-in happens in a server action, which sets the session cookies on the server. Client
 * components that cache the session (header menu, favourites) listen for this event to reload,
 * because Supabase's onAuthStateChange only fires for changes made by the browser client.
 */
export const AUTH_CHANGED_EVENT = "evalorio:auth-changed"

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}
