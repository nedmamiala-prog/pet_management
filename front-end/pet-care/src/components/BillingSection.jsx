import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { getUserBilling, payBilling } from '../api/billingApi';
import './billingSection.css';



function getPaymentMethod(reference) {
  if (!reference) return null;

  if (reference.match(/^3C|[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/i)) {
    return 'PayPal';
  }

  return reference;
}

function BillingSection() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchBilling() {
      setLoading(true);
      const response = await getUserBilling();
      if (response.success) {
        setBills(response.bills);
      } else {
        setError(response.message || 'Unable to load billing data');
      }
      setLoading(false);
    }

    fetchBilling();
  }, []);

  
  useEffect(() => {
    const handleMessage = async (event) => {
   

      if (event.data && event.data.type === 'paypal-payment-complete') {
        console.log('PayPal payment completed:', event.data.orderID);
       
        try {
          setLoading(true);
          const response = await getUserBilling();
          if (response.success) {
            setBills(response.bills);
          } else {
            console.error('Failed to refresh billing:', response.message);
          }
          setLoading(false);
        } catch (err) {
          console.error('Failed to refresh billing after payment:', err);
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const filteredBills = bills.filter((bill) => {
    const matchesStatus = statusFilter === 'all' ? true : bill.status === statusFilter;
    if (!matchesStatus) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    const invoice = String(bill.billing_id || '').toLowerCase();
    const amount = String(bill.amount || '').toLowerCase();
    const status = String(bill.status || '').toLowerCase();
    const due = bill.due_date
      ? new Date(bill.due_date).toLocaleString().toLowerCase()
      : '';

    return (
      invoice.includes(q) ||
      amount.includes(q) ||
      status.includes(q) ||
      due.includes(q)
    );
  });

  const handlePay = async (billing) => {

    setPayingId(billing.billing_id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://pet-management-ro9c.onrender.com/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: billing.amount, billingId: billing.billing_id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotification({
          title: 'Payment error',
          message: json.error || 'Failed to create PayPal order',
        });
        setPayingId(null);
        return;
      }

   
      try {
        if (json.id) localStorage.setItem('paypal_last_order', json.id);
        if (billing.billing_id) localStorage.setItem('paypal_billing_id', billing.billing_id);
      } catch (e) {
     
      }

  
      window.open(json.approvalUrl, '_blank');

      setNotification({
        title: 'PayPal checkout opened',
        message: 'Complete payment in the new window, then refresh to see updated status.',
      });
    } catch (err) {
      console.error(err);
      setNotification({
        title: 'Network error',
        message: 'Network error starting PayPal checkout: ' + err.message,
      });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div>
      <div className="section-title">
        <CreditCard size={20} />
        Billing & Payments
      </div>

      <div className="billing-controls">
        <div className="billing-search">
          <input
            type="text"
            placeholder="Search invoice, amount, status or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <p style={{ padding: '20px', color: '#64748b' }}>No billing records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.billing_id}>
                  <td>#{bill.billing_id}</td>
                  <td>₱{Number(bill.amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`billing-status ${bill.status}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td>
                    {bill.due_date
                      ? new Date(bill.due_date).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    {['pending', 'overdue'].includes(bill.status) ? (
                      <button
                        className="action-btn pay"
                        onClick={() => handlePay(bill)}
                        disabled={payingId === bill.billing_id}
                      >
                        {payingId === bill.billing_id ? 'Processing...' : 'Pay now'}
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {bill.status === 'paid' ? (
                          <>
                            Paid on {new Date(bill.paid_at).toLocaleDateString()}
                            <br />
                            {getPaymentMethod(bill.payment_reference) && (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                via {getPaymentMethod(bill.payment_reference)}
                              </span>
                            )}
                          </>
                        ) : (
                          'No action'
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {notification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: '360px',
              maxWidth: '90%',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
              padding: '20px',
            }}
          >
            <h3 style={{ marginBottom: '8px', color: '#111827' }}>{notification.title}</h3>
            <p style={{ marginBottom: '16px', color: '#4b5563', fontSize: '14px' }}>
              {notification.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNotification(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingSection;

