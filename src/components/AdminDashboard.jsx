'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getOrders, 
  getProducts,
  computeOrderStats, 
  formatPrice,
  seedDemoData,
  exportToJSON,
  STORAGE_KEYS 
} from '@/utils/adminUtils';

export default function AdminDashboard({ user }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({
    today: 0,
    month: 0,
    total: 0,
    ordersCount: 0,
    topProducts: []
  });
  const [productsCount, setProductsCount] = useState(0);

  // Marcar como montado (cliente)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar datos desde localStorage
  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  const loadData = () => {
    try {
      const orders = getOrders();
        (async () => {
          const server = await fetchProductsFromServer();
          const products = (server && server.length > 0) ? server : getProducts();
          setProductsCount(products.length);
        })();
      
      const orderStats = computeOrderStats(orders);
      setStats(orderStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleSeedDemo = () => {
    try {
      const result = seedDemoData();
      alert(`✅ Datos de demostración cargados:\n${result.products} productos\n${result.orders} pedidos`);
      loadData();
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert('❌ Error al cargar datos de demostración');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        products: getProducts(),
        orders: getOrders(),
        settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}'),
        exportDate: new Date().toISOString()
      };
      
      exportToJSON(data, `heyluz-backup-${Date.now()}.json`);
      alert('✅ Datos exportados correctamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('❌ Error al exportar datos');
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        
        if (data.products) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
        }
        if (data.orders) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
        }
        if (data.settings) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        
        alert('✅ Datos importados correctamente');
        loadData();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('❌ Error al importar datos. Verifica el formato del archivo.');
      }
    };
    reader.readAsText(file);
  };

  // Mostrar loading hasta que esté montado (evitar hidratación)
  if (!isMounted) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Dashboard</h1>
        </div>
        <div className="card">
          <p className="muted">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <div className="actions inline">
          <button 
            className="btn btn-outline" 
            onClick={handleSeedDemo}
            title="Cargar datos de demostración"
          >
            <i className="fas fa-seedling"></i> Sembrar demo
          </button>
          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            <i className="fas fa-file-import"></i> Importar datos
            <input 
              type="file" 
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            className="btn btn-outline"
            onClick={handleExportData}
            title="Exportar todos los datos"
          >
            <i className="fas fa-file-export"></i> Exportar datos
          </button>
        </div>
      </div>

      <div className="admin-grid">
        {/* Métricas rápidas */}
        <div className="card">
          <h3>Métricas rápidas</h3>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-label">Ventas hoy</div>
              <div className="stat-value">{formatPrice(stats.today)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Ventas este mes</div>
              <div className="stat-value">{formatPrice(stats.month)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Pedidos totales</div>
              <div className="stat-value">{stats.ordersCount}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Ingresos totales</div>
              <div className="stat-value">{formatPrice(stats.total)}</div>
            </div>
          </div>
        </div>

        {/* Top productos */}
        <div className="card">
          <div className="card-header">
            <h3>Top productos</h3>
            <span className="pill pill-primary">{productsCount} total</span>
          </div>
          {stats.topProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <i className="fas fa-box-open" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}></i>
              <p>No hay datos suficientes</p>
              <p className="muted" style={{ fontSize: '0.9rem' }}>Carga datos demo o crea algunos pedidos</p>
            </div>
          ) : (
            <ul className="simple-list">
              {stats.topProducts.map((product, idx) => (
                <li key={idx}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pill" style={{ 
                      minWidth: '24px', 
                      textAlign: 'center',
                      background: idx === 0 ? 'var(--color-primary)' : 'var(--gray-light)',
                      color: idx === 0 ? '#000' : 'var(--text-primary)'
                    }}>
                      {idx + 1}
                    </span>
                    <strong>{product.name}</strong>
                    <span className="muted">× {product.count}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <h3>Acciones rápidas</h3>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => router.push('/admin/productos')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <i className="fas fa-box"></i> Gestionar productos
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => router.push('/admin/ventas')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <i className="fas fa-receipt"></i> Ver pedidos
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => router.push('/admin/reportes')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <i className="fas fa-chart-line"></i> Ver reportes
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => router.push('/admin/marketing')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <i className="fas fa-bullhorn"></i> Marketing
            </button>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="card">
          <h3>Información del sistema</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="muted">Productos activos:</span>
              <strong>{productsCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="muted">Total pedidos:</span>
              <strong>{stats.ordersCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="muted">Usuario actual:</span>
              <strong>{user?.email || 'Admin'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span className="muted">Rol:</span>
              <span className="pill pill-primary">{user?.role || 'admin'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
