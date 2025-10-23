'use client';

import { useState, useEffect } from 'react';
import { 
  getOrders, 
  saveOrders, 
  formatPrice,
  exportToCSV,
  generateInvoiceForOrder,
  openInvoiceWindow
} from '@/utils/adminUtils';

const ORDER_STATES = {
  pending: { label: 'Pendiente', color: 'warning', icon: 'fa-clock' },
  processing: { label: 'Procesando', color: 'info', icon: 'fa-spinner' },
  shipped: { label: 'Enviado', color: 'primary', icon: 'fa-truck' },
  delivered: { label: 'Entregado', color: 'ok', icon: 'fa-check-circle' },
  cancelled: { label: 'Cancelado', color: 'danger', icon: 'fa-times-circle' }
};

export default function AdminVentas() {
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadOrders();
    }
  }, [isMounted]);

  useEffect(() => {
    applyFilters();
    computeStats();
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const loadOrders = () => {
    const loaded = getOrders();
    // Ordenar por fecha más reciente primero
    const sorted = loaded.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setOrders(sorted);
  };

  const computeStats = () => {
    const newStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    setStats(newStats);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Búsqueda por ID, cliente o factura
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.id?.toLowerCase().includes(term) ||
        o.invoiceId?.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term) ||
        o.user?.email?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Filtro por rango de fechas
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter(o => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999); // Hasta el final del día
      filtered = filtered.filter(o => new Date(o.createdAt) <= to);
    }

    // Filtro por monto
    if (minAmount) {
      filtered = filtered.filter(o => o.total >= Number(minAmount));
    }

    if (maxAmount) {
      filtered = filtered.filter(o => o.total <= Number(maxAmount));
    }

    setFilteredOrders(filtered);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleChangeStatus = (orderId, newStatus) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
    saveOrders(updated);
    
    // Si el modal está abierto, actualizar el pedido seleccionado
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    
    alert(`✅ Estado actualizado a: ${ORDER_STATES[newStatus].label}`);
  };

  const handleDeleteOrder = (orderId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      return;
    }

    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    saveOrders(updated);
    alert('✅ Pedido eliminado');
  };

  const handleExportCSV = () => {
    const data = filteredOrders.map(o => [
      o.id,
      o.invoiceId || '',
      new Date(o.createdAt).toLocaleDateString('es-CO'),
      o.user?.name || 'N/A',
      o.user?.email || 'N/A',
      ORDER_STATES[o.status]?.label || o.status,
      o.items?.length || 0,
      o.total
    ]);

    exportToCSV(
      data,
      ['ID', 'Factura', 'Fecha', 'Cliente', 'Email', 'Estado', 'Productos', 'Total'],
      'pedidos.csv'
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isMounted) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Ventas / Pedidos</h1>
        </div>
        <div className="card">
          <p className="muted">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-container">
        <div className="admin-header">
          <h1>Ventas / Pedidos</h1>
          <div className="actions inline">
            <button className="btn btn-outline" onClick={handleExportCSV}>
              <i className="fas fa-file-csv"></i> Exportar CSV
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="stats-grid mb-24">
          <div className="stat">
            <div className="stat-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total pedidos</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="stat warning">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
          </div>

          <div className="stat info">
            <div className="stat-icon">
              <i className="fas fa-spinner"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Procesando</span>
              <span className="stat-value">{stats.processing}</span>
            </div>
          </div>

          <div className="stat primary">
            <div className="stat-icon">
              <i className="fas fa-truck"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Enviados</span>
              <span className="stat-value">{stats.shipped}</span>
            </div>
          </div>

          <div className="stat ok">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Entregados</span>
              <span className="stat-value">{stats.delivered}</span>
            </div>
          </div>

          <div className="stat danger">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Cancelados</span>
              <span className="stat-value">{stats.cancelled}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Listado de pedidos</h3>
            <span className="pill pill-primary">{filteredOrders.length} pedidos</span>
          </div>

          {/* Filtros */}
          <div className="filters mb-12">
            <div className="inline" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Buscar por ID, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '250px' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                title="Filtrar por estado"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Procesando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Desde fecha"
                placeholder="Desde"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Hasta fecha"
                placeholder="Hasta"
              />

              <input
                type="number"
                placeholder="Monto mín"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                style={{ width: '120px' }}
              />
              <input
                type="number"
                placeholder="Monto máx"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                style={{ width: '120px' }}
              />

              <button className="btn btn-outline" onClick={clearFilters}>
                <i className="fas fa-times"></i> Limpiar
              </button>
            </div>
          </div>

          {/* Tabla de pedidos */}
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID / Factura</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th style={{ width: '200px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      {orders.length === 0 
                        ? 'No hay pedidos. Los pedidos aparecerán aquí cuando los clientes realicen compras.'
                        : 'No se encontraron pedidos con los filtros aplicados.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <strong>{order.id}</strong>
                          {order.invoiceId && (
                            <div className="muted" style={{ fontSize: '0.85rem' }}>
                              #{order.invoiceId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="muted">{formatDate(order.createdAt)}</span>
                      </td>
                      <td>
                        <div>
                          <strong>{order.user?.name || 'N/A'}</strong>
                          <div className="muted" style={{ fontSize: '0.85rem' }}>
                            {order.user?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill">{order.items?.length || 0} items</span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '1.05rem' }}>{formatPrice(order.total)}</strong>
                      </td>
                      <td>
                        <span className={`pill ${ORDER_STATES[order.status]?.color || ''}`}>
                          <i className={`fas ${ORDER_STATES[order.status]?.icon || 'fa-circle'}`}></i>
                          {' '}
                          {ORDER_STATES[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td>
                        <div className="inline" style={{ gap: '0.25rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleViewDetails(order)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => {
                              const updated = generateInvoiceForOrder(order.id);
                              if (updated) {
                                setOrders(getOrders());
                                openInvoiceWindow(updated);
                              }
                            }}
                            title="Generar / Ver factura"
                          >
                            <i className="fas fa-file-invoice"></i>
                          </button>
                          
                          <select
                            value={order.status}
                            onChange={(e) => handleChangeStatus(order.id, e.target.value)}
                            title="Cambiar estado"
                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>

                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Eliminar"
                            style={{ color: 'var(--danger)' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <h2>Detalles del pedido</h2>
                <p className="muted">ID: {selectedOrder.id}</p>
              </div>
              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* Información general */}
              <div className="grid grid-2 mb-24">
                <div>
                  <h4 className="mb-8">Información del pedido</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="muted">Fecha:</span>
                      <strong>{formatDate(selectedOrder.createdAt)}</strong>
                    </div>
                    <div className="info-item">
                      <span className="muted">Factura:</span>
                      <strong>{selectedOrder.invoiceId || 'N/A'}</strong>
                    </div>
                    <div className="info-item">
                      <span className="muted">Estado:</span>
                      <span className={`pill ${ORDER_STATES[selectedOrder.status]?.color || ''}`}>
                        <i className={`fas ${ORDER_STATES[selectedOrder.status]?.icon || 'fa-circle'}`}></i>
                        {' '}
                        {ORDER_STATES[selectedOrder.status]?.label || selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-8">Cliente</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="muted">Nombre:</span>
                      <strong>{selectedOrder.user?.name || 'N/A'}</strong>
                    </div>
                    <div className="info-item">
                      <span className="muted">Email:</span>
                      <strong>{selectedOrder.user?.email || 'N/A'}</strong>
                    </div>
                    <div className="info-item">
                      <span className="muted">Teléfono:</span>
                      <strong>{selectedOrder.user?.phone || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección de envío */}
              {selectedOrder.shippingAddress && (
                <div className="mb-24">
                  <h4 className="mb-8">Dirección de envío</h4>
                  <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                    <p>
                      {selectedOrder.shippingAddress.street || 'N/A'}<br />
                      {selectedOrder.shippingAddress.city || ''} {selectedOrder.shippingAddress.state || ''}<br />
                      {selectedOrder.shippingAddress.zipCode || ''}<br />
                      {selectedOrder.shippingAddress.country || 'Colombia'}
                    </p>
                  </div>
                </div>
              )}

              {/* Productos */}
              <div className="mb-24">
                <h4 className="mb-8">Productos ({selectedOrder.items?.length || 0})</h4>
                <div className="overflow-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="inline" style={{ gap: '0.75rem' }}>
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    objectFit: 'cover',
                                    borderRadius: '4px'
                                  }}
                                />
                              )}
                              <div>
                                <strong>{item.name}</strong>
                                {item.variant && (
                                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                                    {item.variant}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td><strong>{formatPrice(item.price * item.quantity)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="info-list">
                  <div className="info-item">
                    <span>Subtotal:</span>
                    <strong>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</strong>
                  </div>
                  {selectedOrder.shipping && (
                    <div className="info-item">
                      <span>Envío:</span>
                      <strong>{formatPrice(selectedOrder.shipping)}</strong>
                    </div>
                  )}
                  {selectedOrder.tax && (
                    <div className="info-item">
                      <span>IVA:</span>
                      <strong>{formatPrice(selectedOrder.tax)}</strong>
                    </div>
                  )}
                  {selectedOrder.discount && (
                    <div className="info-item">
                      <span>Descuento:</span>
                      <strong style={{ color: 'var(--success)' }}>
                        -{formatPrice(selectedOrder.discount)}
                      </strong>
                    </div>
                  )}
                  <div className="info-item" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    <strong>Total:</strong>
                    <strong style={{ color: 'var(--primary)' }}>
                      {formatPrice(selectedOrder.total)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cambiar estado */}
              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <div className="inline" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div className="inline">
                    <span className="muted">Cambiar estado:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleChangeStatus(selectedOrder.id, e.target.value)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="processing">Procesando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cerrar
                  </button>
                  {selectedOrder && (
                    <button className="btn btn-primary" onClick={() => {
                      const updated = generateInvoiceForOrder(selectedOrder.id);
                      if (updated) openInvoiceWindow(updated);
                    }}>
                      <i className="fas fa-file-invoice"></i> Imprimir factura
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
