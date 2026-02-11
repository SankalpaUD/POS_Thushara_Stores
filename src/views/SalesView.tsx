import React, { useState, useEffect } from 'react';
import type { Sale } from '../types';
import './SalesView.css';

const SalesView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const data = await window.electronAPI.sales.getAll();
    setSales(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Sales History</h2>
        <p>View all completed transactions</p>
      </div>

      <div className="grid grid-3 mb-2">
        <div className="card">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value">{sales.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">Rs. {getTotalRevenue().toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Average Sale</div>
          <div className="stat-value">
            Rs. {sales.length > 0 ? (getTotalRevenue() / sales.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Customer ID</th>
                <th>Payment Method</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td>{sale.customerId || 'Walk-in'}</td>
                  <td>
                    <span className={`payment-badge payment-${sale.paymentMethod}`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">Rs. {sale.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="empty-state">No sales recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesView;
