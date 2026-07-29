import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LoginForm from "./LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()

  if (session?.user) {
    const params = await searchParams
    redirect(params.callbackUrl || "/")
  }

  const params = await searchParams
  const callbackUrl = params.callbackUrl || "/"

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  )
}
