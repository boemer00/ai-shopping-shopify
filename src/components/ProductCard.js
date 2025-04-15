import { formatPrice, truncateText } from '../utils/helpers';

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @param {Function} onAddToCart - Callback function when add to cart is clicked
 * @returns {HTMLElement} Product card element
 */
export const createProductCard = (product, onAddToCart) => {
  const {
    id,
    title,
    description,
    price,
    currencyCode = 'USD',
    imageUrl,
    imageAlt,
    availableForSale = true
  } = product;

  const productCard = document.createElement('div');
  productCard.className = 'product-card';
  productCard.dataset.productId = id;

  // Create image element
  const imageElement = document.createElement('img');
  imageElement.className = 'product-image';
  imageElement.src = imageUrl || 'https://via.placeholder.com/150';
  imageElement.alt = imageAlt || title;

  // Create product details container
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'product-details';

  // Add title
  const titleElement = document.createElement('div');
  titleElement.className = 'product-title';
  titleElement.textContent = title;

  // Add price
  const priceElement = document.createElement('div');
  priceElement.className = 'product-price';
  priceElement.textContent = formatPrice(price, currencyCode);

  // Add description if available
  let descriptionElement = null;
  if (description) {
    descriptionElement = document.createElement('div');
    descriptionElement.className = 'product-description';
    descriptionElement.textContent = truncateText(description, 80);
  }

  // Create add to cart button
  const addToCartButton = document.createElement('button');
  addToCartButton.className = 'add-to-cart-btn';
  addToCartButton.textContent = availableForSale ? 'Add to Cart' : 'Out of Stock';
  addToCartButton.disabled = !availableForSale;

  // Add event listener to button
  if (availableForSale && onAddToCart) {
    addToCartButton.addEventListener('click', () => {
      onAddToCart(product);
    });
  }

  // Assemble product card
  productCard.appendChild(imageElement);

  detailsContainer.appendChild(titleElement);
  detailsContainer.appendChild(priceElement);
  if (descriptionElement) {
    detailsContainer.appendChild(descriptionElement);
  }

  productCard.appendChild(detailsContainer);
  productCard.appendChild(addToCartButton);

  return productCard;
};
