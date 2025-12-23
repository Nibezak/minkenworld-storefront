import {
  ProductListingActiveFilters,
  ProductListingHeader,
  ProductSidebar,
  ProductsList,
  ProductsPagination,
} from "@/components/organisms"
import { PRODUCT_LIMIT } from "@/const"
import { listProductsWithSort } from "@/lib/data/products"

export const ProductListing = async ({
  category_id,
  collection_id,
  seller_id,
  showSidebar = false,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || "pl",
}: {
  category_id?: string
  collection_id?: string
  seller_id?: string
  showSidebar?: boolean
  locale?: string
}) => {
  console.log("=== ProductListing DEBUG ===");
  console.log("seller_id:", seller_id);
  console.log("category_id:", category_id);
  console.log("collection_id:", collection_id);
  console.log("locale:", locale);
  
  const result = await listProductsWithSort({
    seller_id,
    category_id,
    collection_id,
    countryCode: locale,
    sortBy: "created_at",
    queryParams: {
      limit: PRODUCT_LIMIT,
    },
  })

  console.log("Result from listProductsWithSort:", result);
  
  const products = result.response.products;

  console.log("Products count:", products.length);
  console.log("=== END ProductListing DEBUG ===");

  const count = products.length

  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  return (
    <div className="py-4">
      <ProductListingHeader total={count} />
      <div className="hidden md:block">
        <ProductListingActiveFilters />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 mt-6 gap-6">
        {showSidebar && <ProductSidebar />}
        <section className={showSidebar ? "col-span-3" : "col-span-4"}>
          <div className="flex flex-wrap gap-4">
            <ProductsList products={products} />
          </div>
          <ProductsPagination pages={pages} />
        </section>
      </div>
    </div>
  )
}
