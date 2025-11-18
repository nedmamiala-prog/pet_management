import React, { useEffect, useState } from 'react';
import './profile.css';
import { getAllBilling, payBilling } from '../api/billingApi';

export default function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [reference, setReference] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    setUpdating(true);
    const response = await payBilling(selectedBill.billing_id, reference);
    setUpdating(false);
    if (!response.success) {
      alert(response.message || 'Failed to update billing');
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
  };

  return (
    <div className="content-area" style={{ padding: '40px' }}>
      <div className="section-title">
        Admin Billing Management
      </div>

      <div className="billing-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search invoice/user/email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
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
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        Paid
                      </span>
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
    </div>
  );
}

