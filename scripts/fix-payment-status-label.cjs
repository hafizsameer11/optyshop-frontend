const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'customer', 'OrderDetail.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old = `              {order.payment_status && (
                <span className={\`px-3 py-1 text-sm font-medium rounded-full \${getPaymentStatusColor(order.payment_status)}\`}>
                  {t('orders.paymentStatus')}: {t(\`orders.\${(order.payment_status || '').toLowerCase()}\`, { defaultValue: order.payment_status || 'N/A' })}
                </span>
              )}`;

const neu = `              {order.payment_status && (
                <span className={\`px-3 py-1 text-sm font-medium rounded-full \${getPaymentStatusColor(order.payment_status)}\`}>
                  {t('orders.paymentStatus')}:{' '}
                  {(() => {
                    const method = String(order.payment_method || '').toLowerCase()
                    const status = String(order.payment_status || '').toLowerCase()
                    if (status === 'pending' && (method === 'cod' || method === 'cash' || method === 'dummy')) {
                      return t('orders.payOnDelivery', { defaultValue: 'Pay on delivery' })
                    }
                    if (status === 'pending' && (method === 'stripe' || method === 'card' || method === 'paypal')) {
                      return t('orders.awaitingPayment', { defaultValue: 'Awaiting payment' })
                    }
                    return t(\`orders.\${status}\`, { defaultValue: order.payment_status || 'N/A' })
                  })()}
                </span>
              )}`;

if (!t.includes(old)) {
  if (t.includes('payOnDelivery')) console.log('label already');
  else {
    console.error('MISSING payment badge');
    process.exit(1);
  }
} else {
  t = t.replace(old, neu);
}

// Also improve payment info section status line
const old2 = `                <p><span className="font-medium">{t('orders.status')}:</span> <span className="capitalize">{t(\`orders.\${order.payment_status?.toLowerCase()}\`, { defaultValue: order.payment_status || 'N/A' })}</span></p>`;
const neu2 = `                <p><span className="font-medium">{t('orders.status')}:</span> <span className="capitalize">{(() => {
                  const method = String(order.payment_method || '').toLowerCase()
                  const status = String(order.payment_status || '').toLowerCase()
                  if (status === 'pending' && (method === 'cod' || method === 'cash' || method === 'dummy')) {
                    return t('orders.payOnDelivery', { defaultValue: 'Pay on delivery' })
                  }
                  if (status === 'pending' && (method === 'stripe' || method === 'card' || method === 'paypal')) {
                    return t('orders.awaitingPayment', { defaultValue: 'Awaiting payment' })
                  }
                  return t(\`orders.\${status}\`, { defaultValue: order.payment_status || 'N/A' })
                })()}</span></p>`;

if (t.includes(old2)) t = t.replace(old2, neu2);

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK payment status labels');
