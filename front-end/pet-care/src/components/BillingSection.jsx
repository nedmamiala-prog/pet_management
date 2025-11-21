import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { getUserBilling, payBilling } from '../api/billingApi';
import './profile.css';


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

  const handlePay = async (billing) => {

    setPayingId(billing.billing_id);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: billing.amount, billingId: billing.billing_id }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to create PayPal order');
        setPayingId(null);
        return;
      }

   
      try {
        if (json.id) localStorage.setItem('paypal_last_order', json.id);
        if (billing.billing_id) localStorage.setItem('paypal_billing_id', billing.billing_id);
      } catch (e) {
     
      }

  
      window.open(json.approvalUrl, '_blank');

   

      alert('PayPal checkout opened. Complete payment in the new window. Refresh to see status.');
    } catch (err) {
      console.error(err);
      alert('Network error starting PayPal checkout: ' + err.message);
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
    </div>
  );
}

export default BillingSection;

