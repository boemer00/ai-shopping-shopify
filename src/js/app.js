// DOM Elements (initialized to null, will be set when DOM is fully loaded)
let searchForm = null;
let searchInput = null;
let resultsContainer = null;
let searchSuggestions = null;

// Sample product data (in a real app, this would come from an API)
const products = [
  {
    id: 1,
    name: 'Wireless Noise-Cancelling Headphones',
    price: 249.99,
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&w=500',
    link: '#product-1'
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    price: 199.99,
    description: 'Track your workouts, heart rate, sleep, and more with this advanced fitness tracker. Water-resistant and week-long battery life.',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&w=500',
    link: '#product-2'
  },
  {
    id: 3,
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    description: 'Soft, comfortable t-shirt made from 100% organic cotton. Available in multiple colors and sizes.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&w=500',
    link: '#product-3'
  },
  {
    id: 4,
    name: 'Professional Blender',
    price: 129.99,
    description: 'High-performance blender with multiple speed settings. Perfect for smoothies, soups, and more.',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&w=500',
    link: '#product-4'
  },
  {
    id: 5,
    name: 'Leather Wallet',
    price: 49.99,
    description: 'Genuine leather wallet with multiple card slots and RFID blocking technology.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&w=500',
    link: '#product-5'
  },
  {
    id: 6,
    name: 'Digital Camera',
    price: 699.99,
    description: '24MP digital camera with 4K video recording capability and interchangeable lenses.',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&w=500',
    link: '#product-6'
  }
];

// Initialize the app
function init() {
  try {
    console.log('app.js init called');

    // Get references to DOM elements - using the correct IDs from the HTML
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-input');
    resultsContainer = document.getElementById('results-container');
    searchSuggestions = document.querySelectorAll('.search-suggestions span');

    console.log('Elements found:', {
      searchForm: !!searchForm,
      searchInput: !!searchInput,
      resultsContainer: !!resultsContainer,
      searchSuggestions: searchSuggestions ? searchSuggestions.length : 0
    });

    // Exit if elements aren't found
    if (!searchForm || !searchInput || !resultsContainer) {
      console.error('Required elements not found in app.js - skipping search form initialization');
      return;
    }

    // Add event listener to the search form
    try {
      searchForm.addEventListener('submit', handleSearch);
      console.log('Added submit listener to search form');
    } catch (error) {
      console.error('Error adding submit listener to search form:', error);
    }

    // Add event listeners to search suggestions
    if (searchSuggestions && searchSuggestions.length > 0) {
      try {
        searchSuggestions.forEach(suggestion => {
          suggestion.addEventListener('click', () => {
            searchInput.value = suggestion.textContent;
            searchForm.dispatchEvent(new Event('submit'));
          });
        });
        console.log('Added click listeners to search suggestions');
      } catch (error) {
        console.error('Error adding click listeners to search suggestions:', error);
      }
    }

    console.log('Search form initialization completed successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
}

// Handle search form submission
function handleSearch(event) {
  event.preventDefault();

  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    showMessage('Please enter a search term');
    return;
  }

  // Show loading indicator
  showLoading();

  // Simulate API request delay
  setTimeout(() => {
    const results = searchProducts(searchTerm);
    displayResults(results, searchTerm);
  }, 800);
}

// Search products based on search term
function searchProducts(searchTerm) {
  return products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  });
}

// Display search results
function displayResults(results, searchTerm) {
  // Clear previous results
  resultsContainer.innerHTML = '';

  if (results.length === 0) {
    showNoResults(searchTerm);
    return;
  }

  // Create product grid
  const productGrid = document.createElement('div');
  productGrid.className = 'product-grid';

  // Add each product to the grid
  results.forEach(product => {
    const productCard = createProductCard(product);
    productGrid.appendChild(productCard);
  });

  resultsContainer.appendChild(productGrid);
}

// Create a product card element
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image">
    <div class="product-details">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-price">$${product.price.toFixed(2)}</p>
      <p class="product-description">${product.description}</p>
      <a href="${product.link}" class="product-link">View Product</a>
    </div>
  `;

  return card;
}

// Show loading indicator
function showLoading() {
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="loading">Searching for products...</div>';
  }
}

// Show message when no search term is entered
function showMessage(message) {
  if (resultsContainer) {
    resultsContainer.innerHTML = `<div class="initial-message">${message}</div>`;
  }
}

// Show no results message
function showNoResults(searchTerm) {
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No products found matching "${searchTerm}"</p>
        <p>Try different keywords or browse our featured products.</p>
      </div>
    `;
  }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing app with small delay');
  setTimeout(init, 100);
});

// Add a second event listener for window.load to handle cases where DOMContentLoaded might have fired already
window.addEventListener('load', () => {
  console.log('Window loaded, initializing app if not already initialized');
  if (!searchForm) {
    console.log('SearchForm not initialized yet, running init again');
    setTimeout(init, 100);
  }
});
