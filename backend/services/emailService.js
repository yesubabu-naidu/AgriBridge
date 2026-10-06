import nodemailer from 'nodemailer';
import { query } from '../config/db.js';

/**
 * Reusable helper to look up a user's full_name from PostgreSQL by email address.
 * Never derives username from email prefix or string splitting.
 * Safe fallback to 'User'.
 */
export async function getUserNameByEmail(email) {
  if (!email || typeof email !== 'string') return 'User';
  try {
    const cleanEmail = email.trim().toLowerCase();
    const rows = await query(
      `
      SELECT full_name
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [cleanEmail]
    );
    const fullName = rows[0]?.full_name;
    return (fullName && String(fullName).trim()) || 'User';
  } catch (error) {
    console.error('Failed to get user name by email:', error.message);
    return 'User';
  }
}

/**
 * AgriBridge Commercial Email Service
 * Generates beautiful, responsive, mobile-friendly HTML emails with inline styles.
 */

const BRAND_NAME = 'AgriBridge';
const BRAND_PRIMARY = '#198754';
const BRAND_DARK = '#0f5132';
const BRAND_LIGHT = '#e8f5e9';
const BRAND_ACCENT = '#ffc107';
const SUPPORT_EMAIL = 'support@agribridge.com';
const SUPPORT_PHONE = '+91 800-AGRI-BRG';

/**
 * Creates a Nodemailer transporter using environment credentials
 */
export function getMailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Sends an email using the AgriBridge SMTP transporter.
 * Falls back safely if SMTP is unconfigured or in test mode.
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = getMailTransporter();
  const fromUser = process.env.EMAIL_USER || 'no-reply@agribridge.com';

  if (!transporter) {
    console.info(`[Email Service] SMTP not configured. Skipped sending email to <${to}> with subject: "${subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const result = await transporter.sendMail({
      from: `"${BRAND_NAME} Official" <${fromUser}>`,
      to,
      subject,
      html,
      text: text || ''
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    // Don't crash caller on network/SMTP delivery issues
    return { success: false, error: error.message };
  }
}

/**
 * Master responsive commercial email wrapper with inline CSS
 */
export function buildBaseEmailLayout({ title, preheader = '', bodyContent, actionButton = null }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #212529;">
  <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${preheader || title}
  </span>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8e2;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${BRAND_PRIMARY}; padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      🌿 ${BRAND_NAME}
                    </div>
                    <div style="font-size: 13px; color: #d1e7dd; margin-top: 4px; font-weight: 500;">
                      Commercial Agriculture & Land Leasing Ecosystem
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              ${bodyContent}

              ${actionButton ? `
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 10px 0;">
                  <tr>
                    <td align="center" style="border-radius: 8px; background-color: ${BRAND_PRIMARY};">
                      <a href="${actionButton.url}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 8px; background-color: ${BRAND_PRIMARY};">
                        ${actionButton.label} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #f8faf8; border-top: 1px solid #e9ecef; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6c757d; line-height: 1.5;">
                This is an automated notification from <strong>${BRAND_NAME} Technologies</strong>.
                Please do not reply directly to this email.
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #6c757d;">
                Need assistance? Contact Support at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_PRIMARY}; text-decoration: underline;">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.
              </p>
              <div style="font-size: 11px; color: #adb5bd;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME} Inc. All rights reserved. &bull; Sustainable Agricultural Commerce
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Verification & Security OTP Email Template
 */
export function buildOtpEmail(params = {}) {
  const code = params.code || params.otp || '';
  const userName = params.userName || params.name || 'User';
  const actionType = params.actionType || params.purpose || 'verification';
  const isReset = actionType.toLowerCase().includes('password') || actionType.toLowerCase().includes('reset');
  const title = isReset ? 'AgriBridge Password Reset Code' : 'Verify Your AgriBridge Account';

  const bodyContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #1f2937;">
      ${isReset ? 'Password Reset Verification' : 'Welcome to AgriBridge!'}
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello <strong>${userName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      ${isReset
        ? 'We received a request to reset your AgriBridge account password. Use the secure authorization code below to complete the process.'
        : 'Thank you for registering on AgriBridge. To complete your account activation and verify your email address, please use the 6-digit one-time code below:'
      }
    </p>

    <!-- OTP Code Display Card -->
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 24px auto; background-color: #f0fdf4; border: 2px dashed ${BRAND_PRIMARY}; border-radius: 10px;">
      <tr>
        <td style="padding: 16px 36px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${BRAND_DARK}; letter-spacing: 1px; margin-bottom: 6px;">
            One-Time Security Code
          </div>
          <div style="font-size: 36px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 6px; color: ${BRAND_PRIMARY};">
            ${code}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; text-align: center;">
      ⏱️ This security code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
    </p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
      <div style="font-size: 13px; color: #92400e; font-weight: 600;">Security Reminder</div>
      <div style="font-size: 12px; color: #b45309; margin-top: 2px;">
        If you did not initiate this request, your account may be compromised. Please change your password immediately or contact our security team.
      </div>
    </div>
  `;

  return buildBaseEmailLayout({
    title,
    preheader: `Your AgriBridge authorization code is ${code}`,
    bodyContent
  });
}

/**
 * Order Confirmation & Purchase Receipt Email
 */
export function buildOrderConfirmationEmail(params = {}) {
  const order = params.order || params;
  const buyer = params.buyer || { 
    full_name: params.buyer_name || params.name || 'Valued Customer', 
    email: params.buyer_email || params.email 
  };
  const items = params.items || order.items || [];
  const orderId = order.id || order.order_id || 1;
  const txId = params.txId || order.transaction_id || `TXN-${orderId}`;

  const title = `Order Confirmation #${orderId} — AgriBridge`;
  const grandTotal = Number(order.grand_total || order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const deliveryFee = Number(order.delivery_fee || 150).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const platformFee = Number(order.platform_fee || 50).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const subtotal = Number(order.total_amount || order.subtotal || order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const itemsRows = items.map((item) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0; font-size: 14px; color: #1e293b; font-weight: 600;">
        ${item.product_name || item.crop_name || item.name || 'Produce Item'}
      </td>
      <td align="center" style="padding: 12px 0; font-size: 14px; color: #64748b;">
        ${item.quantity || item.quantity_kg || 1} ${item.unit || 'kg'}
      </td>
      <td align="right" style="padding: 12px 0; font-size: 14px; color: #64748b;">
        ₹${Number(item.unit_price || item.price_per_kg || item.price || 0).toLocaleString()}
      </td>
      <td align="right" style="padding: 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
        ₹${Number(item.subtotal || item.total_price || 0).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const bodyContent = `
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px;">
      <div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1f2937;">Thank You for Your Order!</h2>
        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Order #ORD-00${orderId}</div>
      </div>
    </div>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello <strong>${buyer.full_name || buyer.name || 'Valued Customer'}</strong>, your produce purchase has been confirmed and authorized for fulfillment by our verified farmer partners.
    </p>

    <!-- Order Metadata Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; font-size: 13px; color: #475569; width: 50%;">
          <strong>Order Date:</strong> ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
          <strong>Payment Mode:</strong> ${order.payment_method || 'UPI'}<br>
          <strong>Payment Status:</strong> <span style="color: ${BRAND_PRIMARY}; font-weight: 700;">Successful</span>
        </td>
        <td style="padding: 16px 20px; font-size: 13px; color: #475569; width: 50%;">
          <strong>Transaction Ref:</strong> <span style="font-family: monospace;">${txId || order.transaction_id || 'N/A'}</span><br>
          <strong>Order Status:</strong> Processing Shipment<br>
          <strong>Fulfillment:</strong> Direct Farm-to-Door
        </td>
      </tr>
      ${order.shipping_address ? `
        <tr>
          <td colspan="2" style="padding: 10px 20px 16px 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
            <strong>Shipping Destination:</strong> ${order.shipping_address}
          </td>
        </tr>
      ` : ''}
    </table>

    <!-- Line Items Table -->
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1e293b;">Purchased Produce Items</h3>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0;">
          <th align="left" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product</th>
          <th align="center" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Qty</th>
          <th align="right" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Unit Price</th>
          <th align="right" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Financial Totals Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 2px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">Items Subtotal</td>
        <td align="right" style="font-size: 14px; color: #1e293b; padding: 4px 0;">₹${subtotal}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">Freight & Direct Farm Delivery</td>
        <td align="right" style="font-size: 14px; color: #1e293b; padding: 4px 0;">₹${deliveryFee}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">Platform Quality & Guarantee Fee</td>
        <td align="right" style="font-size: 14px; color: #1e293b; padding: 4px 0;">₹${platformFee}</td>
      </tr>
      <tr style="border-top: 1px solid #cbd5e1;">
        <td style="font-size: 17px; font-weight: 800; color: #0f172a; padding: 12px 0;">Grand Total Paid</td>
        <td align="right" style="font-size: 18px; font-weight: 800; color: ${BRAND_PRIMARY}; padding: 12px 0;">₹${grandTotal}</td>
      </tr>
    </table>
  `;

  return buildBaseEmailLayout({
    title,
    preheader: `Your AgriBridge produce order #ORD-00${order.id} is confirmed. Total: ₹${grandTotal}`,
    bodyContent
  });
}

/**
 * Lease Payment Receipt Email
 */
export function buildLeasePaymentEmail(params = {}) {
  const land = params.land || { 
    land_name: params.land_title || params.land_name || 'Agricultural Land', 
    acres: params.acres || params.area_acres || 5, 
    location: params.location || 'India' 
  };
  const lease = params.lease || { 
    id: params.lease_id || params.id || 'N/A', 
    annual_price: params.amount || 0 
  };
  const farmer = params.farmer || { 
    full_name: params.payer_name || params.farmer_name || 'Farmer Partner' 
  };
  const txId = params.txId || params.transaction_id || 'TXN-LEASE';
  const amount = params.amount || lease.annual_price || 0;

  const title = `Lease Payment Receipt — ${land.land_name || 'Agricultural Land'}`;
  const formattedAmount = Number(amount || lease.annual_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const bodyContent = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #1f2937;">
      Agricultural Lease Payment Successful
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Dear <strong>${farmer.full_name || farmer.name || 'Farmer Partner'}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Your lease payment for <strong>${land.land_name}</strong> (${land.acres} Acres in ${land.location}) has been recorded and confirmed. Your official leasing authorization is now active.
    </p>

    <!-- Details Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; padding: 16px;">
      <tr>
        <td style="font-size: 13px; color: #475569; padding: 6px 0;"><strong>Lease Agreement ID:</strong></td>
        <td align="right" style="font-size: 13px; color: #1e293b; font-weight: 600;">LEASE-#${lease.id}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #475569; padding: 6px 0;"><strong>Transaction Reference:</strong></td>
        <td align="right" style="font-size: 13px; color: #1e293b; font-family: monospace;">${txId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #475569; padding: 6px 0;"><strong>Farmland Property:</strong></td>
        <td align="right" style="font-size: 13px; color: #1e293b;">${land.land_name} (${land.location})</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #475569; padding: 6px 0;"><strong>Total Amount Paid:</strong></td>
        <td align="right" style="font-size: 16px; font-weight: 800; color: ${BRAND_PRIMARY};">₹${formattedAmount}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #475569; padding: 6px 0;"><strong>Status:</strong></td>
        <td align="right" style="font-size: 13px; color: ${BRAND_PRIMARY}; font-weight: 700;">Active & Verified</td>
      </tr>
    </table>
  `;

  return buildBaseEmailLayout({
    title,
    preheader: `Lease payment of ₹${formattedAmount} recorded for ${land.land_name}.`,
    bodyContent
  });
}
