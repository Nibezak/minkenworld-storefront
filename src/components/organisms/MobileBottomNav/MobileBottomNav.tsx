"use client"
import { useState } from "react"
import { HeartIcon, ProfileIcon, MessageIcon } from "@/icons"
import { Badge } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShoppingAssistant } from "../ShoppingAssistant/ShoppingAssistant"

interface MobileBottomNavProps {
  wishlistCount: number
  isLoggedIn: boolean
}

export const MobileBottomNav = ({ wishlistCount, isLoggedIn }: MobileBottomNavProps) => {
  const pathname = usePathname()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around py-2">
          <LocalizedClientLink
            href="/"
            className={cn(
              "flex flex-col items-center p-2 text-xs",
              isActive("/") ? "text-primary" : "text-gray-600"
            )}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </LocalizedClientLink>

          {isLoggedIn && (
            <LocalizedClientLink
              href="/user/wishlist"
              className={cn(
                "flex flex-col items-center p-2 text-xs relative",
                isActive("/user/wishlist") ? "text-primary" : "text-gray-600"
              )}
            >
              <HeartIcon size={24} className="mb-1" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                  {wishlistCount}
                </Badge>
              )}
              <span>Wishlist</span>
            </LocalizedClientLink>
          )}

          {/* AI Chat Button - Middle Tab */}
          <button 
            onClick={() => setIsChatOpen(true)}
            className={cn(
              "flex flex-col items-center p-2 text-xs",
              isChatOpen ? "text-action" : "text-gray-600"
            )}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
            <span>AI Chat</span>
          </button>

          {isLoggedIn ? (
            <LocalizedClientLink
              href="/user/settings"
              className={cn(
                "flex flex-col items-center p-2 text-xs",
                isActive("/user") ? "text-primary" : "text-gray-600"
              )}
            >
              <ProfileIcon size={24} className="mb-1" />
              <span>Profile</span>
            </LocalizedClientLink>
          ) : (
            <LocalizedClientLink
              href="/login"
              className={cn(
                "flex flex-col items-center p-2 text-xs",
                isActive("/auth") ? "text-primary" : "text-gray-600"
              )}
            >
              <ProfileIcon size={24} className="mb-1" />
              <span>Login</span>
            </LocalizedClientLink>
          )}
        </div>
      </div>

      {/* Mobile MinkenWorld AI */}
      <ShoppingAssistant 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        isMobile={true}
      />
    </>
  )
}
