import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { getUserBilling, payBilling } from '../api/billingApi';
import './profile.css';

function BillingSection() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState('');

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

  const handlePay = async (billing) => {
    const reference = window.prompt('Enter payment reference (optional):', '');
    setPayingId(billing.billing_id);
    const response = await payBilling(billing.billing_id, reference || '');
    setPayingId(null);
    if (!response.success) {
      alert(response.message || 'Payment failed');
      return;
    }

    setBills((prev) =>
      prev.map((bill) =>
        bill.billing_id === billing.billing_id
          ? { ...bill, status: 'paid', paid_at: new Date().toISOString() }
          : bill
      )
    );
  };

  return (
    <div>
      <div className="section-title">
        <CreditCard size={20} />
        Billing & Payments
      </div>

      <div className="billing-table">
        {loading ? (
          <p style={{ padding: '20px' }}>Loading billing records...</p>
        ) : error ? (
          <p style={{ padding: '20px', color: '#b91c1c' }}>{error}</p>
        ) : bills.length === 0 ? (
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
              {bills.map((bill) => (
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
                        {bill.status === 'paid'
                          ? new Date(bill.paid_at).toLocaleDateString()
                          : 'No action'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BillingSection;

