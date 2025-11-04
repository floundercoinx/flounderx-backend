const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️  Email service not configured:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

// In-memory storage
const orders = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { email, amount, cardName } = req.body;

    if (!email || !amount || !cardName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum amount is $10' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: `FloundeRx Pre-Order - ${email}`,
      metadata: {
        email,
        cardName,
        bonus: Math.round(amount * 0.2)
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, cardToken, email, amount, cardName } = req.body;

    if (!paymentIntentId || !cardToken) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: cardToken,
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      }
    });

    if (paymentIntent.status === 'succeeded') {
      const order = {
        id: paymentIntentId,
        email,
        amount,
        cardName,
        bonus: amount * 0.2,
        status: 'completed',
        date: new Date().toISOString(),
        chargeId: paymentIntent.charges.data[0].id
      };

      orders.push(order);
      await sendConfirmationEmail(email, order);

      res.json({
        success: true,
        message: 'Payment successful!',
        order
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Payment failed. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Payment Confirmation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Email function
async function sendConfirmationEmail(email, order) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 FloundeRx Pre-Order Confirmed!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px; border-radius: 10px; color: white;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 32px; margin: 0; background: linear-gradient(90deg, #00d4ff, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">FloundeRx</h1>
            <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.9;">The Future of Digital Assets</p>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 8px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.2);">
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">Pre-Order Confirmed! 🚀</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">Thank you for being part of the FloundeRx revolution. Your pre-order has been successfully processed!</p>
            
            <div style="background: rgba(0, 212, 255, 0.1); padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #00d4ff;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> ${order.id}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${order.email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> $${order.amount.toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>20% Launch Bonus:</strong> +$${order.bonus.toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Total Value:</strong> $${(order.amount + order.bonus).toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
            </div>

            <h3 style="margin: 30px 0 15px 0; font-size: 18px;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li style="margin-bottom: 10px;">Your coins will be available when FloundeRx launches</li>
              <li style="margin-bottom: 10px;">You'll receive an email with launch details and wallet setup instructions</li>
              <li style="margin-bottom: 10px;">Early supporters get exclusive benefits and perks</li>
            </ul>
          </div>

          <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">© 2025 FloundeRx. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error);
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`🚀 FloundeRx server running on port ${PORT}`);
  console.log(`📝 Make sure your .env file has STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET`);
});