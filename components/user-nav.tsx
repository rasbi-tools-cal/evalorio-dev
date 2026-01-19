"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, CreditCard, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function UserNav() {
  const [user, setUser] = useState<{ email: string; credits: number; isAdmin: boolean } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("credits, is_admin")
          .eq("id", authUser.id)
          .single()

        setUser({
          email: authUser.email || "",
          credits: userData?.credits || 0,
          isAdmin: userData?.is_admin || false,
        })
      }
    }

    fetchUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              <span>
                {user.credits} {user.credits === 1 ? "credit" : "credits"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.isAdmin && (
          <>
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
