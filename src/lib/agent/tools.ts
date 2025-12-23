import { z } from "zod"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { sdk } from "@/lib/config"

// Direct fetch to search products - more reliable than SDK
async function fetchProducts(query?: string, limit = 20) {
  const baseUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  
  const params = new URLSearchParams()
  if (query) params.append('q', query)
  params.append('limit', String(limit))
  params.append('fields', '*variants,*variants.calculated_price,*images,*thumbnail')
  
  const url = `${baseUrl}/store/products?${params.toString()}`
  console.log("Fetching products from:", url)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': apiKey || '',
    },
    cache: 'no-store',
  })
  
  if (!response.ok) {
    console.error("Product fetch failed:", response.status, response.statusText)
    return []
  }
  
  const data = await response.json()
  return data.products || []
}

// Tool to search products in the marketplace
export const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: "Search for products in the marketplace based on a query. Use this when user asks for specific items like houses, cars, electronics, bags, apartments, properties, locations like Kilimani, Lavington, Kileleshwa, etc.",
  schema: z.object({
    query: z.string().describe("The search query, e.g. 'houses', 'cars', 'bags', 'Kilimani', 'Lavington', 'Kileleshwa'"),
    limit: z.number().optional().describe("Number of results to return, default 20"),
  }),
  func: async ({ query, limit = 20 }) => {
    try {
      console.log("=== AI SEARCH ===")
      console.log("Searching for:", query)
      
      // Use direct fetch for reliability
      let products = await fetchProducts(query, limit)
      console.log("Search results for query:", query, "->", products.length, "products")
      
      // If no results, get all products and filter manually
      if (products.length === 0) {
        console.log("No results with q parameter, fetching all products to filter manually...")
        const allProducts = await fetchProducts(undefined, 100)
        const queryLower = query.toLowerCase()
        
        // Filter products that match title, description, or handle
        const queryTerms = queryLower.split(' ').filter(term => term.length > 2) // Ignore short words
        
        products = allProducts.filter((p: any) => {
          const title = (p.title || "").toLowerCase()
          const description = (p.description || "").toLowerCase()
          const handle = (p.handle || "").toLowerCase()
          const searchableText = `${title} ${description} ${handle}`
          
          // Check if ALL significant terms are present in the product text
          // This allows "grey pants" to match "Grey Sweat Pants"
          return queryTerms.every(term => searchableText.includes(term))
        })
        
        console.log(`Manual filter found ${products.length} products matching terms: ${queryTerms.join(', ')}`)
      }

      if (products.length === 0) {
        return JSON.stringify({
          message: `No products found for "${query}". Try a different search term like 'houses', 'apartments', or browse categories.`,
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
        console.log("Product found:", product.title, "- Price:", product.price, product.currency)
        return product
      })

      console.log("=== END AI SEARCH ===")

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
