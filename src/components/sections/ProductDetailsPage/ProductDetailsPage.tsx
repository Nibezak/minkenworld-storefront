import { ProductDetails, ProductGallery } from "@/components/organisms"
import { listProducts } from "@/lib/data/products"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
    forceCache: true,
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  // Get seller products, excluding current product
  const sellerProducts = (prod.seller?.products || []).filter((p: any) => p.id !== prod.id)
  
  let displayedProducts = [...sellerProducts]
  let sectionHeading = "More from this seller"

  // If fewer than 3 products, fetch more from other sellers
  if (displayedProducts.length < 3) {
    sectionHeading = "More Products"
    
    // Fetch more products to fill the recommendations
    const { response: { products: otherProducts } } = await listProducts({
      countryCode: locale,
      queryParams: { 
        limit: 10,
        // Exclude current product and already included seller products
        id: { gt: "" } // Medusa hack to get all, we'll filter manually
      },
    })

    // Filter out current product and duplicates
    const additionalProducts = otherProducts.filter(p => 
      p.id !== prod.id && 
      !displayedProducts.find(dp => dp.id === p.id)
    )

    displayedProducts = [...displayedProducts, ...additionalProducts].slice(0, 10)
  }

  return (
    <>
      <div className="flex flex-col md:flex-row lg:gap-12">
        <div className="md:w-1/2 md:px-2">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2">
          <ProductDetails product={prod} locale={locale} />
        </div>
      </div>
      <div className="my-8">
        <HomeProductSection
          heading={sectionHeading}
          products={displayedProducts}
          // seller_handle={prod.seller?.handle}
          locale={locale}
        />
      </div>
    </>
  )
}
