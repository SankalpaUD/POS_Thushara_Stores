import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../types';
import SaleDetailModal from '../components/SaleDetailModal';
import './DashboardView.css';

const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailSaleId, setDetailSaleId] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await window.electronAPI.dashboard.get();
      setData(summary);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const closeSaleDetail = useCallback(() => setDetailSaleId(null), []);

  const money = (value: number) => `Rs. ${value.toFixed(2)}`;

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(`${dateString}T00:00:00`).toLocaleDateString();
  };

  const isOverdue = (dateString?: string | null) => {
    if (!dateString) return false;
    const due = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return due < todayStart;
  };

  const revenueDelta = data && data.yesterday.revenue > 0
    ? ((data.today.revenue - data.yesterday.revenue) / data.yesterday.revenue) * 100
    : null;

  const deltaClass = revenueDelta === null
    ? 'dash-delta dash-delta-flat'
    : revenueDelta > 0
      ? 'dash-delta dash-delta-up'
      : revenueDelta < 0
        ? 'dash-delta dash-delta-down'
        : 'dash-delta dash-delta-flat';

  const getPaymentLabel = (paymentMethod: 'cash' | 'credit' | 'card') => {
    return paymentMethod === 'credit' ? 'DEBT' : paymentMethod.toUpperCase();
  };

  return (
    <div className="view-container">
      <div className="view-header dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Today's trading, money owed, and stock at a glance</p>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboard} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="dashboard-error">Could not load dashboard: {error}</div>
      )}

      {!data ? (
        <div className="card">
          <div className="dashboard-empty">{loading ? 'Loading dashboard...' : 'No dashboard data available'}</div>
        </div>
      ) : (
        <>
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Today</h3>
              <span className="dashboard-section-note">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="dashboard-stat-grid">
              <div className="card dashboard-stat">
                <div className="stat-label">Revenue</div>
                <div className="stat-value">{money(data.today.revenue)}</div>
                {revenueDelta === null ? (
                  <div className="dash-delta dash-delta-flat">No sales yesterday</div>
                ) : (
                  <div className={deltaClass}>
                    {revenueDelta >= 0 ? '▲' : '▼'} {Math.abs(revenueDelta).toFixed(1)}% vs yesterday
                  </div>
                )}
              </div>

              <div className="card dashboard-stat">
                <div className="stat-label">Sales</div>
                <div className="stat-value">{data.today.salesCount}</div>
                <div className="dash-sub">{data.yesterday.salesCount} yesterday</div>
              </div>

              <div className="card dashboard-stat">
                <div className="stat-label">Cash</div>
                <div className="stat-value">{money(data.today.cash)}</div>
                <div className="dash-sub">Collected</div>
              </div>

              <div className="card dashboard-stat">
                <div className="stat-label">Card</div>
                <div className="stat-value">{money(data.today.card)}</div>
                <div className="dash-sub">Collected</div>
              </div>

              <div className="card dashboard-stat">
                <div className="stat-label">Credit</div>
                <div className="stat-value">{money(data.today.credit)}</div>
                <div className="dash-sub">Added to debt</div>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Money you're owed</h3>
              <Link to="/customers" className="dashboard-link">Manage customers →</Link>
            </div>

            <div className="dashboard-stat-grid dashboard-stat-grid-3">
              <div className="card dashboard-stat">
                <div className="stat-label">Outstanding Debt</div>
                <div className="stat-value">{money(data.debt.outstanding)}</div>
                <div className="dash-sub">{data.debt.customersWithDebt} customers with debt</div>
              </div>

              <div className="card dashboard-stat">
                <div className="stat-label">Overdue</div>
                <div className="stat-value stat-danger">{money(data.debt.overdueAmount)}</div>
                <div className="dash-sub">{data.debt.overdueCount} customers past due date</div>
              </div>
            </div>

            <div className="card dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Top debtors</h3>
              </div>

              {data.topDebtors.length === 0 ? (
                <div className="dashboard-empty">Nobody owes money right now 🎉</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Payment Date</th>
                        <th className="text-right">Debt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topDebtors.map(debtor => (
                        <tr key={debtor.id}>
                          <td>{debtor.name}</td>
                          <td>{debtor.phone || '—'}</td>
                          <td>
                            <span className={isOverdue(debtor.debtDueDate) ? 'text-danger' : ''}>
                              {formatDueDate(debtor.debtDueDate)}
                            </span>
                          </td>
                          <td className="text-right">{money(debtor.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Stock</h3>
              <Link to="/inventory" className="dashboard-link">Manage inventory →</Link>
            </div>

            <div className="dashboard-stat-grid dashboard-stat-grid-2">
              <div className="card dashboard-stat">
                <div className="stat-label">Low Stock</div>
                <div className="stat-value">{data.stock.lowStockCount}</div>
                <div className="dash-sub">Fewer than 10 units left</div>
              </div>
              <div className="card dashboard-stat">
                <div className="stat-label">Out of Stock</div>
                <div className="stat-value">{data.stock.outOfStockCount}</div>
                <div className="dash-sub">Needs restocking</div>
              </div>
            </div>

            <div className="dashboard-split">
              <div className="card dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Low stock products</h3>
                </div>

                {data.stock.lowStock.length === 0 ? (
                  <div className="dashboard-empty">All products are well stocked</div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Barcode</th>
                          <th className="text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stock.lowStock.map(product => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.barcode}</td>
                            <td className="text-right">
                              <span className="stock-badge stock-low">{product.stock}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Top sellers today</h3>
                </div>

                {data.topProducts.length === 0 ? (
                  <div className="dashboard-empty">No sales recorded today</div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-right">Qty Sold</th>
                          <th className="text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topProducts.map(product => (
                          <tr key={product.productId}>
                            <td>{product.productName}</td>
                            <td className="text-right">{product.quantity}</td>
                            <td className="text-right">{money(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3>Recent sales</h3>
              <Link to="/sales" className="dashboard-link">View all sales →</Link>
            </div>

            <div className="card dashboard-card">
              {data.recentSales.length === 0 ? (
                <div className="dashboard-empty">No sales recorded yet</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date & Time</th>
                        <th>Customer</th>
                        <th>Payment</th>
                        <th className="text-right">Total</th>
                        <th aria-hidden="true"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSales.map(sale => (
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
                          <td>{formatTime(sale.createdAt)}</td>
                          <td>{sale.customerName ?? 'Walk-in'}</td>
                          <td>
                            <span className={`payment-badge payment-${sale.paymentMethod}`}>
                              {getPaymentLabel(sale.paymentMethod)}
                            </span>
                          </td>
                          <td className="text-right">{money(sale.totalAmount)}</td>
                          <td className="sale-row-chevron" aria-hidden="true">›</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <SaleDetailModal saleId={detailSaleId} onClose={closeSaleDetail} />
    </div>
  );
};

export default DashboardView;
