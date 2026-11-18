const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'shop', 'Checkout.tsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

if (!t.includes('completedOrderId')) {
  const oldState = `    const [orderNumber, setOrderNumber] = useState<string | null>(null)`;
  const newState = `    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const [completedOrderId, setCompletedOrderId] = useState<number | null>(null)`;
  if (!t.includes(oldState)) throw new Error('orderNumber state missing');
  t = t.replace(oldState, newState);

  t = t.replace(
    `                    setOrderNumber(order.order_number)
                    setIsCompleted(true)`,
    `                    setOrderNumber(order.order_number)
                    setCompletedOrderId(order.id ?? null)
                    setIsCompleted(true)`
  );

  const oldLink = `                                {isAuthenticated && (
                                    <Link
                                        to="/account/orders"
                                        className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300"
                                    >
                                        View Orders
                                    </Link>
                                )}`;
  const newLink = `                                {isAuthenticated && (
                                    <Link
                                        to={completedOrderId ? \`/account/orders/\${completedOrderId}\` : '/account/orders'}
                                        className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300"
                                    >
                                        {completedOrderId ? 'View Order' : 'View Orders'}
                                    </Link>
                                )}`;
  if (!t.includes(oldLink)) throw new Error('View Orders link missing');
  t = t.replace(oldLink, newLink);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK checkout view order link');
