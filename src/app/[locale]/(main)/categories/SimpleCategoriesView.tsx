import { listProductsWithSort } from "@/lib/data/products"
import { PRODUCT_LIMIT } from "@/const"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"

export async function SimpleCategoriesView({ locale }: { locale: string }) {
  console.log("SimpleCategoriesView: Starting product fetch for locale:", locale)
  
  const { response } = await listProductsWithSort({
    countryCode: locale,
    sortBy: "created_at",
    queryParams: {
      limit: PRODUCT_LIMIT,
    },
  })

  const { products, count } = response

  console.log("SimpleCategoriesView: Products fetched:", products.length)
  console.log("SimpleCategoriesView: Total count:", count)

  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg text-gray-500">No products found</p>
        <p className="text-sm text-gray-400 mt-2">
          Please add products through the admin panel
        </p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product as any}
            api_product={product}
          />
        ))}
      </div>
    </div>
  )
}
