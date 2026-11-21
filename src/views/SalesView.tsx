import React, { useState, useEffect } from 'react';
import type { Sale } from '../types';
import SaleDetailModal from '../components/SaleDetailModal';
import './SalesView.css';

const SalesView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [detailSaleId, setDetailSaleId] = useState<number | null>(null);

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

  const getPaymentLabel = (paymentMethod: Sale['paymentMethod']) => {
    return paymentMethod === 'credit' ? 'DEBT' : paymentMethod.toUpperCase();
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Sales History</h2>
          <p>View all completed transactions — click a sale to see its items</p>
        </div>
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
                <th>Customer</th>
                <th>Payment Method</th>
                <th className="text-right">Total Amount</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr
                  key={sale.id}
                  className="sale-row"
                  tabIndex={0}
                  role="button"
                  title={`View sale #${sale.id}`}
                  onClick={() => setDetailSaleId(sale.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailSaleId(sale.id);
                    }
                  }}
                >
                  <td>#{sale.id}</td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td>{sale.customerId ? `Customer #${sale.customerId}` : 'Walk-in'}</td>
                  <td>
                    <span className={`payment-badge payment-${sale.paymentMethod}`}>
                      {getPaymentLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="text-right">Rs. {sale.totalAmount.toFixed(2)}</td>
                  <td className="sale-row-chevron" aria-hidden="true">›</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="empty-state">No sales recorded yet</div>
          )}
        </div>
      </div>

      <SaleDetailModal saleId={detailSaleId} onClose={() => setDetailSaleId(null)} />
    </div>
  );
};

export default SalesView;
