"use client"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { getActiveParentHandle } from "@/lib/helpers/category-utils"

export const HeaderCategoryNavbar = ({
  parentCategories,
  categories,
  onClose,
}: {
  parentCategories: HttpTypes.StoreProductCategory[]
  categories: HttpTypes.StoreProductCategory[]
  onClose?: (state: boolean) => void
}) => {
  const { category } = useParams<{ category?: string }>()

  const activeParentHandle = useMemo(
    () => getActiveParentHandle(category, categories, parentCategories),
    [category, categories, parentCategories]
  )

  return (
    <nav
      className="flex items-center p-4 gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
      aria-label="Parent categories"
    >
      {parentCategories?.map(({ id, handle, name }) => {
        const isActive = handle === activeParentHandle
        return (
          <LocalizedClientLink
            key={id}
            href={`/categories/${handle}`}
            onClick={() => (onClose ? onClose(false) : null)}
            className={cn(
              "label-large uppercase text-primary hover:opacity-80 transition-opacity py-2 font-semibold px-6 flex-shrink-0 whitespace-nowrap",
              isActive && "border-b border-primary"
            )}
          >
            {name}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}
