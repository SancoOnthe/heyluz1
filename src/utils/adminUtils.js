/**
 * UTILIDADES PARA PANEL DE ADMINISTRADOR
 * Funciones compartidas entre todos los componentes del admin
 */

// Claves de localStorage
export const STORAGE_KEYS = {
  PRODUCTS: 'heyluz_products',
  ORDERS: 'heyluz_orders',
  SETTINGS: 'heyluz_settings',
  FEATURED_ORDER: 'heyluz_featured_order'
};

// Formatear precio según configuración
export const formatPrice = (amount) => {
  const num = Number(amount || 0);
  
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    const currency = settings.currency || 'COP';
    
    // Formato colombiano sin decimales
    if (currency === 'COP') {
      return `$ ${num.toLocaleString('es-CO', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
    }
    
    // Otros formatos
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  } catch (error) {
    return `$ ${num.toLocaleString('es-CO', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  }
};

// Obtener productos desde localStorage
export const getProducts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

// Guardar productos en localStorage
export const saveProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error('Error saving products:', error);
    return false;
  }
};

// Async fetch to server API (Supabase when configured)
export async function fetchProductsFromServer() {
  try {
    const res = await fetch('/api/admin/products');
    if (!res.ok) return [];
    const body = await res.json();
    return body.data || [];
  } catch (e) {
    console.warn('Error fetching products from server', e && e.message);
    return [];
  }
}

// Obtener pedidos desde localStorage
export const getOrders = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
};

// Guardar pedidos en localStorage
export const saveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Error saving orders:', error);
    return false;
  }
};

// Obtener configuración desde localStorage
export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
};

// Guardar configuración en localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Configuración por defecto
export const getDefaultSettings = () => ({
  name: 'HEYLUZ AROMAS',
  logo: '',
  currency: 'COP',
  tax: 0,
  shipping: 0,
  freeFrom: 0,
  taxIncluded: false,
  orderPrefix: 'ORD-',
  orderNext: 1,
  invoicePrefix: 'FAC-',
  invoiceNext: 1,
  paymentMethods: {
    visa: true,
    mastercard: true,
    paypal: true,
    applePay: false
  },
  banner: {
    active: false,
    text: ''
  },
  coupons: []
});

// Generar ID único
export const generateId = (prefix = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Calcular estadísticas de pedidos
export const computeOrderStats = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      today: 0,
      month: 0,
      total: 0,
      ordersCount: 0,
      topProducts: []
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  let today = 0;
  let month = 0;
  let total = 0;
  const productCounts = new Map();

  orders.forEach(order => {
    const orderTotal = Number(order.total || 0);
    total += orderTotal;

    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '';
    if (orderDate === todayStr) {
      today += orderTotal;
    }
    
    const orderMonth = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 7) : '';
    if (orderMonth === monthStr) {
      month += orderTotal;
    }

    // Contar productos vendidos
    (order.items || []).forEach(item => {
      const name = item.name || 'Producto';
      const quantity = Number(item.quantity || 1);
      productCounts.set(name, (productCounts.get(name) || 0) + quantity);
    });
  });

  // Top 5 productos
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    today,
    month,
    total,
    ordersCount: orders.length,
    topProducts
  };
};

// Exportar datos a JSON
export const exportToJSON = (data, filename = 'export.json') => {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return false;
  }
};

// Exportar a CSV
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  try {
    const rows = [headers].concat(data);
    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return false;
  }
};

// Sembrar datos de demostración
export const seedDemoData = () => {
  // Productos de ejemplo
  const demoProducts = [
    {
      id: 'prod-1',
      name: 'Elegancia Dorada',
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      category: 'mujer',
      price: 89990,
      originalPrice: 119990,
      badge: 'Oferta',
      stock: 25,
      lowStock: 5,
      description: 'Fragancia floral con notas de rosa y jazmín',
      ingredients: 'Rosa, Jazmín, Vainilla',
      published: true,
      variants: []
    },
    {
      id: 'prod-2',
      name: 'Brisa Marina',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
      category: 'unisex',
      price: 69990,
      badge: 'Nuevo',
      stock: 40,
      lowStock: 5,
      description: 'Aroma fresco con notas cítricas',
      ingredients: 'Limón, Bergamota, Cedro',
      published: true,
      variants: []
    },
    {
      id: 'prod-3',
      name: 'Noche Oscura',
      image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6f?w=400',
      category: 'hombre',
      price: 129990,
      badge: 'Popular',
      stock: 15,
      lowStock: 5,
      description: 'Fragancia intensa y masculina',
      ingredients: 'Ámbar, Cuero, Tabaco',
      published: true,
      variants: []
    }
  ];

  // Pedidos de ejemplo
  const demoOrders = [
    {
      id: 'ORD-1001',
      createdAt: new Date().toISOString(),
      status: 'pagado',
      items: [
        { name: 'Elegancia Dorada', quantity: 2, price: 89990 }
      ],
      total: 179980,
      user: { username: 'demo@heyluz.com', email: 'demo@heyluz.com' },
      invoiceId: 'FAC-1001'
    },
    {
      id: 'ORD-1002',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Ayer
      status: 'enviado',
      items: [
        { name: 'Brisa Marina', quantity: 1, price: 69990 },
        { name: 'Noche Oscura', quantity: 1, price: 129990 }
      ],
      total: 199980,
      user: { username: 'cliente@example.com', email: 'cliente@example.com' },
      invoiceId: 'FAC-1002'
    }
  ];

  saveProducts(demoProducts);
  saveOrders(demoOrders);
  
  return {
    products: demoProducts.length,
    orders: demoOrders.length
  };
};

// Generar una factura para un pedido (actualiza orders y settings)
export const generateInvoiceForOrder = (orderId) => {
  try {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    const order = orders[idx];
    const settings = getSettings();
    if (!order.invoiceId) {
      const prefix = settings.invoicePrefix || 'FAC-';
      const next = settings.invoiceNext || 1;
      const invoiceId = `${prefix}${String(next).padStart(4, '0')}`;
      orders[idx] = { ...order, invoiceId };
      settings.invoiceNext = Number(next) + 1;
      saveOrders(orders);
      saveSettings(settings);
      return orders[idx];
    }
    return order; // ya tenía factura
  } catch (e) {
    console.error('Error generating invoice:', e);
    return null;
  }
};

// Abrir una ventana con HTML imprimible de la factura
export const openInvoiceWindow = (order) => {
  try {
    if (!order) return;
    const itemsHtml = (order.items || []).map(it => `
      <tr>
        <td>${(it.name || '').replace(/</g, '&lt;')}</td>
        <td style="text-align:right">${formatPrice(it.price)}</td>
        <td style="text-align:center">${Number(it.quantity || 1)}</td>
        <td style="text-align:right">${formatPrice((Number(it.price)||0) * (Number(it.quantity)||1))}</td>
      </tr>
    `).join('');

    const invoiceNumber = order.invoiceId || '';
    const date = new Date(order.createdAt || Date.now()).toLocaleString();
    const customerName = order.user?.name || order.user?.username || 'Cliente';
    const customerEmail = order.user?.email || '';

    const html = `
      <html>
      <head>
        <title>Factura ${invoiceNumber}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111 }
          .header { display:flex; justify-content:space-between; align-items:center }
          .company { font-weight:700; font-size:18px }
          .invoice-id { font-size:18px; font-weight:700 }
          table { width:100%; border-collapse: collapse; margin-top:16px }
          th, td { border-bottom:1px solid #eee; padding:8px }
          th { text-align:left; background:#f9f9f9 }
          .totals { margin-top:12px; width:100%; display:block }
          .totals .row { display:flex; justify-content:space-between; padding:6px 0 }
          .actions { margin-top:18px }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">HEYLUZ AROMAS</div>
            <div class="muted">Factura generada automáticamente</div>
          </div>
          <div style="text-align:right">
            <div class="invoice-id">${invoiceNumber}</div>
            <div class="muted">${date}</div>
          </div>
        </div>

        <div style="margin-top:18px">
          <strong>Cliente:</strong> ${customerName} <br />
          <strong>Email:</strong> ${customerEmail}
        </div>

        <table>
          <thead>
            <tr><th>Descripción</th><th style="text-align:right">Precio</th><th style="text-align:center">Cantidad</th><th style="text-align:right">Subtotal</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal</span><strong>${formatPrice(order.subtotal || order.total)}</strong></div>
          ${order.shipping ? `<div class="row"><span>Envío</span><strong>${formatPrice(order.shipping)}</strong></div>` : ''}
          ${order.tax ? `<div class="row"><span>IVA</span><strong>${formatPrice(order.tax)}</strong></div>` : ''}
          ${order.discount ? `<div class="row"><span>Descuento</span><strong>- ${formatPrice(order.discount)}</strong></div>` : ''}
          <div class="row" style="font-size:1.1rem"><span>Total</span><strong>${formatPrice(order.total)}</strong></div>
        </div>

        <div class="actions">
          <button onclick="window.print()" style="padding:8px 12px;">Imprimir / Guardar como PDF</button>
        </div>
      </body>
      </html>
    `;

    const w = window.open('', '_blank', 'noopener');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch (e) {
    console.error('Error opening invoice window', e);
  }
};
