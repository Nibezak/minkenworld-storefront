'use server';

import { HttpTypes } from '@medusajs/types';

import { sortProducts } from '@/lib/helpers/sort-products';
import { SortOptions } from '@/types/product';
import { SellerProps } from '@/types/seller';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';
import { getRegion, retrieveRegion } from './regions';

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
  forceCache = false
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & {
      handle?: string[];
    };
  category_id?: string;
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
  forceCache?: boolean;
}): Promise<{
  response: {
    products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
    count: number;
  };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  console.log("=== LIST PRODUCTS CALLED ===");
  console.log("Parameters:", { pageParam, category_id, collection_id, countryCode, regionId, limit: queryParams?.limit });
  
  if (!countryCode && !regionId) {
    console.log("ERROR: No country code or region ID provided!");
    throw new Error('Country code or region ID is required');
  }

  const limit = queryParams?.limit || 12;
  const _pageParam = Math.max(pageParam, 1);
  const offset = (_pageParam - 1) * limit;

  let region: HttpTypes.StoreRegion | undefined | null;

  if (countryCode) {
    console.log("Fetching region for country code:", countryCode);
    region = await getRegion(countryCode);
  } else {
    console.log("Fetching region by ID:", regionId);
    region = await retrieveRegion(regionId!);
  }

  if (!region) {
    console.log("WARNING: No region found for country code:", countryCode, "- continuing without region filter");
    // Continue without region filter instead of returning empty
  } else {
    console.log("Region found:", region.id, region.name);
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  console.log("=== CONNECTIVITY TEST ===");
  console.log("Backend URL:", process.env.MEDUSA_BACKEND_URL);
  console.log("Publishable Key:", process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ? "SET" : "MISSING");
  console.log("Country code:", countryCode);
  console.log("Region:", region);
  console.log("All env vars:", Object.keys(process.env).filter(k => k.includes('MEDUSA') || k.includes('NEXT_PUBLIC')));
  console.log("=== END CONNECTIVITY TEST ===");

  // Force no-cache to debug product fetching issues
  const useCached = false; // Disabled cache for debugging

  return sdk.client
    .fetch<{
      products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
      count: number;
    }>(`/store/products`, {
      method: 'GET',
      query: {
        country_code: countryCode,
        category_id,
        collection_id,
        limit,
        offset,
        region_id: region?.id,
        fields:
          '*variants.calculated_price,*seller,*variants,*seller.products,' +
          '*seller.reviews,*seller.reviews.customer,*seller.reviews.seller,*seller.products.variants,' +
          '*attribute_values,*attribute_values.attribute,*images,*thumbnail,*variants.images',
        ...queryParams
      },
      headers,
      cache: 'no-store' // Force fresh data
    })
    .then(({ products: productsRaw, count }) => {
      // Minimal logging - just counts
      if (productsRaw?.length > 0) {
        console.log(`Products fetched: ${productsRaw.length}, count: ${count}`);
      }
      
      if (!productsRaw || productsRaw.length === 0) {
        return {
          response: { products: [], count: 0 },
          nextPage: null,
          queryParams
        };
      }
      
      const nextPage = count > offset + limit ? pageParam + 1 : null;

      return {
        response: {
          products: productsRaw,
          count
        },
        nextPage: nextPage,
        queryParams
      };
    })
    .catch((error) => {
      console.error("=== PRODUCT FETCH ERROR ===");
      console.error("Error:", error);
      console.error("=== END ERROR ===");
      return {
        response: {
          products: [],
          count: 0
        },
        nextPage: 0,
        queryParams
      };
    });
};

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
  category_id,
  seller_id,
  collection_id
}: {
  page?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  sortBy?: SortOptions;
  countryCode: string;
  category_id?: string;
  seller_id?: string;
  collection_id?: string;
}): Promise<{
  response: {
    products: HttpTypes.StoreProduct[];
    count: number;
  };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  const limit = queryParams?.limit || 12;

  const {
    response: { products, count }
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
      fields: '*variants.calculated_price,*seller,*variants,*images,*thumbnail,*variants.images'
    },
    category_id,
    collection_id,
    countryCode
  });

  console.log("=== SORTED PRODUCTS DEBUG ===");
  console.log("Products from listProducts:", products.length);
  console.log("Seller ID filter (looking for):", seller_id);
  console.log("First product seller:", products[0]?.seller);
  console.log("First product seller ID:", products[0]?.seller?.id);
  console.log("First product thumbnail:", products[0]?.thumbnail);
  console.log("First product images:", products[0]?.images);

  const filteredProducts = seller_id
    ? products.filter(product => {
        const matches = product.seller?.id === seller_id;
        if (!matches && product.seller) {
          console.log(`Product "${product.title}" seller ID "${product.seller.id}" does NOT match "${seller_id}"`);
        }
        return matches;
      })
    : products;

  console.log("After seller filter:", filteredProducts.length);
  if (filteredProducts.length > 0) {
    console.log("Filtered products:", filteredProducts.map(p => ({ title: p.title, seller_id: p.seller?.id })));
  }

  const sortedProducts = sortProducts(filteredProducts, sortBy);
  console.log("After sorting:", sortedProducts.length);

  const pageParam = (page - 1) * limit;

  const nextPage = count > pageParam + limit ? pageParam + limit : null;

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit);
  console.log("Final paginated products:", paginatedProducts.length);
  console.log("Final product thumbnail:", paginatedProducts[0]?.thumbnail);
  console.log("=== END SORTED DEBUG ===");

  return {
    response: {
      products: paginatedProducts,
      count
    },
    nextPage,
    queryParams
  };
};
