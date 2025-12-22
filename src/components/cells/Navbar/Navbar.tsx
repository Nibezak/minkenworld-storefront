import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, NavbarSearch } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export const Navbar = ({
  categories,
  parentCategories,
  collections,
}: {
  categories: HttpTypes.StoreProductCategory[]
  parentCategories: HttpTypes.StoreProductCategory[]
  collections: HttpTypes.StoreCollection[]
}) => {
  return (
    <div className="flex flex-col lg:flex-row border py-4 justify-between px-4 md:px-5 gap-4 md:gap-0">
      <div className="hidden lg:flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <CategoryNavbar
            categories={categories}
            parentCategories={parentCategories}
          />
          {collections && collections.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">|</span>
              {collections.slice(0, 3).map((collection) => (
                <LocalizedClientLink
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="label-md uppercase px-2 py-1 text-primary hover:text-gray-600 transition-colors"
                >
                  {collection.title}
                </LocalizedClientLink>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto max-w-[296px] w-full pl-4">
          <NavbarSearch />
        </div>
      </div>
      <div className="lg:hidden max-w-[296px] w-full">
        <NavbarSearch className="max-w-[296px]" />
      </div>
    </div>
  )
}
