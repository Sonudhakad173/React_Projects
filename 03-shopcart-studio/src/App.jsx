import React, { useEffect, useMemo, useState } from 'react';

const CART_KEY = 'shopcart-studio-cart';
const WISHLIST_KEY = 'shopcart-studio-wishlist';
const COUPON_KEY = 'shopcart-studio-coupon';

const COUPONS = {
  SAVE10: 0.1,
  WELCOME15: 0.15
};

const PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Aurora Wireless Headphones',
    category: 'Audio',
    price: 149,
    rating: 4.8,
    badge: 'Best Seller',
    mark: 'AH',
    summary: 'Noise cancelling headphones with all-day comfort and a premium sound profile.',
    accent: 'linear-gradient(135deg, #7c3aed, #22c55e)',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    rank: 5
  },
  {
    id: 'prod-2',
    name: 'Pixel Pro Keyboard',
    category: 'Workspace',
    price: 129,
    rating: 4.7,
    badge: 'Editor Pick',
    mark: 'KB',
    summary: 'Compact mechanical keyboard with hot-swappable switches and soft white backlight.',
    accent: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    rank: 4
  },
  {
    id: 'prod-3',
    name: 'Nova Smart Lamp',
    category: 'Home',
    price: 89,
    rating: 4.6,
    badge: 'Smart Home',
    mark: 'LM',
    summary: 'Color-tunable desk lamp with app controls and warm focus modes for late-night work.',
    accent: 'linear-gradient(135deg, #f97316, #f59e0b)',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
    rank: 3
  },
  {
    id: 'prod-4',
    name: 'Sprint Motion Watch',
    category: 'Fitness',
    price: 179,
    rating: 4.9,
    badge: 'Trending',
    mark: 'WT',
    summary: 'Track steps, heart rate, workouts, and sleep with a polished AMOLED display.',
    accent: 'linear-gradient(135deg, #10b981, #06b6d4)',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    rank: 6
  },
  {
    id: 'prod-5',
    name: 'Cloud Carry Backpack',
    category: 'Travel',
    price: 96,
    rating: 4.5,
    badge: 'Travel Gear',
    mark: 'BP',
    summary: 'Weather-resistant backpack with laptop sleeve, cable organizer, and secret pocket.',
    accent: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    rank: 2
  },
  {
    id: 'prod-6',
    name: 'Studio Capture Mic',
    category: 'Creator',
    price: 139,
    rating: 4.8,
    badge: 'Creator Tool',
    mark: 'MC',
    summary: 'USB microphone with crisp pickup, mute touch, and podcast-grade clarity.',
    accent: 'linear-gradient(135deg, #14b8a6, #0f172a)',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    rank: 7
  },
  {
    id: 'prod-7',
    name: 'Orbit Desk Mat',
    category: 'Workspace',
    price: 44,
    rating: 4.4,
    badge: 'New',
    mark: 'DM',
    summary: 'Soft desk mat with anti-slip backing and enough room for keyboard and mouse.',
    accent: 'linear-gradient(135deg, #6366f1, #f97316)',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    rank: 1
  },
  {
    id: 'prod-8',
    name: 'Trail Bottle Pro',
    category: 'Fitness',
    price: 32,
    rating: 4.3,
    badge: 'Daily Essential',
    mark: 'BT',
    summary: 'Insulated bottle that keeps drinks cold through commutes, gym sets, and desk hours.',
    accent: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    image: 'https://images.unsplash.com/photo-1526401485004-2fda9f6fce53?auto=format&fit=crop&w=1200&q=80',
    rank: 0
  }
];

const CATEGORY_OPTIONS = ['All', ...new Set(PRODUCTS.map((product) => product.category))];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'new', label: 'New arrivals' }
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function loadCart() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(CART_KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function loadWishlist() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(WISHLIST_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function loadCoupon() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(COUPON_KEY) ?? '';
}

function App() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [activeTab, setActiveTab] = useState('Cart');
  const [cart, setCart] = useState(loadCart);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(loadCoupon);
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    window.localStorage.setItem(COUPON_KEY, appliedCoupon);
  }, [appliedCoupon]);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    const filtered = PRODUCTS.filter((product) => {
      const searchableText = `${product.name} ${product.summary} ${product.category}`.toLowerCase();
      const matchesSearch = searchableText.includes(search);
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'price-low') {
        return left.price - right.price;
      }

      if (sortBy === 'price-high') {
        return right.price - left.price;
      }

      if (sortBy === 'rating') {
        return right.rating - left.rating;
      }

      if (sortBy === 'new') {
        return right.rank - left.rank;
      }

      return right.rank - left.rank;
    });
  }, [query, categoryFilter, sortBy]);

  const cartItems = useMemo(() => {
    return PRODUCTS.filter((product) => cart[product.id]).map((product) => ({
      ...product,
      quantity: cart[product.id]
    }));
  }, [cart]);

  const wishlistItems = useMemo(() => {
    return PRODUCTS.filter((product) => wishlist.includes(product.id));
  }, [wishlist]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = appliedCoupon ? subtotal * (COUPONS[appliedCoupon] || 0) : 0;
  const shipping = subtotal === 0 || subtotal >= 180 ? 0 : 12.99;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Number((taxableAmount * 0.08).toFixed(2));
  const grandTotal = Number((taxableAmount + shipping + tax).toFixed(2));

  function addToCart(productId) {
    setCart((currentCart) => ({
      ...currentCart,
      [productId]: (currentCart[productId] ?? 0) + 1
    }));
  }

  function updateQuantity(productId, change) {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[productId] ?? 0) + change;

      if (nextQuantity <= 0) {
        const nextCart = { ...currentCart };
        delete nextCart[productId];
        return nextCart;
      }

      return {
        ...currentCart,
        [productId]: nextQuantity
      };
    });
  }

  function toggleWishlist(productId) {
    setWishlist((currentWishlist) =>
      currentWishlist.includes(productId)
        ? currentWishlist.filter((id) => id !== productId)
        : [...currentWishlist, productId]
    );
  }

  function applyCoupon() {
    const normalized = couponCode.trim().toUpperCase();

    if (normalized in COUPONS) {
      setAppliedCoupon(normalized);
      setCouponMessage(`Coupon ${normalized} applied successfully.`);
    } else {
      setAppliedCoupon('');
      setCouponMessage('Coupon not recognized. Try SAVE10 or WELCOME15.');
    }
  }

  function clearCart() {
    setCart({});
  }

  return (
    <div className="shell shop-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Commerce case study</p>
          <h1>ShopCart Studio</h1>
          <p className="lede">A storefront experience with search, filters, saved items, coupon logic, and checkout calculations.</p>
        </div>

        <div className="hero-metrics">
          <div className="metric">
            <span>Products</span>
            <strong>{visibleProducts.length}</strong>
          </div>
          <div className="metric">
            <span>Cart items</span>
            <strong>{cartCount}</strong>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Cart total" value={formatCurrency(grandTotal)} tone="accent" />
        <StatCard label="Wishlist" value={wishlist.length} tone="success" />
        <StatCard label="Shipping" value={formatCurrency(shipping)} tone="warning" />
        <StatCard label="Coupon" value={appliedCoupon || 'None'} tone="neutral" />
      </section>

      <section className="market-layout">
        <main className="panel catalog-panel">
          <div className="panel__header catalog-header">
            <div>
              <p className="section-label">Browse products</p>
              <h2>Shop by category, rating, and price</h2>
            </div>
            <div className="filters">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel-tabs">
            {['Cart', 'Wishlist', 'Summary'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'tab tab--active' : 'tab'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <section className="product-grid">
            {visibleProducts.length > 0 ? (
              visibleProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);

                return (
                  <article key={product.id} className="product-card">
                    <div className="product-card__hero" style={{ background: product.accent }}>
                      <img className="product-card__image" src={product.image} alt={product.name} loading="lazy" />
                      <div className="product-card__hero-overlay">
                        <span className="product-card__emoji">{product.mark}</span>
                        <button
                          type="button"
                          className={`wishlist-toggle ${isWishlisted ? 'wishlist-toggle--active' : ''}`}
                          onClick={() => toggleWishlist(product.id)}
                        >
                          {isWishlisted ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div className="product-card__body">
                      <div className="product-card__meta">
                        <span>{product.category}</span>
                        <span>{product.badge}</span>
                      </div>

                      <h3>{product.name}</h3>
                      <p>{product.summary}</p>

                      <div className="rating-row">
                        <span>Rating {product.rating}</span>
                        <strong>{formatCurrency(product.price)}</strong>
                      </div>

                      <div className="product-card__actions">
                        <button type="button" className="primary-button" onClick={() => addToCart(product.id)}>
                          Add to cart
                        </button>
                        <button type="button" className="ghost-button" onClick={() => toggleWishlist(product.id)}>
                          {isWishlisted ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No products matched your filters.</p>
              </div>
            )}
          </section>
        </main>

        <aside className="panel checkout-panel">
          <div className="panel__header">
            <div>
              <p className="section-label">{activeTab}</p>
              <h2>{activeTab === 'Wishlist' ? 'Saved products' : activeTab === 'Summary' ? 'Checkout snapshot' : 'Your cart'}</h2>
            </div>
            <button type="button" className="text-button" onClick={clearCart}>
              Clear cart
            </button>
          </div>

          <div className="coupon-box">
            <div className="coupon-box__fields">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Try SAVE10 or WELCOME15"
              />
              <button type="button" className="primary-button" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            {couponMessage ? <p className="muted-copy">{couponMessage}</p> : <p className="muted-copy">Use a promo code to simulate checkout logic.</p>}
            {appliedCoupon ? (
              <button type="button" className="text-button" onClick={() => setAppliedCoupon('')}>
                Remove coupon
              </button>
            ) : null}
          </div>

          <section className="summary-card">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>- {formatCurrency(discount)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{formatCurrency(shipping)}</strong>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <strong>{formatCurrency(tax)}</strong>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </section>

          {activeTab === 'Wishlist' ? (
            <div className="side-list">
              {wishlistItems.length > 0 ? (
                wishlistItems.map((product) => (
                  <article key={product.id} className="mini-row">
                    <img className="mini-row__image" src={product.image} alt={product.name} loading="lazy" />
                    <div>
                      <strong>{product.name}</strong>
                      <p>
                        {product.category} - {formatCurrency(product.price)}
                      </p>
                    </div>
                    <button type="button" className="ghost-button" onClick={() => addToCart(product.id)}>
                      Add
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <p>No saved products yet.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'Summary' ? (
            <div className="side-list">
              <div className="mini-row mini-row--summary">
                <span>Cart items</span>
                <strong>{cartCount}</strong>
              </div>
              <div className="mini-row mini-row--summary">
                <span>Wishlisted</span>
                <strong>{wishlist.length}</strong>
              </div>
              <div className="mini-row mini-row--summary">
                <span>Free shipping threshold</span>
                <strong>{formatCurrency(180)}</strong>
              </div>
              <p className="muted-copy">
                This panel is ideal for talking about derived state, coupon logic, and checkout math in interviews.
              </p>
            </div>
          ) : (
            <div className="side-list">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <article key={item.id} className="cart-row">
                    <img className="cart-row__image" src={item.image} alt={item.name} loading="lazy" />
                    <div className="cart-row__info">
                      <strong>{item.name}</strong>
                      <p>
                        {formatCurrency(item.price)} - Qty {item.quantity}
                      </p>
                    </div>
                    <div className="qty-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                        +
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <p>Your cart is empty. Add a product from the catalog.</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default App;
