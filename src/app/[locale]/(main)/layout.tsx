import { Footer, Header, MobileBottomNav } from "@/components/organisms"
import { ShoppingAssistant } from "@/components/organisms/ShoppingAssistant/ShoppingAssistant"
import { retrieveCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { Session } from "@talkjs/react"
import { redirect } from "next/navigation"

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID
  const { locale } = await params

  const user = await retrieveCustomer()
  const regionCheck = await checkRegion(locale)

  if (!regionCheck) {
    return redirect("/")
  }

  const isLoggedIn = Boolean(user)

  if (!APP_ID || !user)
    return (
      <>
        <Header />
        <div className="pb-16 lg:pb-0">
          {children}
        </div>
        <MobileBottomNav 
          wishlistCount={0} 
          isLoggedIn={isLoggedIn} 
        />
        <Footer />
        <ShoppingAssistant />
      </>
    )

  return (
    <>
      <Session appId={APP_ID} userId={user.id}>
        <Header />
        <div className="pb-16 lg:pb-0">
          {children}
        </div>
        <MobileBottomNav 
          wishlistCount={0} 
          isLoggedIn={isLoggedIn} 
        />
        <Footer />
        <ShoppingAssistant />
      </Session>
    </>
  )
}
