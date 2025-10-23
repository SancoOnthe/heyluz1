/**
 * DATOS DE PRUEBA PARA DASHBOARD DE USUARIO
 * Versión para navegador (sin módulos ES6)
 * 
 * USO:
 * 1. Abre http://localhost:3000/test-data-loader.html
 * 2. Haz clic en "Cargar Datos de Prueba"
 * 3. Ve a /user y verás los datos cargados
 */

const dashboardTestData = (function() {
  
  // Productos de ejemplo para wishlist
  const sampleProducts = [
    {
      id: '1',
      name: 'Perfume Elegance',
      price: 89990,
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      description: 'Fragancia floral con notas de rosa y jazmín'
    },
    {
      id: '2',
      name: 'Cologne Adventure',
      price: 69990,
      image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=400',
      description: 'Aroma fresco y masculino con cítricos'
    },
    {
      id: '3',
      name: 'Essence Mystique',
      price: 129990,
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
      description: 'Perfume oriental con ámbar y vainilla'
    },
    {
      id: '4',
      name: 'Spray Océano',
      price: 59990,
      image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400',
      description: 'Fragancia marina y refrescante'
    },
    {
      id: '5',
      name: 'Noir Intense',
      price: 149990,
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
      description: 'Perfume intenso con notas amaderadas'
    }
  ];

  // Direcciones de ejemplo
  const sampleAddresses = [
    {
      id: '1',
      name: 'Casa',
      street: 'Calle 45 #12-34, Chapinero',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zip: '110221',
      country: 'Colombia',
      isDefault: true,
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: '2',
      name: 'Oficina',
      street: 'Carrera 7 #71-21, Piso 5',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zip: '110231',
      country: 'Colombia',
      isDefault: false,
      createdAt: new Date('2024-02-20').toISOString()
    },
    {
      id: '3',
      name: 'Casa de mamá',
      street: 'Calle 10 #5-60, El Poblado',
      city: 'Medellín',
      state: 'Antioquia',
      zip: '050021',
      country: 'Colombia',
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
        { name: 'Perfume Elegance', quantity: 1, price: 89990 },
        { name: 'Cologne Adventure', quantity: 2, price: 69990 }
      ],
      total: 229970,
      status: 'pagado',
      createdAt: new Date('2024-03-15T10:30:00').toISOString()
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
        { name: 'Essence Mystique', quantity: 1, price: 129990 }
      ],
      total: 129990,
      status: 'enviado',
      createdAt: new Date('2024-03-18T14:20:00').toISOString()
    },
    {
      id: 'ORD-003',
      invoiceId: null,
      user: {
        username: 'user',
        email: 'user@heyluz.com',
        name: 'Usuario Demo'
      },
      items: [
        { name: 'Spray Océano', quantity: 3, price: 59990 },
        { name: 'Noir Intense', quantity: 1, price: 149990 }
      ],
      total: 329960,
      status: 'pendiente',
      createdAt: new Date('2024-03-20T09:15:00').toISOString()
    }
  ];

  // Cupones de ejemplo
  const sampleCoupons = [
    {
      code: 'BIENVENIDO10',
      type: 'percent',
      value: 10,
      scope: 'all',
      active: true,
      expiresAt: new Date('2024-12-31').toISOString()
    },
    {
      code: 'PRIMAVERA20',
      type: 'percent',
      value: 20,
      scope: 'category',
      category: 'mujer',
      active: true,
      expiresAt: new Date('2024-06-30').toISOString()
    },
    {
      code: 'ENVIOGRATIS',
      type: 'fixed',
      value: 15000,
      scope: 'all',
      active: true,
      expiresAt: null
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
  function loadTestData() {
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

      console.log('\n🎉 ¡Todos los datos de prueba cargados exitosamente!');
      console.log('🔄 Recarga la página /user para ver los cambios\n');

      return { 
        success: true, 
        message: 'Datos cargados correctamente',
        stats: {
          wishlist: sampleProducts.length,
          addresses: sampleAddresses.length,
          orders: sampleOrders.length,
          coupons: sampleCoupons.length
        }
      };
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Limpia todos los datos de prueba del localStorage
   */
  function clearTestData() {
    try {
      localStorage.removeItem('heyluz_wishlist');
      localStorage.removeItem('heyluz_addresses');
      localStorage.removeItem('heyluz_orders');
      localStorage.removeItem('heyluz_settings');
      localStorage.removeItem('heyluz_profile');

      console.log('✅ Todos los datos eliminados');
      console.log('🔄 Recarga la página para ver los cambios\n');

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
   * Muestra información del estado actual del localStorage
   */
  function showStorageInfo() {
    const wishlist = JSON.parse(localStorage.getItem('heyluz_wishlist') || '[]');
    const addresses = JSON.parse(localStorage.getItem('heyluz_addresses') || '[]');
    const orders = JSON.parse(localStorage.getItem('heyluz_orders') || '[]');
    const settings = JSON.parse(localStorage.getItem('heyluz_settings') || '{}');
    const profile = JSON.parse(localStorage.getItem('heyluz_profile') || '{}');

    console.log('📊 ESTADO ACTUAL DEL STORAGE');
    console.log('─'.repeat(50));
    console.log('Wishlist:', wishlist.length, 'productos');
    console.log('Direcciones:', addresses.length, 'direcciones');
    console.log('Pedidos:', orders.length, 'pedidos');
    console.log('Cupones:', (settings.coupons || []).length, 'cupones');
    console.log('Perfil:', profile.name || 'No configurado');
    console.log('─'.repeat(50));

    return {
      wishlist,
      addresses,
      orders,
      settings,
      profile
    };
  }

  /**
   * Agrega un producto al wishlist
   */
  function addProductToWishlist(product) {
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
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }

  // API pública
  return {
    loadTestData,
    clearTestData,
    showStorageInfo,
    addProductToWishlist,
    // Exportar datos para uso directo
    sampleProducts,
    sampleAddresses,
    sampleOrders,
    sampleCoupons,
    sampleProfile
  };
})();

// Hacer disponible globalmente
window.dashboardTestData = dashboardTestData;

console.log('✅ dashboardTestData cargado y disponible');
console.log('📝 Comandos disponibles:');
console.log('  - dashboardTestData.loadTestData()');
console.log('  - dashboardTestData.clearTestData()');
console.log('  - dashboardTestData.showStorageInfo()');
