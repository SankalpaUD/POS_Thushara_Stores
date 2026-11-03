import React, { useState, useEffect } from 'react';
import type { Customer, CustomerDebtBill, CreateCustomerInput, UpdateCustomerInput } from '../types';
import './CustomersView.css';

const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [debtBills, setDebtBills] = useState<CustomerDebtBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerInput & { balance: number }>({
    name: '',
    phone: '',
    email: '',
    balance: 0,
    debtDueDate: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await window.electronAPI.customers.getAll();
    setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const updatePayload: UpdateCustomerInput = {
          id: editingCustomer.id,
          ...formData
        };
        await window.electronAPI.customers.update(updatePayload);
      } else {
        await window.electronAPI.customers.create(formData);
      }

      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      alert('Error saving customer: ' + error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      balance: customer.balance,
      debtDueDate: customer.debtDueDate || ''
    });
    setShowModal(true);
  };

  const handleViewBills = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDebtBills([]);
    setLoadingBills(true);
    setShowBillsModal(true);

    try {
      const bills = await window.electronAPI.customers.getDebtBills(customer.id);
      setDebtBills(bills);
    } catch (error) {
      alert('Error loading debt bills: ' + error);
      setShowBillsModal(false);
    } finally {
      setLoadingBills(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      balance: 0,
      debtDueDate: ''
    });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(`${dateString}T00:00:00`).toLocaleDateString();
  };

  const closeBillsModal = () => {
    setShowBillsModal(false);
    setSelectedCustomer(null);
    setDebtBills([]);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Customer Management</h2>
          <p>Manage customer details, debt amounts, and payment dates</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Customer
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Debt</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td>
                    <span className={customer.balance > 0 ? 'text-danger' : ''}>
                      Rs. {customer.balance.toFixed(2)}
                    </span>
                  </td>
                  <td>{formatDueDate(customer.debtDueDate)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewBills(customer)}
                      >
                        Bills
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="empty-state">No customers added yet</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Debt (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Debt Payment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.debtDueDate || ''}
                    onChange={(e) => setFormData({ ...formData, debtDueDate: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillsModal && selectedCustomer && (
        <div className="modal-overlay" onClick={closeBillsModal}>
          <div className="modal debt-bills-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedCustomer.name} Debt Bills</h3>
                <p className="modal-subtitle">
                  Current debt: Rs. {selectedCustomer.balance.toFixed(2)} | Payment date: {formatDueDate(selectedCustomer.debtDueDate)}
                </p>
              </div>
              <button className="modal-close" onClick={closeBillsModal}>
                x
              </button>
            </div>

            <div className="modal-body">
              {loadingBills ? (
                <div className="empty-state">Loading debt bills...</div>
              ) : debtBills.length === 0 ? (
                <div className="empty-state">No debt bills for this customer</div>
              ) : (
                <div className="debt-bills-list">
                  {debtBills.map((bill) => (
                    <div className="debt-bill" key={bill.id}>
                      <div className="debt-bill-header">
                        <div>
                          <strong>Bill #{bill.id}</strong>
                          <div className="debt-bill-date">{formatDate(bill.createdAt)}</div>
                        </div>
                        <strong>Rs. {bill.totalAmount.toFixed(2)}</strong>
                      </div>

                      <div className="table-container">
                        <table className="table debt-bill-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Barcode</th>
                              <th className="text-right">Qty</th>
                              <th className="text-right">Price</th>
                              <th className="text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bill.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.productName}</td>
                                <td>{item.productBarcode}</td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                                <td className="text-right">Rs. {item.subtotal.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeBillsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
