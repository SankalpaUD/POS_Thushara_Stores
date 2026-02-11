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

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

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

    const product = await window.electronAPI.products.getByBarcode(barcode);
    if (product) {
      addToCart(product);
      setBarcode('');
    } else {
      alert('Product not found');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
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
      alert('Cart is empty');
      return;
    }

    // Check credit limit if credit payment
    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        alert('Please select a customer for credit payment');
        return;
      }

      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        const newBalance = customer.balance + calculateTotal();
        if (newBalance > customer.creditLimit) {
          alert(`Credit limit exceeded. Available credit: ${(customer.creditLimit - customer.balance).toFixed(2)}`);
          return;
        }
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

      alert('Sale completed successfully!');
      setCart([]);
      setSelectedCustomer(undefined);
      setPaymentMethod('cash');
      loadProducts(); // Reload to get updated stock
      loadCustomers(); // Reload to get updated balances
    } catch (error) {
      alert('Error completing sale: ' + error);
    }
  };

  const clearCart = () => {
    if (confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Point of Sale</h2>
        <p>Scan or search products to add to cart</p>
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
                      {customer.name} (Balance: Rs. {customer.balance.toFixed(2)})
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
                  <option value="credit">Credit</option>
                </select>
              </div>

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
