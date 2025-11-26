const paypal = require("@paypal/checkout-server-sdk");
const createPayPalClient = require("../apiPaypal/paypal");
const { notifyBillingUpdate } = require('../services/notificationService');
const Billing = require("../Queries/billingQueries");

exports.createOrder = async (req, res) => {
  const { amount, billingId } = req.body;

 
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.error('Missing PayPal credentials: set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
    return res.status(500).json({ error: 'PayPal credentials not configured on server (PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET)' });
  }

  const client = createPayPalClient();

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  const returnUrl = process.env.PAYPAL_RETURN_URL || "http://localhost:5000/paypal-success.html";
  const cancelUrl = process.env.PAYPAL_CANCEL_URL || "http://localhost:5000/paypal-cancel.html";

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "PHP",
          value: amount,
        },
        
        custom_id: billingId ? String(billingId) : undefined,
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  try {
    const order = await client.execute(request);

    const approvalUrl = order.result.links.find((link) => link.rel === "approve").href;

  
    if (billingId) {
      Billing.setPaypalOrderId(billingId, order.result.id, (err) => {
        if (err) {
          console.error('Failed to persist paypal_order_id for billing', billingId, err);
        } else {
          console.log('Persisted paypal_order_id for billing', billingId, order.result.id);
        }
      });
    }

    res.json({ id: order.result.id, approvalUrl });
  } catch (err) {
    console.error('PayPal create order error:', err && (err.stack || err.message) || err);
    
    if (err && err._originalError && err._originalError.text) {
      try {
        const parsed = JSON.parse(err._originalError.text);
        if (parsed.error === 'invalid_client' || parsed.error === 'invalid_client_credentials') {
          return res.status(502).json({ error: 'PayPal authentication failed. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.' });
        }
      } catch (parseErr) {
      
      }
    }

    res.status(500).json({ error: 'Payment creation failed' });
  }
};

exports.captureOrder = async (req, res) => {
  const { orderID, billingId } = req.body;

  const client = createPayPalClient();
  const request = new paypal.orders.OrdersCaptureRequest(orderID);

  try {
    const capture = await client.execute(request);

    console.log('PayPal capture response:', JSON.stringify(capture.result, null, 2));

 
    let extractedBillingId =
      capture.result.purchase_units &&
      capture.result.purchase_units[0] &&
      capture.result.purchase_units[0].custom_id;
    if (!extractedBillingId) {
      extractedBillingId = billingId; 
    }

  
    if (!extractedBillingId) {
      const paypalOrderToLookup = orderID || capture.result.id;
      const rows = await new Promise((resolve, reject) => {
        Billing.getByPaypalOrderId(paypalOrderToLookup, (err, results) => {
          if (err) return reject(err);
          resolve(results || []);
        });
      });
      if (rows && rows.length) {
        extractedBillingId = rows[0].billing_id;
        console.log('Found billing by paypal_order_id:', extractedBillingId);
      }
    }

    console.log('Billing ID to mark paid:', extractedBillingId);

  
   
    const captureId = capture.result.purchase_units && capture.result.purchase_units[0] && capture.result.purchase_units[0].payments && capture.result.purchase_units[0].payments.captures && capture.result.purchase_units[0].payments.captures[0] && capture.result.purchase_units[0].payments.captures[0].id;

    if (extractedBillingId) {
      await new Promise((resolve, reject) => {
        Billing.markPaid(extractedBillingId, captureId || capture.result.id, (err) => {
          if (err) {
            console.error('Failed to mark billing paid after capture:', err);
            return reject(err);
          }
          console.log('Billing marked as paid:', extractedBillingId);
          resolve();
        });
      });

      try {
        const billingRecord = await new Promise((resolve, reject) => {
          Billing.getById(extractedBillingId, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        if (billingRecord) {
          await notifyBillingUpdate({
            user_id: billingRecord.user_id,
            amount: billingRecord.amount,
            status: 'paid',
            invoice_id: billingRecord.billing_id,
          });
        }
      } catch (notifyErr) {
        console.error('PayPal payment notification error:', notifyErr);
      }
    } else {
      console.warn('No billing ID found in capture response, request body, or DB mapping. Payment captured but billing not marked.');
    }

    res.json({ status: "COMPLETED", data: capture });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: "Payment capture failed" });
  }
};
