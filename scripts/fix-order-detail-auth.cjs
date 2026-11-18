const fs = require('fs');
const path = require('path');

function patch(rel, fn) {
  const file = path.join(__dirname, '..', rel);
  const raw = fs.readFileSync(file, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = fn(t, file);
  fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', rel);
}

// --- AuthContext: unwrap { user } from /auth/me ---
patch('src/context/AuthContext.tsx', (t) => {
  if (!t.includes('function unwrapAuthUser')) {
    const marker = 'const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {';
    if (!t.includes(marker)) throw new Error('AuthProvider marker missing');
    t = t.replace(
      marker,
      `function unwrapAuthUser(data: any): User | null {
  if (!data || typeof data !== 'object') return null
  if (data.user && typeof data.user === 'object' && (data.user.email || data.user.id)) {
    return data.user as User
  }
  if (data.email || data.id) return data as User
  return null
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {`
    );
  }

  const oldSet = `      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token might be invalid, clear it
        apiClient.clearTokens();
        setUser(null);
      }`;
  const newSet = `      if (response.success && response.data) {
        const me = unwrapAuthUser(response.data);
        if (me) {
          setUser(me);
        } else {
          // Keep session tokens; malformed payload should not log the user out
          console.warn('Unexpected /auth/me payload shape', response.data);
        }
      } else if (response.error === 'TOKEN_REFRESHED') {
        // Retry once after refresh
        const retry = await apiClient.get<User>(API_ROUTES.AUTH.ME, true);
        const me = unwrapAuthUser(retry.data);
        if (retry.success && me) setUser(me);
      } else {
        // Only clear when we truly have no usable session
        const stillHasToken = !!localStorage.getItem('access_token') || !!localStorage.getItem('refresh_token');
        if (!stillHasToken) {
          setUser(null);
        } else if (!response.success) {
          // Soft-fail: do not wipe tokens on transient ME failures while browsing
          console.warn('Auth check failed without clearing session', response.message || response.error);
        }
      }`;
  if (!t.includes(oldSet)) {
    if (t.includes('unwrapAuthUser(response.data)')) console.log('auth set already');
    else throw new Error('missing checkAuth setUser block');
  } else {
    t = t.replace(oldSet, newSet);
  }

  // Fix updateProfile unwrap
  t = t.replace(
    `      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Profile update failed' };
      }`,
    `      if (response.success && response.data) {
        const me = unwrapAuthUser(response.data) || (response.data as User);
        setUser(me);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Profile update failed' };
      }`
  );

  // isAuthenticated: require a real user id/email
  t = t.replace(
    '    isAuthenticated: !!user,',
    '    isAuthenticated: !!(user && (user.id || user.email)),'
  );

  return t;
});

// --- ProtectedRoute: keep redirect + don't kick valid sessions missing role string ---
patch('src/components/customer/ProtectedRoute.tsx', (t) => {
  if (!t.includes('useLocation')) {
    t = t.replace(
      "import { Navigate } from 'react-router-dom'",
      "import { Navigate, useLocation } from 'react-router-dom'"
    );
  }
  const old = `const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-950" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}`;
  const neu = `const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const returnTo = \`\${location.pathname}\${location.search || ''}\`

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-950" />
      </div>
    )
  }

  if (!user || !(user.id || user.email)) {
    return <Navigate to={\`/login?redirect=\${encodeURIComponent(returnTo || '/account/orders')}\`} replace />
  }

  // Allow customers (and users without an explicit role) into account pages
  if (user.role && user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}`;
  if (!t.includes(old)) {
    if (t.includes('returnTo')) console.log('ProtectedRoute already');
    else throw new Error('ProtectedRoute block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});

// --- OrderDetail: human-readable customization ---
patch('src/pages/customer/OrderDetail.tsx', (t) => {
  const old = `                            {/* Other customizations */}
                            {item.customization && !item.customization.contactLens && !item.contact_lens_right_qty && (
                              <p className="text-xs text-gray-500">Customization: {JSON.stringify(item.customization)}</p>
                            )}`;

  const neu = `                            {/* Frame / color / size customization */}
                            {(() => {
                              let custom: any = item.customization
                              if (!custom) return null
                              if (typeof custom === 'string') {
                                try { custom = JSON.parse(custom) } catch { return null }
                              }
                              if (custom.contactLens || item.contact_lens_right_qty) return null

                              const colorName =
                                custom.color_display_name ||
                                custom.color_name ||
                                custom.selected_color ||
                                custom.color ||
                                null
                              const hex =
                                custom.hex_code ||
                                (typeof custom.selected_color === 'string' && custom.selected_color.startsWith('#')
                                  ? custom.selected_color
                                  : null)
                              const size =
                                custom.selected_mm_caliber ||
                                custom.size_volume ||
                                custom.variant_display_name ||
                                null
                              const pack = custom.pack_type || null

                              if (!colorName && !size && !pack && !hex) return null

                              return (
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                  {colorName && (
                                    <div className="flex items-center gap-2">
                                      {hex && (
                                        <span
                                          className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300"
                                          style={{ backgroundColor: String(hex) }}
                                          aria-hidden
                                        />
                                      )}
                                      <span>
                                        {t('orders.color', { defaultValue: 'Color' })}: <span className="font-medium text-gray-800 capitalize">{String(colorName)}</span>
                                      </span>
                                    </div>
                                  )}
                                  {size && (
                                    <div>
                                      {t('orders.size', { defaultValue: 'Size' })}: <span className="font-medium text-gray-800">{String(size)}{custom.selected_mm_caliber ? 'mm' : ''}</span>
                                    </div>
                                  )}
                                  {pack && (
                                    <div>
                                      {t('orders.pack', { defaultValue: 'Pack' })}: <span className="font-medium text-gray-800">{String(pack)}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}`;

  if (!t.includes(old)) {
    if (t.includes("t('orders.color'")) console.log('OrderDetail already');
    else throw new Error('OrderDetail customization block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});

// --- api.ts: retry once after TOKEN_REFRESHED ---
patch('src/utils/api.ts', (t) => {
  if (t.includes('TOKEN_REFRESHED_RETRY')) {
    console.log('api retry already');
    return t;
  }

  const oldGet = `      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(\`[API] GET Error:\`, error);
      }`;

  const newGet = `      const result = await this.handleResponse<T>(response);
      if (result.error === 'TOKEN_REFRESHED') {
        const retry = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(requireAuth),
          cache: 'no-store',
        });
        return await this.handleResponse<T>(retry); // TOKEN_REFRESHED_RETRY
      }
      return result;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(\`[API] GET Error:\`, error);
      }`;

  if (!t.includes(oldGet)) throw new Error('GET handleResponse missing');
  t = t.replace(oldGet, newGet);

  const oldPost = `      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(\`[API] POST Error:\`, error);
      }`;

  const newPost = `      const result = await this.handleResponse<T>(response);
      if (result.error === 'TOKEN_REFRESHED') {
        const retry = await fetch(url, {
          method: 'POST',
          headers: this.buildHeaders(requireAuth),
          body: body ? JSON.stringify(body) : undefined,
        });
        return await this.handleResponse<T>(retry); // TOKEN_REFRESHED_RETRY
      }
      return result;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(\`[API] POST Error:\`, error);
      }`;

  if (!t.includes(oldPost)) throw new Error('POST handleResponse missing');
  t = t.replace(oldPost, newPost);

  return t;
});

// --- ordersService: stop forcing stripe (breaks COD sessions / UX) ---
patch('src/services/ordersService.ts', (t) => {
  const old = `    const validPaymentMethods = ['stripe'];
    let normalizedPaymentMethod = orderData.payment_method 
      ? orderData.payment_method.toLowerCase() 
      : 'stripe';
    
    // Validate payment method
    if (!validPaymentMethods.includes(normalizedPaymentMethod)) {
      console.warn(\`Invalid payment method: \${normalizedPaymentMethod}. Defaulting to 'stripe'.\`);
      normalizedPaymentMethod = 'stripe';
    }

    // Backend accepts addresses as objects (will be JSON stringified automatically)
    // Backend accepts 'items' or 'cart_items' - prefer 'items' as per documentation
    const orderPayload: any = {
      ...orderData,
      // Use 'items' from orderData if provided, otherwise use 'cart_items'
      items: orderData.items || orderData.cart_items || [],
      payment_method: 'stripe',`;

  const neu = `    const validPaymentMethods = ['stripe', 'cod', 'paypal', 'card', 'credit_card', 'dummy'];
    let normalizedPaymentMethod = orderData.payment_method 
      ? String(orderData.payment_method).toLowerCase() 
      : 'cod';
    
    // Validate payment method
    if (!validPaymentMethods.includes(normalizedPaymentMethod)) {
      console.warn(\`Invalid payment method: \${normalizedPaymentMethod}. Defaulting to 'cod'.\`);
      normalizedPaymentMethod = 'cod';
    }

    // Backend accepts addresses as objects (will be JSON stringified automatically)
    // Backend accepts 'items' or 'cart_items' - prefer 'items' as per documentation
    const orderPayload: any = {
      ...orderData,
      // Use 'items' from orderData if provided, otherwise use 'cart_items'
      items: orderData.items || orderData.cart_items || [],
      payment_method: normalizedPaymentMethod,`;

  if (!t.includes(old)) {
    if (t.includes("'cod', 'paypal'")) console.log('ordersService payment already');
    else throw new Error('ordersService payment block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});
