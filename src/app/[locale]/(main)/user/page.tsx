import { retrieveCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

export default async function UserPage() {
  const user = await retrieveCustomer()

  if (!user) {
    redirect("/login")
  }
  
  // Redirect to settings page instead of showing welcome message
  redirect("/user/settings")
}
