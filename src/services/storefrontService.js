import { GraphQLClient } from 'graphql-request';

/**
 * Create a GraphQL client for the Shopify Storefront API
 * @returns {GraphQLClient} The GraphQL client
 */
export const createStorefrontClient = () => {
  // Check for API key in window first (for browser environments), then try process.env (for Node environments)
  const accessToken = window.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
                     (typeof process !== 'undefined' && process.env ? process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN : '') || '';

  const shopUrl = window.SHOPIFY_STORE_URL ||
                 (typeof process !== 'undefined' && process.env ? process.env.SHOPIFY_STORE_URL : '') || '';

  if (!accessToken || !shopUrl) {
    console.error('Missing Shopify Storefront API credentials');
    return null;
  }

  const endpoint = `https://${shopUrl}/api/2023-07/graphql.json`;

  const client = new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Storefront-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  return client;
};

/**
 * Search for products in the store
 * @param {string} query - Search query
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} Products matching the query
 */
export const searchProducts = async (query, limit = 10) => {
  const client = createStorefrontClient();

  if (!client) {
    return { products: [] };
  }

  const searchQuery = `
    query GetProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            description
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(searchQuery, {
      query,
      first: limit,
    });

    // Transform the response data for easier consumption
    const products = data.products.edges.map((edge) => {
      const product = edge.node;
      const firstImage = product.images.edges[0]?.node || null;
      const firstVariant = product.variants.edges[0]?.node || null;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        price: firstVariant?.price.amount || product.priceRange.minVariantPrice.amount,
        currencyCode: firstVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode,
        imageUrl: firstImage?.url || '',
        imageAlt: firstImage?.altText || product.title,
        variantId: firstVariant?.id || '',
        availableForSale: firstVariant?.availableForSale || false,
      };
    });

    return { products };
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], error: error.message };
  }
};

/**
 * Create a new cart
 * @returns {Promise<Object>} The new cart
 */
export const createCart = async () => {
  const client = createStorefrontClient();

  if (!client) {
    return { cart: null, error: 'Storefront client not available' };
  }

  const cartCreateMutation = `
    mutation CartCreate {
      cartCreate {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  try {
    const data = await client.request(cartCreateMutation);
    return { cart: data.cartCreate.cart };
  } catch (error) {
    console.error('Error creating cart:', error);
    return { cart: null, error: error.message };
  }
};

/**
 * Add items to a cart
 * @param {string} cartId - Cart ID
 * @param {Array} lines - Cart line items to add
 * @returns {Promise<Object>} The updated cart
 */
export const addToCart = async (cartId, lines) => {
  const client = createStorefrontClient();

  if (!client) {
    return { cart: null, error: 'Storefront client not available' };
  }

  const addLinesMutation = `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
          estimatedCost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(addLinesMutation, {
      cartId,
      lines,
    });

    return { cart: data.cartLinesAdd.cart };
  } catch (error) {
    console.error('Error adding items to cart:', error);
    return { cart: null, error: error.message };
  }
};

/**
 * Get cart details
 * @param {string} cartId - Cart ID
 * @returns {Promise<Object>} The cart details
 */
export const getCart = async (cartId) => {
  const client = createStorefrontClient();

  if (!client) {
    return { cart: null, error: 'Storefront client not available' };
  }

  const cartQuery = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        estimatedCost {
          totalAmount {
            amount
            currencyCode
          }
        }
        checkoutUrl
      }
    }
  `;

  try {
    const data = await client.request(cartQuery, { cartId });
    return { cart: data.cart };
  } catch (error) {
    console.error('Error getting cart details:', error);
    return { cart: null, error: error.message };
  }
};
