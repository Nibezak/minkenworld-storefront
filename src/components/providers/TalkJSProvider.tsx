"use client"

import { useCallback } from "react"
import Talk from "talkjs"
import { Session } from "@talkjs/react"
import { HttpTypes } from "@medusajs/types"

// Hardcoded TalkJS App ID
const APP_ID = "t2b8feUu"

export const TalkJSProvider = ({
  children,
  user,
}: {
  children: React.ReactNode
  user: HttpTypes.StoreCustomer | null
}) => {
  const syncUser = useCallback(() => {
    if (!user) return null
    
    return new Talk.User({
      id: user.id,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Customer",
      email: user.email || null,
      photoUrl: null,
      role: "default", // Set role to enable all TalkJS features
    })
  }, [user])

  if (!APP_ID || !user) {
    return <>{children}</>
  }

  return (
    <Session appId={APP_ID} syncUser={syncUser}>
      {children}
    </Session>
  )
}
