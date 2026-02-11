import React, { useState, useEffect } from 'react';
import type { Product, CreateProductInput } from '../types';
import './InventoryView.css';

const InventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductInput>({
    barcode: '',
    name: '',
    description: '',
    price: 0,
    stock: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await window.electronAPI.products.getAll();
    setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await window.electronAPI.products.update({
          id: editingProduct.id,
          ...formData
        });
      } else {
        await window.electronAPI.products.create(formData);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      alert('Error saving product: ' + error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await window.electronAPI.products.delete(id);
        loadProducts();
      } catch (error) {
        alert('Error deleting product: ' + error);
      }
    }
  };

  const handleStockAdjustment = async (product: Product, adjustment: number) => {
    const newStock = product.stock + adjustment;
    if (newStock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    try {
      await window.electronAPI.products.update({
        id: product.id,
        stock: newStock
      });
      loadProducts();
    } catch (error) {
      alert('Error updating stock: ' + error);
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      description: '',
      price: 0,
      stock: 0
    });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Inventory Management</h2>
          <p>Manage product stock levels and details</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>Rs. {product.price.toFixed(2)}</td>
                  <td>
                    <span className={`stock-badge ${product.stock < 10 ? 'stock-low' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleStockAdjustment(product, -1)}
                        title="Decrease stock"
                      >
                        -
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleStockAdjustment(product, 1)}
                        title="Increase stock"
                      >
                        +
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Barcode *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Price (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
