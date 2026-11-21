import React, { useEffect, useState } from 'react';
import type { SaleDetail } from '../types';
import './SaleDetailModal.css';

interface SaleDetailModalProps {
  saleId: number | null;
  onClose: () => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ saleId, onClose }) => {
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saleId === null) {
      setSaleDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setSaleDetail(null);
    setError(null);
    setLoading(true);

    window.electronAPI.sales
      .getDetail(saleId)
      .then((detail) => {
        if (!cancelled) {
          setSaleDetail(detail);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [saleId]);

  useEffect(() => {
    if (saleId === null) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saleId, onClose]);

  if (saleId === null) {
    return null;
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const getPaymentLabel = (paymentMethod: SaleDetail['paymentMethod']) => {
    return paymentMethod === 'credit' ? 'DEBT' : paymentMethod.toUpperCase();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal sale-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Sale #${saleId} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>Sale #{saleId}</h3>
            {saleDetail && (
              <p className="modal-subtitle">
                {formatDate(saleDetail.createdAt)}
                {' · '}
                {saleDetail.customerName ?? 'Walk-in Customer'}
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close sale details">
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="sale-detail-empty">Loading sale details...</div>
          ) : error ? (
            <div className="sale-detail-empty">Could not load sale: {error}</div>
          ) : !saleDetail ? (
            <div className="sale-detail-empty">Sale not found</div>
          ) : (
            <>
              <div className="sale-detail-summary">
                <div className="sale-detail-summary-item">
                  <span className="sale-detail-label">Payment</span>
                  <span className={`payment-badge payment-${saleDetail.paymentMethod}`}>
                    {getPaymentLabel(saleDetail.paymentMethod)}
                  </span>
                </div>
                <div className="sale-detail-summary-item">
                  <span className="sale-detail-label">Customer</span>
                  <strong>{saleDetail.customerName ?? 'Walk-in'}</strong>
                </div>
                {saleDetail.customerPhone && (
                  <div className="sale-detail-summary-item">
                    <span className="sale-detail-label">Phone</span>
                    <strong>{saleDetail.customerPhone}</strong>
                  </div>
                )}
                <div className="sale-detail-summary-item">
                  <span className="sale-detail-label">Items</span>
                  <strong>{saleDetail.items.length}</strong>
                </div>
              </div>

              {saleDetail.items.length === 0 ? (
                <div className="sale-detail-empty">No items recorded for this sale</div>
              ) : (
                <div className="table-container">
                  <table className="table sale-detail-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Barcode</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleDetail.items.map(item => (
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
              )}
            </>
          )}
        </div>

        {saleDetail && !loading && (
          <div className="modal-footer sale-detail-footer">
            <div className="sale-detail-total">
              Total <strong>Rs. {saleDetail.totalAmount.toFixed(2)}</strong>
            </div>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDetailModal;
