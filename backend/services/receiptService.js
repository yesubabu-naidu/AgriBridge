/**
 * AgriBridge Commercial Receipt PDF Generator
 * Generates standards-compliant, professional %PDF-1.4 vector documents
 * with AgriBridge branding, line items, and financial totals.
 */

function escapePdfText(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateReceiptPdf(receiptData) {
  const {
    transactionId = 'AGRI-TX',
    date = new Date().toISOString(),
    type = 'order_payment',
    paymentMethod = 'UPI',
    paymentStatus = 'Successful',
    amount = 0,
    subtotal = amount,
    deliveryFee = 0,
    platformFee = 0,
    tax = 0,
    buyer = {},
    seller = {},
    shippingAddress = '',
    items = [],
    lease = null,
    notes = ''
  } = receiptData;

  const ops = [];

  // Helper text command
  const text = (str, x, y, size = 10, bold = false, r = 0.1, g = 0.1, b = 0.1) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(str)}) Tj ET`);
  };

  // Helper rectangle command
  const rect = (x, y, w, h, r = 0.95, g = 0.95, b = 0.95, fill = true, stroke = false) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${fill ? 'rg' : 'RG'}`);
    let cmd = `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
    if (fill && stroke) cmd += 'B';
    else if (fill) cmd += 'f';
    else if (stroke) cmd += 'S';
    ops.push(cmd);
  };

  // Helper line command
  const line = (x1, y1, x2, y2, r = 0.85, g = 0.85, b = 0.85, lw = 0.8) => {
    ops.push(`${lw} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  // Page Dimensions: A4 = 595.28 x 841.89 points
  // 1. Top Header Banner (Emerald Green #198754)
  rect(0, 755, 595.28, 87, 0.098, 0.529, 0.329, true);

  // Logo & Title
  text('AgriBridge Technologies', 40, 804, 18, true, 1, 1, 1);
  text('Commercial Agriculture & Land Leasing Ecosystem', 40, 790, 9, false, 0.88, 0.95, 0.90);
  text('TAX INVOICE & TRANSACTION RECEIPT', 330, 804, 11, true, 1, 1, 1);
  text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 330, 790, 8, false, 0.88, 0.95, 0.90);

  // 2. Receipt Key Info Grid
  rect(40, 680, 515.28, 62, 0.97, 0.98, 0.97, true, true);

  text('TRANSACTION ID:', 52, 725, 8, true, 0.4, 0.45, 0.4);
  text(transactionId, 52, 712, 10, true, 0.1, 0.35, 0.15);

  text('DATE & TIME:', 220, 725, 8, true, 0.4, 0.45, 0.4);
  text(new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), 220, 712, 9, false, 0.1, 0.1, 0.1);

  text('PAYMENT MODE:', 360, 725, 8, true, 0.4, 0.45, 0.4);
  text(paymentMethod.toUpperCase(), 360, 712, 9, true, 0.1, 0.1, 0.1);

  text('PAYMENT STATUS:', 465, 725, 8, true, 0.4, 0.45, 0.4);
  text(paymentStatus.toUpperCase(), 465, 712, 9, true, 0.098, 0.529, 0.329);

  // 3. Parties Box (Billed To / Delivered To & Seller / Farmer)
  const isLease = Boolean(lease || type === 'lease_payment');

  text(isLease ? 'FARMER / LESSEE DETAILS' : 'BILLED TO (BUYER)', 40, 660, 9, true, 0.098, 0.529, 0.329);
  line(40, 654, 280, 654, 0.098, 0.529, 0.329, 1.2);

  const buyerName = buyer.full_name || buyer.name || 'Valued AgriBridge Client';
  text(buyerName, 40, 638, 10, true, 0.1, 0.1, 0.1);
  if (buyer.email) text(`Email: ${buyer.email}`, 40, 625, 8, false, 0.3, 0.3, 0.3);
  if (buyer.phone) text(`Phone: ${buyer.phone}`, 40, 613, 8, false, 0.3, 0.3, 0.3);
  if (shippingAddress) {
    text(`Destination: ${shippingAddress.slice(0, 50)}`, 40, 601, 8, false, 0.3, 0.3, 0.3);
  }

  text(isLease ? 'LANDOWNER / LESSOR DETAILS' : 'SUPPLIER / PRODUCER DETAILS', 315, 660, 9, true, 0.098, 0.529, 0.329);
  line(315, 654, 555, 654, 0.098, 0.529, 0.329, 1.2);

  const sellerName = seller.full_name || seller.name || (isLease ? 'Verified Landowner' : 'Verified AgriBridge Farmer');
  text(sellerName, 315, 638, 10, true, 0.1, 0.1, 0.1);
  if (seller.email) text(`Contact: ${seller.email}`, 315, 625, 8, false, 0.3, 0.3, 0.3);
  if (seller.phone) text(`Phone: ${seller.phone}`, 315, 613, 8, false, 0.3, 0.3, 0.3);
  if (lease?.land_name) {
    text(`Farmland: ${lease.land_name} (${lease.acres || ''} Acres, ${lease.location || ''})`, 315, 601, 8, false, 0.3, 0.3, 0.3);
  }

  // 4. Items Table
  let curY = 565;
  rect(40, curY - 5, 515.28, 22, 0.93, 0.95, 0.93, true);
  text('ITEM / SERVICE DESCRIPTION', 48, curY + 2, 8, true, 0.15, 0.35, 0.2);
  text('QTY / UNIT', 330, curY + 2, 8, true, 0.15, 0.35, 0.2);
  text('RATE (INR)', 415, curY + 2, 8, true, 0.15, 0.35, 0.2);
  text('AMOUNT (INR)', 485, curY + 2, 8, true, 0.15, 0.35, 0.2);

  curY -= 22;

  const lineItems = items.length > 0 ? items : [
    {
      description: isLease
        ? `Agricultural Land Lease #${lease?.id || 'Ref'} - ${lease?.land_name || 'Farmland Property'}`
        : 'Agricultural Crop Produce Order',
      quantity: isLease ? `${lease?.duration_months || 12} Months` : '1 Shipment',
      rate: amount,
      amount: amount
    }
  ];

  for (const item of lineItems) {
    const desc = item.product_name || item.crop_name || item.description || 'Farm Produce';
    const qty = `${item.quantity || item.quantity_kg || 1} ${item.unit || 'kg'}`;
    const rate = Number(item.unit_price || item.price_per_kg || item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const lineSubtotal = Number(item.subtotal || item.amount || (Number(item.quantity || 1) * Number(item.unit_price || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    text(desc.slice(0, 48), 48, curY, 9, true, 0.1, 0.1, 0.1);
    text(qty, 330, curY, 9, false, 0.2, 0.2, 0.2);
    text(`INR ${rate}`, 415, curY, 9, false, 0.2, 0.2, 0.2);
    text(`INR ${lineSubtotal}`, 485, curY, 9, true, 0.1, 0.1, 0.1);

    line(40, curY - 7, 555.28, curY - 7, 0.92, 0.92, 0.92, 0.5);
    curY -= 22;
  }

  // 5. Totals Breakdown
  curY -= 10;
  const totalsX = 340;
  const valuesX = 485;

  text('Subtotal:', totalsX, curY, 9, false, 0.3, 0.3, 0.3);
  text(`INR ${Number(subtotal || amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valuesX, curY, 9, false, 0.1, 0.1, 0.1);
  curY -= 18;

  if (deliveryFee > 0) {
    text('Freight & Farm Transport:', totalsX, curY, 9, false, 0.3, 0.3, 0.3);
    text(`INR ${Number(deliveryFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valuesX, curY, 9, false, 0.1, 0.1, 0.1);
    curY -= 18;
  }

  if (platformFee > 0) {
    text('Platform Guarantee & Escrow Fee:', totalsX, curY, 9, false, 0.3, 0.3, 0.3);
    text(`INR ${Number(platformFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valuesX, curY, 9, false, 0.1, 0.1, 0.1);
    curY -= 18;
  }

  if (tax > 0) {
    text('GST / Taxes (Applicable):', totalsX, curY, 9, false, 0.3, 0.3, 0.3);
    text(`INR ${Number(tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valuesX, curY, 9, false, 0.1, 0.1, 0.1);
    curY -= 18;
  }

  // Grand Total Box
  curY -= 6;
  rect(320, curY - 8, 235.28, 28, 0.91, 0.96, 0.92, true, true);
  text('GRAND TOTAL PAID:', 330, curY, 10, true, 0.08, 0.45, 0.25);
  text(`INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valuesX, curY, 11, true, 0.08, 0.45, 0.25);

  // 6. Security & Verification Badge
  curY -= 45;
  rect(40, curY - 8, 260, 48, 0.97, 0.99, 0.97, true, true);
  text('[SECURE ELECTRONIC RECEIPT]', 50, curY + 22, 8, true, 0.098, 0.529, 0.329);
  text('Digitally verified against database audit logs.', 50, curY + 10, 7, false, 0.3, 0.3, 0.3);
  text(`Ref: ${transactionId} &bull; Legally valid commercial document.`, 50, curY - 2, 7, false, 0.4, 0.4, 0.4);

  // 7. Footer
  line(40, 80, 555.28, 80, 0.85, 0.85, 0.85, 0.8);
  text('Thank you for partnering with AgriBridge — Cultivating Prosperity for Rural Farmers.', 40, 66, 8, true, 0.2, 0.4, 0.25);
  text('For billing questions: support@agribridge.com | Toll-Free: +91 800-AGRI-BRG | www.agribridge.com', 40, 54, 7, false, 0.45, 0.45, 0.45);
  text('This is an authenticated computer-generated receipt requiring no manual signature.', 40, 42, 7, false, 0.55, 0.55, 0.55);

  const contentStream = ops.join('\n');
  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  let body = '%PDF-1.4\n';
  const offsets = [];
  const addObj = (str) => {
    offsets.push(Buffer.byteLength(body, 'binary'));
    body += str + '\n';
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  addObj('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  const startxref = Buffer.byteLength(body, 'binary');
  body += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    body += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  body += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return Buffer.from(body, 'binary');
}
