const Billing = require('../Queries/billingQueries');
const { notifyBillingUpdate } = require('../services/notificationService');

exports.getUserBilling = (req, res) => {
  const user_id = req.user.id;

  Billing.getByUser(user_id, (err, bills) => {
    if (err) {
      console.error('Billing fetch error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching billing records', error: err });
    }

      res.status(200).json({ success: true, bills });
  });
};

exports.markAsPaid = (req, res) => {
  const user_id = req.user.id;
  const { billingId } = req.params;
  const { payment_reference } = req.body || {};

  Billing.getByUser(user_id, (err, bills) => {
    if (err) {
      console.error('Billing lookup error:', err);
      return res.status(500).json({ success: false, message: 'Error validating billing record', error: err });
    }

    const billing = bills.find((bill) => bill.billing_id == billingId);
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }

    Billing.markPaid(billingId, payment_reference || null, async (updateErr) => {
      if (updateErr) {
        console.error('Billing mark paid error:', updateErr);
        return res.status(500).json({ success: false, message: 'Error updating billing status', error: updateErr });
      }

      try {
        await notifyBillingUpdate({
          user_id,
          amount: billing.amount,
          status: 'paid',
          invoice_id: billing.billing_id,
        });
      } catch (notificationErr) {
        console.error('Billing notification error:', notificationErr);
      }

      res.status(200).json({ success: true, message: 'Payment recorded successfully' });
    });
  });
};
exports.adminMarkAsPaid = (req, res) => {
  const { billingId } = req.params;
  const { payment_reference } = req.body || {};

  Billing.markPaid(billingId, payment_reference || null, (err) => {
    if (err) {
      console.error('Admin billing mark paid error:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating billing status', error: err });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Payment recorded successfully' });
  });
};

exports.getAllBilling = (req, res) => {
  Billing.getAllWithUsers((err, bills) => {
    if (err) {
      console.error('Billing fetch all error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching billing records', error: err });
    }

      res.status(200).json({ success: true, bills });
  });
};

