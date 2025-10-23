/**
 * DATOS DE PRUEBA PARA DASHBOARD DE USUARIO
 * 
 * Este archivo contiene funciones helper para poblar localStorage
 * con datos de prueba para el dashboard de usuario.
 * 
 * USO:
 * 1. Abre la consola del navegador en /user
 * 2. Ejecuta: loadTestData()
 * 3. Recarga la página
 */

// Productos de ejemplo para wishlist
const sampleProducts = [
  {
    id: '1',
    name: 'Perfume Elegance',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    description: 'Fragancia floral con notas de rosa y jazmín'
  },
  {
    id: '2',
    name: 'Cologne Adventure',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=400',
    description: 'Aroma fresco y masculino con cítricos'
  },
  {
    id: '3',
    name: 'Essence Mystique',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
    description: 'Perfume oriental con ámbar y vainilla'
  },
  {
    id: '4',
    name: 'Spray Océano',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400',
    description: 'Fragancia marina y refrescante'
  },
  {
    id: '5',
    name: 'Noir Intense',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
    description: 'Perfume intenso con notas amaderadas'
  }
];

// Direcciones de ejemplo
const sampleAddresses = [
  {
    id: '1',
    name: 'Casa',
    street: 'Av. Reforma #123, Col. Centro',
    city: 'Ciudad de México',
    state: 'CDMX',
    zip: '06000',
    country: 'México',
    isDefault: true,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    name: 'Oficina',
    street: 'Paseo de la Reforma #456, Piso 12',
    city: 'Ciudad de México',
    state: 'CDMX',
    zip: '06500',
    country: 'México',
    isDefault: false,
    createdAt: new Date('2024-02-20').toISOString()
  },
  {
    id: '3',
    name: 'Casa de mamá',
    street: 'Calle Juárez #789, Col. Lindavista',
    city: 'Guadalajara',
    state: 'Jalisco',
    zip: '44100',
    country: 'México',
    isDefault: false,
    createdAt: new Date('2024-03-10').toISOString()
  }
];

// Pedidos de ejemplo
const sampleOrders = [
  {
    id: 'ORD-001',
    invoiceId: 'INV-2024-001',
    user: {
      username: 'user',
      email: 'user@heyluz.com',
      name: 'Usuario Demo'
    },
    items: [
      { name: 'Perfume Elegance', quantity: 1, price: 89.99 },
      { name: 'Cologne Adventure', quantity: 2, price: 69.99 }
    ],
    total: 229.97,
    status: 'entregado',
    createdAt: new Date('2024-01-15T10:30:00').toISOString(),
    deliveredAt: new Date('2024-01-20T14:00:00').toISOString()
  },
  {
    id: 'ORD-002',
    invoiceId: 'INV-2024-002',
    user: {
      username: 'user',
      email: 'user@heyluz.com',
      name: 'Usuario Demo'
    },
    items: [
      { name: 'Essence Mystique', quantity: 1, price: 129.99 }
    ],
    total: 129.99,
    status: 'en_camino',
    createdAt: new Date('2024-02-05T15:45:00').toISOString()
  },
  {
    id: 'ORD-003',
    invoiceId: 'INV-2024-003',
    user: {
      username: 'user',
      email: 'user@heyluz.com',
      name: 'Usuario Demo'
    },
    items: [
      { name: 'Spray Océano', quantity: 3, price: 59.99 },
      { name: 'Noir Intense', quantity: 1, price: 149.99 }
    ],
    total: 329.96,
    status: 'pendiente',
    createdAt: new Date('2024-03-12T09:20:00').toISOString()
  }
];

// Cupones de ejemplo
const sampleCoupons = [
  {
    code: 'BIENVENIDA20',
    discount: 20,
    type: 'percentage',
    active: true,
    description: 'Descuento de bienvenida',
    minPurchase: 100,
    expiresAt: new Date('2024-12-31').toISOString()
  },
  {
    code: 'ENVIOGRATIS',
    discount: 0,
    type: 'shipping',
    active: true,
    description: 'Envío gratis en tu próxima compra',
    minPurchase: 50,
    expiresAt: new Date('2024-06-30').toISOString()
  },
  {
    code: 'VERANO10',
    discount: 10,
    type: 'percentage',
    active: true,
    description: 'Descuento de verano',
    minPurchase: 0,
    expiresAt: new Date('2024-08-31').toISOString()
  }
];

// Perfil de ejemplo
const sampleProfile = {
  name: 'Usuario Demo',
  email: 'user@heyluz.com',
  phone: '+57 310 123 4567',
  preferences: {
    newsletter: true,
    notifications: true,
    language: 'es',
    currency: 'COP'
  }
};

/**
 * Carga todos los datos de prueba en localStorage
 */
export function loadTestData() {
  try {
    // Cargar wishlist
    localStorage.setItem('heyluz_wishlist', JSON.stringify(sampleProducts));
    console.log('✅ Wishlist cargada:', sampleProducts.length, 'productos');

    // Cargar direcciones
    localStorage.setItem('heyluz_addresses', JSON.stringify(sampleAddresses));
    console.log('✅ Direcciones cargadas:', sampleAddresses.length, 'direcciones');

    // Cargar pedidos
    localStorage.setItem('heyluz_orders', JSON.stringify(sampleOrders));
    console.log('✅ Pedidos cargados:', sampleOrders.length, 'pedidos');

    // Cargar cupones
    const settings = {
      coupons: sampleCoupons,
      currency: 'COP'
    };
    localStorage.setItem('heyluz_settings', JSON.stringify(settings));
    console.log('✅ Cupones cargados:', sampleCoupons.length, 'cupones');

    // Cargar perfil
    localStorage.setItem('heyluz_profile', JSON.stringify(sampleProfile));
    console.log('✅ Perfil cargado');

    console.log('\n🎉 ¡Todos los datos de prueba cargados! Recarga la página para ver los cambios.\n');
    
    return {
      success: true,
      message: 'Datos de prueba cargados correctamente'
    };
  } catch (error) {
    console.error('❌ Error al cargar datos de prueba:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Limpia todos los datos de prueba
 */
export function clearTestData() {
  try {
    localStorage.removeItem('heyluz_wishlist');
    localStorage.removeItem('heyluz_addresses');
    localStorage.removeItem('heyluz_orders');
    localStorage.removeItem('heyluz_settings');
    localStorage.removeItem('heyluz_profile');
    
    console.log('✅ Todos los datos de prueba eliminados. Recarga la página.');
    
    return {
      success: true,
      message: 'Datos eliminados correctamente'
    };
  } catch (error) {
    console.error('❌ Error al eliminar datos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Agrega un solo producto al wishlist
 */
export function addProductToWishlist(product) {
  try {
    const wishlist = JSON.parse(localStorage.getItem('heyluz_wishlist') || '[]');
    const newProduct = {
      ...product,
      addedAt: new Date().toISOString()
    };
    wishlist.push(newProduct);
    localStorage.setItem('heyluz_wishlist', JSON.stringify(wishlist));
    console.log('✅ Producto agregado al wishlist:', product.name);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al agregar producto:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Muestra el estado actual del localStorage
 */
export function showStorageInfo() {
  const wishlist = JSON.parse(localStorage.getItem('heyluz_wishlist') || '[]');
  const addresses = JSON.parse(localStorage.getItem('heyluz_addresses') || '[]');
  const orders = JSON.parse(localStorage.getItem('heyluz_orders') || '[]');
  const settings = JSON.parse(localStorage.getItem('heyluz_settings') || '{}');
  const profile = JSON.parse(localStorage.getItem('heyluz_profile') || '{}');

  console.log('\n📊 ESTADO ACTUAL DEL STORAGE:');
  console.log('─────────────────────────────');
  console.log('Wishlist:', wishlist.length, 'productos');
  console.log('Direcciones:', addresses.length, 'direcciones');
  console.log('Pedidos:', orders.length, 'pedidos');
  console.log('Cupones:', (settings.coupons || []).length, 'cupones');
  console.log('Perfil:', profile.name || 'No configurado');
  console.log('─────────────────────────────\n');

  return {
    wishlist,
    addresses,
    orders,
    settings,
    profile
  };
}

// Exportar todo para uso en consola
if (typeof window !== 'undefined') {
  window.dashboardTestData = {
    loadTestData,
    clearTestData,
    addProductToWishlist,
    showStorageInfo,
    sampleProducts,
    sampleAddresses,
    sampleOrders,
    sampleCoupons,
    sampleProfile
  };
}
