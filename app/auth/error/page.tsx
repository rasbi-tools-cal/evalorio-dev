import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-foreground">Evalorio</h1>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {params?.error ? (
              <p className="text-sm text-muted-foreground mb-4">Error: {params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred during authentication.</p>
            )}
            <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
              Return to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
