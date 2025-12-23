"use server"

import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { sdk } from "../config"

export const retrieveCollection = async (id: string) => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next,
        cache: "force-cache",
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  const result = await sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: queryParams,
        next,
        cache: "no-store",
      }
    )
    .then(({ collections }) => {
      // Sort collections by rank (lower rank = higher priority) or created_at as fallback
      const sortedCollections = collections.sort((a, b) => {
        const aRank = (a as any).rank;
        const bRank = (b as any).rank;
        
        // If both have rank, sort by rank
        if (aRank !== undefined && bRank !== undefined) {
          return aRank - bRank;
        }
        // If only one has rank, prioritize it
        if (aRank !== undefined) return -1;
        if (bRank !== undefined) return 1;
        // Fallback to alphabetical by title
        return (a.title || '').localeCompare(b.title || '');
      });
      
      return { collections: sortedCollections, count: sortedCollections.length };
    })

  console.log('=== COLLECTIONS DEBUG ===');
  console.log('Total collections fetched:', result.collections.length);
  console.log('Collections:', result.collections.map(c => ({ id: c.id, title: c.title, handle: c.handle, rank: (c as any).rank })));
  console.log('Query params used:', queryParams);
  console.log('=== END COLLECTIONS DEBUG ===');

  return result
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
      next,
      cache: "force-cache",
    })
    .then(({ collections }) => collections[0])
}
