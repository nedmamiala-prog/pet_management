import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import './AdminAppointmentPage.css';
import Sidebar from './Sidebar';
import Header from './Header';
import { getAllBilling, adminPayBilling } from '../api/billingApi';
import { FaSearch } from 'react-icons/fa';

// Helper to detect payment method from reference
function getPaymentMethod(reference) {
  if (!reference) return null;
  // PayPal order IDs typically start with 3C or contain hyphens (UUID format)
  if (reference.match(/^3C|[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/i)) {
    return 'PayPal';
  }
  // Otherwise show the manual entry (cash, check, etc.)
  return reference;
}

export default function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [reference, setReference] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBilling() {
      setLoading(true);
      const response = await getAllBilling();
      if (response.success) {
        setBills(response.bills);
      } else {
        setError(response.message || 'Unable to load billing data');
      }
      setLoading(false);
    }
    fetchBilling();
  }, []);

  const filteredBills = bills.filter((bill) => {
    const matchesFilter = filter === 'all' ? true : bill.status === filter;
    const query = search.toLowerCase();
    const matchesSearch =
      bill.billing_id.toString().includes(query) ||
      bill.first_name?.toLowerCase().includes(query) ||
      bill.last_name?.toLowerCase().includes(query) ||
      bill.email?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const openModal = (bill) => {
    setSelectedBill(bill);
    setReference('');
  };

  const closeModal = () => {
    setSelectedBill(null);
    setReference('');
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    setUpdating(true);
    const response = await adminPayBilling(selectedBill.billing_id, reference);
    setUpdating(false);
    if (!response.success) {
      setNotification({
        title: 'Payment update failed',
        message: response.message || 'Failed to update billing',
      });
      return;
    }

    setBills((prev) =>
      prev.map((bill) =>
        bill.billing_id === selectedBill.billing_id
          ? {
              ...bill,
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_reference: reference,
            }
          : bill
      )
    );
    closeModal();
    setNotification({
      title: 'Payment recorded',
      message: 'Invoice has been marked as paid.',
    });
  };

  return (
    <div className="grid-container-admin">
      <Sidebar />
      <Header />
      <main className="main-container">
        <div className="admin-appointment-wrapper">
          <div className="top-row">
            <div className="page-title">
              <h3>Admin Billing Management</h3>
              <h4>Review invoices and record payments</h4>
            </div>
          </div>

          <div className="controls-row">
            <div className="tabs-container">
              <button
                className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`tab-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`tab-btn ${filter === 'overdue' ? 'active' : ''}`}
                onClick={() => setFilter('overdue')}
              >
                Overdue
              </button>
              <button
                className={`tab-btn ${filter === 'paid' ? 'active' : ''}`}
                onClick={() => setFilter('paid')}
              >
                Paid
              </button>
              <button
                className={`tab-btn ${filter === 'void' ? 'active' : ''}`}
                onClick={() => setFilter('void')}
              >
                Void
              </button>
            </div>

            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search invoice, user or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div></div>
          </div>

          <div className="billing-table">
        {loading ? (
          <p style={{ padding: '20px' }}>Loading billing records...</p>
        ) : error ? (
          <p style={{ padding: '20px', color: '#b91c1c' }}>{error}</p>
        ) : filteredBills.length === 0 ? (
          <p style={{ padding: '20px', color: '#64748b' }}>No billing records match your filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>User</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Paid At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.billing_id}>
                  <td>#{bill.billing_id}</td>
                  <td>{bill.first_name} {bill.last_name}</td>
                  <td>{bill.email}</td>
                  <td>₱{Number(bill.amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`billing-status ${bill.status}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td>{bill.due_date ? new Date(bill.due_date).toLocaleString() : '—'}</td>
                  <td>{bill.paid_at ? new Date(bill.paid_at).toLocaleString() : '—'}</td>
                  <td>
                    {bill.status !== 'paid' ? (
                      <button className="action-btn pay" onClick={() => openModal(bill)}>
                        Mark as Paid
                      </button>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        <div>Paid on {new Date(bill.paid_at).toLocaleString()}</div>
                        {getPaymentMethod(bill.payment_reference) && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            via {getPaymentMethod(bill.payment_reference)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
          </div>

          {selectedBill && (
            <div className="cancel-modal-overlay">
              <div className="cancel-modal" style={{ maxWidth: '420px' }}>
                <h3>Mark Invoice #{selectedBill.billing_id} as Paid</h3>
                <p>Optional: add a payment reference or receipt number.</p>
                <input
                  type="text"
                  placeholder="Payment reference (optional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <div className="modal-actions">
                  <button className="back-btn" onClick={closeModal}>Cancel</button>
                  <button className="decline-btn" onClick={handleMarkPaid} disabled={updating}>
                    {updating ? 'Updating...' : 'Confirm Paid'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {notification && (
            <div className="cancel-modal-overlay">
              <div className="cancel-modal" style={{ maxWidth: '380px' }}>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <div className="modal-actions">
                  <button className="back-btn" onClick={closeNotification}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

