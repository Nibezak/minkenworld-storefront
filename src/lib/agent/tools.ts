import { z } from "zod"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { sdk } from "@/lib/config"

// Tool to search products in the marketplace
export const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: "Search for products in the marketplace based on a query. Use this when user asks for specific items like houses, cars, electronics, bags, etc.",
  schema: z.object({
    query: z.string().describe("The search query, e.g. 'houses', 'cars', 'bags', 'electronics'"),
    limit: z.number().optional().describe("Number of results to return, default 10"),
  }),
  func: async ({ query, limit = 10 }) => {
    try {
      // Use Medusa SDK to search products
      const response = await sdk.store.product.list({
        q: query,
        limit: limit,
        fields: "*variants,*variants.calculated_price,*images,*thumbnail",
      })

      const products = response.products || []

      if (products.length === 0) {
        return JSON.stringify({
          message: `No products found for "${query}". Try a different search term or browse categories.`,
          products: []
        })
      }

      // Return simplified product data with prices
      const mappedProducts = products.map((p: any) => {
        const product = {
          id: p.id,
          variant_id: p.variants?.[0]?.id || "",
          title: p.title,
          description: p.description?.substring(0, 150),
          price: p.variants?.[0]?.calculated_price?.calculated_amount || 0,
          currency: p.variants?.[0]?.calculated_price?.currency_code || "KES",
          thumbnail: p.thumbnail || (p.images?.[0]?.url || ""),
          handle: p.handle,
        }
        console.log("Product thumbnail:", product.title, "->", product.thumbnail)
        return product
      })

      return JSON.stringify({
        message: `Found ${products.length} products matching "${query}"`,
        products: mappedProducts
      })
    } catch (error) {
      console.error("Search error:", error)
      return JSON.stringify({ 
        error: "Error searching products", 
        message: "I had trouble searching. Try browsing categories instead.",
        products: []
      })
    }
  },
})

// Tool to get product categories
export const getCategoriesTool = new DynamicStructuredTool({
  name: "get_categories",
  description: "Get list of available product categories. Use this when user asks 'what categories do you have?' or wants to browse categories.",
  schema: z.object({}),
  func: async () => {
    try {
      const response = await sdk.store.category.list({
        fields: "id,name,handle",
      })
      
      const categories = response.product_categories || []

      return JSON.stringify({
        message: `Available categories: ${categories.map((c: any) => c.name).join(', ')}`,
        categories: categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
        }))
      })
    } catch (error) {
      console.error("Categories error:", error)
      return JSON.stringify({ 
        error: "Error fetching categories",
        message: "I'm having trouble loading categories right now."
      })
    }
  },
})

// Tool to list all products (when user wants to see everything)
export const listAllProductsTool = new DynamicStructuredTool({
  name: "list_all_products",
  description: "List all available products in the marketplace. Use when user asks to see all products or browse everything.",
  schema: z.object({
    limit: z.number().optional().describe("Number of products to show, default 10"),
  }),
  func: async ({ limit = 10 }) => {
    try {
      const response = await sdk.store.product.list({
        limit: limit,
        fields: "*variants,*variants.calculated_price,*images,*thumbnail",
      })

      const products = response.products || []

      if (products.length === 0) {
        return JSON.stringify({
          message: "No products available at the moment.",
          products: []
        })
      }

      return JSON.stringify({
        message: `Here are ${products.length} products from our marketplace`,
        products: products.map((p: any) => ({
          id: p.id,
          variant_id: p.variants?.[0]?.id || "",
          title: p.title,
          description: p.description?.substring(0, 150),
          price: p.variants?.[0]?.calculated_price?.calculated_amount || 0,
          currency: p.variants?.[0]?.calculated_price?.currency_code || "KES",
          thumbnail: p.thumbnail || (p.images?.[0]?.url || ""),
          handle: p.handle,
        }))
      })
    } catch (error) {
      console.error("List products error:", error)
      return JSON.stringify({ 
        error: "Error listing products",
        message: "I couldn't load the products. Please try again.",
        products: []
      })
    }
  },
})

export const tools = [searchProductsTool, getCategoriesTool, listAllProductsTool]
