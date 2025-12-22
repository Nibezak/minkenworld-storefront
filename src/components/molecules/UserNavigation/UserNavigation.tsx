"use client"
import {
  Badge,
  Card,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { useUnreads } from "@talkjs/react"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navigationItems = [
  {
    label: "Orders",
    href: "/user/orders",
  },
  {
    label: "Messages",
    href: "/user/messages",
  },
  {
    label: "Returns",
    href: "/user/returns",
  },
  {
    label: "Addresses",
    href: "/user/addresses",
  },
  {
    label: "Reviews",
    href: "/user/reviews",
  },
  {
    label: "Wishlist",
    href: "/user/wishlist",
  },
]

export const UserNavigation = () => {
  const unreads = useUnreads()
  const path = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      {/* Mobile Toggle Button - Fixed at bottom for drop-up effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-16 left-0 right-0 z-40 w-full p-4 bg-white border-t border-b flex items-center justify-between shadow-md"
      >
        <span className="font-medium">Menu</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Navigation Card - Drop up from bottom on mobile */}
      <Card className={`h-min bg-white transition-all duration-300 ease-out ${
        isOpen 
          ? "md:block fixed bottom-32 left-0 right-0 z-30 mx-4 mb-4 shadow-2xl animate-slide-up" 
          : "hidden md:block"
      }`}>
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.label}
            href={item.href}
            active={path === item.href}
            className="relative"
            onClick={() => setIsOpen(false)}
          >
            {item.label}
            {item.label === "Messages" && Boolean(unreads?.length) && (
              <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
                {unreads?.length}
              </Badge>
            )}
          </NavigationItem>
        ))}
        <Divider className="my-2" />
        <NavigationItem
          href={"/user/settings"}
          active={path === "/user/settings"}
          onClick={() => setIsOpen(false)}
        >
          Settings
        </NavigationItem>
        <LogoutButton className="w-full text-left" />
      </Card>
    </div>
  )
}
