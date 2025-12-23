import { Footer, Header, MobileBottomNav } from "@/components/organisms"
import { ShoppingAssistant } from "@/components/organisms/ShoppingAssistant/ShoppingAssistant"
import { TalkJSProvider } from "@/components/providers/TalkJSProvider"
import { retrieveCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { redirect } from "next/navigation"

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  const user = await retrieveCustomer()
  const regionCheck = await checkRegion(locale)

  if (!regionCheck) {
    return redirect("/")
  }

  const isLoggedIn = Boolean(user)

  return (
    <TalkJSProvider user={user}>
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
    </TalkJSProvider>
  )
}

