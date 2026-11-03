import React, { useState, useEffect } from 'react';
import type { Product, Customer, CartItem } from '../types';
import './POSView.css';

const POSView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'card'>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        handleCheckout();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        clearCart();
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault();
        const product = products.find(p => p.barcode === barcodeBuffer);
        if (product) {
          addToCart(product);
          showToast(`Added ${product.name}`, 'success');
        } else {
          showToast(`Product not found: ${barcodeBuffer}`, 'error');
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, paymentMethod, customers, products]);

  const loadProducts = async () => {
    const data = await window.electronAPI.products.getAll();
    setProducts(data);
  };

  const loadCustomers = async () => {
    const data = await window.electronAPI.customers.getAll();
    setCustomers(data);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = products.find(p => p.barcode === barcode.trim());
    if (product) {
      addToCart(product);
      setBarcode('');
      showToast(`Added ${product.name}`, 'success');
    } else {
      showToast('Product not found', 'error');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    // Debt sales must be assigned to a customer so the bill can be tracked.
    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        showToast('Please select a customer for debt payment', 'error');
        return;
      }

      const customer = customers.find(c => c.id === selectedCustomer);
      if (!customer?.debtDueDate) {
        showToast('Please set the customer debt payment date before saving a debt sale', 'error');
        return;
      }
    }

    try {
      await window.electronAPI.sales.create({
        customerId: selectedCustomer,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price
        })),
        paymentMethod
      });

      showToast('Sale completed successfully!', 'success');
      setCart([]);
      setSelectedCustomer(undefined);
      setPaymentMethod('cash');
      loadProducts(); // Reload to get updated stock
      loadCustomers(); // Reload to get updated balances
    } catch (error) {
      showToast('Error completing sale: ' + error, 'error');
    }
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  const selectedCustomerDetails = selectedCustomer
    ? customers.find(customer => customer.id === selectedCustomer)
    : undefined;
  const currentDebt = selectedCustomerDetails?.balance ?? 0;
  const newDebt = paymentMethod === 'credit'
    ? currentDebt + calculateTotal()
    : currentDebt;

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(`${dateString}T00:00:00`).toLocaleDateString();
  };

  return (
    <div className="view-container">
      {toastMessage && (
        <div className={`toast-notification toast-${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}

      <div className="view-header">
        <h2>Point of Sale</h2>
        <p>Scan or search products to add to cart</p>
        <div className="keyboard-shortcuts-help">
          <span><span className="kbd">F12</span> Checkout</span>
          <span><span className="kbd">Esc</span> Clear Cart</span>
          <span>Scan barcode anytime to quick-add</span>
        </div>
      </div>

      <div className="pos-layout">
        <div className="pos-left">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Product Lookup</h3>
            </div>
            
            <form onSubmit={handleBarcodeSubmit} className="mb-2">
              <div className="form-group">
                <label className="form-label">Scan Barcode</label>
                <div className="barcode-input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter or scan barcode..."
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </div>
            </form>

            <div className="form-group">
              <label className="form-label">Search Products</label>
              <input
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or barcode..."
              />
            </div>

            {searchQuery.length === 0 ? (
              <div className="quick-add-section">
                <h4 className="section-subtitle">Quick Add Items</h4>
                <div className="quick-add-grid">
                  {products.slice(0, 12).map(product => (
                    <button
                      key={product.id}
                      className="quick-add-btn"
                      onClick={() => {
                        addToCart(product);
                        showToast(`Added ${product.name}`, 'success');
                      }}
                      disabled={product.stock === 0}
                    >
                      <span className="qa-name">{product.name}</span>
                      <span className="qa-price">Rs. {product.price.toFixed(2)}</span>
                      {product.stock === 0 && <span className="qa-stock-out">Out of Stock</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="product-list">
                {filteredProducts.map(product => (
                  <div key={product.id} className="product-item">
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-details">
                        {product.barcode} | Stock: {product.stock} | Rs. {product.price.toFixed(2)}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pos-right">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Cart</h3>
              <button className="btn btn-secondary btn-sm" onClick={clearCart}>
                Clear Cart
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">Cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">
                        Rs. {item.product.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                        className="quantity-input"
                      />
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="cart-item-total">
                      Rs. {(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-total">
              <strong>Total:</strong>
              <strong>Rs. {calculateTotal().toFixed(2)}</strong>
            </div>

            <div className="checkout-section">
              <div className="form-group">
                 <label className="form-label">Customer (Optional)</label>
                 <select
                   className="form-select"
                   value={selectedCustomer || ''}
                   onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value) : undefined)}
                 >
                   <option value="">Walk-in Customer</option>
                   {customers.map(customer => (
                     <option key={customer.id} value={customer.id}>
                       {customer.name} (Debt: Rs. {customer.balance.toFixed(2)})
                     </option>
                   ))}
                 </select>
               </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'credit' | 'card')}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="credit">Debt</option>
                </select>
              </div>

              {selectedCustomerDetails && (
                <div className="debt-summary">
                  <div className="debt-summary-row">
                    <span>Current Debt</span>
                    <strong>Rs. {currentDebt.toFixed(2)}</strong>
                  </div>
                  <div className="debt-summary-row">
                    <span>Payment Date</span>
                    <strong>{formatDueDate(selectedCustomerDetails.debtDueDate)}</strong>
                  </div>
                  {paymentMethod === 'credit' && (
                     <div className="debt-summary-row debt-summary-highlight">
                      <span>Debt After Sale</span>
                      <strong>Rs. {newDebt.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-success btn-block"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSView;
