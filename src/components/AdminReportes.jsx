'use client';

import { useState, useEffect } from 'react';
import { 
  getOrders, 
  getProducts,
  formatPrice
} from '@/utils/adminUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminReportes() {
  // Detectar modo oscuro y reaccionar a cambios de tema
  const [isDark, setIsDark] = useState(false);
  const [cssVars, setCssVars] = useState({});
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains('theme-dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  // Leer variables CSS para gráficos y actualizar al cambiar el tema
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const styles = getComputedStyle(document.documentElement);
    setCssVars({
      primary: styles.getPropertyValue('--chart-primary').trim(),
      primaryFill: styles.getPropertyValue('--chart-primary-fill').trim(),
      barBg: styles.getPropertyValue('--chart-bar-bg').trim(),
      barBorder: styles.getPropertyValue('--chart-bar-border').trim(),
      accent1: styles.getPropertyValue('--chart-accent-1').trim(),
      accent2: styles.getPropertyValue('--chart-accent-2').trim(),
      accent3: styles.getPropertyValue('--chart-accent-3').trim(),
      title: styles.getPropertyValue('--chart-title').trim(),
      tick: styles.getPropertyValue('--chart-tick').trim(),
      grid: styles.getPropertyValue('--chart-grid').trim()
    });
  }, [isDark]);
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState('30'); // 7, 30, 90, year, custom
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Métricas
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    totalProducts: 0,
    conversionRate: 0,
    topProduct: null
  });

  // Datos para gráficas
  const [dailySalesData, setDailySalesData] = useState({ labels: [], data: [] });
  const [topProductsData, setTopProductsData] = useState({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState({ labels: [], data: [] });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, period, customDateFrom, customDateTo]);

  const loadData = () => {
    const allOrders = getOrders();
    (async () => {
      const server = await fetchProductsFromServer();
      const allProducts = (server && server.length > 0) ? server : getProducts();
      setProducts(allProducts);
    })();

    // Filtrar órdenes por período
    const filteredOrders = filterOrdersByPeriod(allOrders);
    setOrders(filteredOrders);

    // Calcular métricas
    calculateMetrics(filteredOrders, allProducts);

    // Preparar datos para gráficas
    prepareDailySalesChart(filteredOrders);
    prepareTopProductsChart(filteredOrders, allProducts);
    prepareCategoryChart(filteredOrders, allProducts);
  };

  const filterOrdersByPeriod = (orders) => {
    const now = new Date();
    let startDate;

    if (period === 'custom') {
      if (!customDateFrom || !customDateTo) return orders;
      startDate = new Date(customDateFrom);
      const endDate = new Date(customDateTo);
      endDate.setHours(23, 59, 59, 999);
      return orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    switch (period) {
      case '7':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return orders.filter(o => new Date(o.createdAt) >= startDate);
  };

  const calculateMetrics = (orders, products) => {
    // Solo considerar pedidos completados para las métricas
    const completedOrders = orders.filter(o => 
      o.status === 'delivered' || o.status === 'shipped' || o.status === 'processing'
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Contar productos vendidos
    let totalProductsSold = 0;
    const productSales = {};

    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        totalProductsSold += item.quantity || 1;
        const productId = item.id || item.name;
        productSales[productId] = (productSales[productId] || 0) + (item.quantity || 1);
      });
    });

    // Producto más vendido
    let topProduct = null;
    let maxSales = 0;
    Object.entries(productSales).forEach(([id, sales]) => {
      if (sales > maxSales) {
        maxSales = sales;
        const product = products.find(p => p.id === id || p.name === id);
        topProduct = product ? { ...product, sales } : { name: id, sales };
      }
    });

    // Tasa de conversión (simulada)
    const conversionRate = 2.5; // En un proyecto real, esto vendría de analytics

    setMetrics({
      totalRevenue,
      totalOrders,
      averageTicket,
      totalProducts: totalProductsSold,
      conversionRate,
      topProduct
    });
  };

  const prepareDailySalesChart = (orders) => {
    const now = new Date();
    const days = period === '7' ? 7 : period === '30' ? 30 : period === '90' ? 90 : 30;
    
    // Crear array de fechas
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      dateMap[dateKey] = 0;
    }

    // Contar ventas por día
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
        if (dateMap.hasOwnProperty(dateKey)) {
          dateMap[dateKey] += order.total || 0;
        }
      }
    });

    setDailySalesData({
      labels: Object.keys(dateMap),
      data: Object.values(dateMap)
    });
  };

  const prepareTopProductsChart = (orders, products) => {
    const productSales = {};

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items?.forEach(item => {
          const productId = item.id || item.name;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productId].quantity += item.quantity || 1;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    // Ordenar por cantidad vendida
    const sorted = Object.entries(productSales)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10);

    setTopProductsData({
      labels: sorted.map(([, data]) => data.name),
      data: sorted.map(([, data]) => data.quantity)
    });
  };

  const prepareCategoryChart = (orders, products) => {
    const categorySales = {
      mujer: 0,
      hombre: 0,
      unisex: 0
    };

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items?.forEach(item => {
          const product = products.find(p => p.id === item.id || p.name === item.name);
          const category = product?.category || 'unisex';
          categorySales[category] += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    setCategoryData({
      labels: ['Mujer', 'Hombre', 'Unisex'],
      data: [categorySales.mujer, categorySales.hombre, categorySales.unisex]
    });
  };

  // Configuraciones de gráficas
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Ventas diarias',
        font: { size: 16, weight: 'bold' },
        color: cssVars.title || (isDark ? '#fff' : '#222')
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17,20,26,0.95)' : 'rgba(255,255,255,0.95)',
        titleColor: isDark ? '#fff' : '#111',
        bodyColor: isDark ? '#e6e9ef' : '#222',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: 1,
        callbacks: {
          label: (context) => formatPrice(context.parsed.y)
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: cssVars.tick || (isDark ? '#b3b8c5' : '#222')
        },
        grid: {
          color: cssVars.grid || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatPrice(value),
          color: cssVars.tick || (isDark ? '#b3b8c5' : '#222')
        },
        grid: {
          color: cssVars.grid || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')
        }
      }
    }
  };

  const lineChartData = {
    labels: dailySalesData.labels,
    datasets: [
      {
        label: 'Ventas',
        data: dailySalesData.data,
        borderColor: cssVars.primary || (isDark ? '#f7c873' : 'rgb(99, 102, 241)'),
        backgroundColor: cssVars.primaryFill || (isDark ? 'rgba(247,200,115,0.08)' : 'rgba(99, 102, 241, 0.1)'),
        fill: true,
        tension: 0.4
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top 10 productos más vendidos',
        font: { size: 16, weight: 'bold' },
        color: cssVars.title || (isDark ? '#fff' : '#222')
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17,20,26,0.95)' : 'rgba(255,255,255,0.95)',
        titleColor: isDark ? '#fff' : '#111',
        bodyColor: isDark ? '#e6e9ef' : '#222',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: cssVars.tick || (isDark ? '#b3b8c5' : '#222') },
        grid: { color: cssVars.grid || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') }
      },
      y: {
        ticks: { color: cssVars.tick || (isDark ? '#b3b8c5' : '#222') },
        grid: { color: cssVars.grid || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') }
      }
    }
  };

  const barChartData = {
    labels: topProductsData.labels,
    datasets: [
      {
        label: 'Unidades vendidas',
        data: topProductsData.data,
        backgroundColor: cssVars.barBg || (isDark ? 'rgba(247,200,115,0.8)' : 'rgba(99, 102, 241, 0.8)'),
        borderColor: cssVars.barBorder || (isDark ? '#f7c873' : 'rgb(99, 102, 241)'),
        borderWidth: 1
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: cssVars.tick || (isDark ? '#b3b8c5' : '#222')
        }
      },
      title: {
        display: true,
        text: 'Ventas por categoría',
        font: { size: 16, weight: 'bold' },
        color: cssVars.title || (isDark ? '#fff' : '#222')
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17,20,26,0.95)' : 'rgba(255,255,255,0.95)',
        titleColor: isDark ? '#fff' : '#111',
        bodyColor: isDark ? '#e6e9ef' : '#222',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = formatPrice(context.parsed);
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  const doughnutChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: [
          cssVars.accent1 || (isDark ? 'rgba(247, 200, 115, 0.9)' : 'rgba(236, 72, 153, 0.8)'),
          cssVars.accent2 || (isDark ? 'rgba(99, 102, 241, 0.9)' : 'rgba(59, 130, 246, 0.8)'),
          cssVars.accent3 || (isDark ? 'rgba(52, 211, 153, 0.9)' : 'rgba(168, 85, 247, 0.8)')
        ],
        borderColor: [
          cssVars.accent1 || (isDark ? '#f7c873' : 'rgb(236, 72, 153)'),
          cssVars.accent2 || (isDark ? 'rgb(99, 102, 241)' : 'rgb(59, 130, 246)'),
          cssVars.accent3 || (isDark ? 'rgb(52, 211, 153)' : 'rgb(168, 85, 247)')
        ],
        borderWidth: 2
      }
    ]
  };

  if (!isMounted) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Reportes</h1>
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
        <h1>Reportes y Estadísticas</h1>
        <div className="actions inline">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            title="Seleccionar período"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="year">Este año</option>
            <option value="custom">Personalizado</option>
          </select>
          
          {period === 'custom' && (
            <>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                title="Desde"
              />
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                title="Hasta"
              />
            </>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="stats-grid mb-24">
        <div className="stat primary">
          <div className="stat-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Ingresos totales</span>
            <span className="stat-value">{isFinite(metrics.totalRevenue) && metrics.totalRevenue > 0 ? formatPrice(metrics.totalRevenue) : formatPrice(0)}</span>
          </div>
        </div>

        <div className="stat info">
          <div className="stat-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total pedidos</span>
            <span className="stat-value">{Number.isFinite(metrics.totalOrders) && metrics.totalOrders > 0 ? metrics.totalOrders : 0}</span>
          </div>
        </div>

        <div className="stat ok">
          <div className="stat-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Ticket promedio</span>
            <span className="stat-value">{isFinite(metrics.averageTicket) && metrics.averageTicket > 0 ? formatPrice(metrics.averageTicket) : formatPrice(0)}</span>
          </div>
        </div>

        <div className="stat warning">
          <div className="stat-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Productos vendidos</span>
            <span className="stat-value">{Number.isFinite(metrics.totalProducts) && metrics.totalProducts > 0 ? metrics.totalProducts : 0}</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Tasa conversión</span>
            <span className="stat-value">
              {isFinite(metrics.conversionRate) && metrics.conversionRate > 0 ? metrics.conversionRate : 0}
              <span className="percent">%</span>
            </span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Top producto</span>
            <span className="stat-value" style={{ fontSize: '0.9rem' }}>
              {metrics.topProduct?.name ? metrics.topProduct.name : 'N/A'}
            </span>
            {metrics.topProduct?.sales ? (
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                {metrics.topProduct.sales} vendidos
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Gráfica de ventas diarias */}
      <div className="card mb-24">
        <div style={{ height: '350px', padding: '1rem' }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Gráficas de productos y categorías */}
      <div className="grid grid-2 mb-24" style={{ gap: '1.5rem' }}>
        <div className="card">
          <div style={{ height: '400px', padding: '1rem' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="card">
          <div style={{ height: '400px', padding: '1rem' }}>
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>

      {/* Tabla de resumen de productos */}
      <div className="card">
        <div className="card-header">
          <h3>Resumen de productos</h3>
        </div>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock actual</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 10).map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="inline" style={{ gap: '0.75rem' }}>
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="pill">{product.category}</span>
                  </td>
                  <td>
                    <span className={product.stock <= (product.lowStock || 5) ? 'pill danger' : ''}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td>
                    <strong>{formatPrice(product.price)}</strong>
                  </td>
                  <td>
                    {product.published ? (
                      <span className="pill ok">Publicado</span>
                    ) : (
                      <span className="pill off">Borrador</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
