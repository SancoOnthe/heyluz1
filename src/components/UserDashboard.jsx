"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/contexts/ToastContext.jsx';
import { openInvoiceWindow } from '@/utils/adminUtils';
import { showNewMessageNotification, requestNotificationPermission } from '@/utils/notifications';

function UserDashboardContent({ user }) {
  const router = useRouter();
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalOrdersServer, setTotalOrdersServer] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    preferences: {
      newsletter: true,
      notifications: true,
      language: 'es',
      currency: 'COP'
    }
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentErrors, setPaymentErrors] = useState({});
  // notificaciones y mensajes
  const [notifications, setNotifications] = useState([]);
  const [activeMessage, setActiveMessage] = useState(null);
  const [messagesFilter, setMessagesFilter] = useState('all'); // all | unread | read
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [onlyMyOrders, setOnlyMyOrders] = useState(true);
  const [orderFilters, setOrderFilters] = useState({
    query: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const isAdmin = Boolean(user && (user.role === 'admin' || user.isAdmin));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: '—',
    activeCoupons: 0
  });

  // Marcar componente como montado (cliente)
  useEffect(() => {
    setIsMounted(true);
    // activar pestaña desde query string o hash (ej: ?tab=preferences o #preferences)
    try {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get('tab') || window.location.hash.replace('#', '');
      if (tab) setActiveTab(tab);
    } catch (e) {
      // ignore
    }
  }, []);

  // Cargar datos del localStorage
  useEffect(() => {
    if (isMounted) {
      // Preferir cargar pedidos reales desde el backend si hay sesión
      fetchOrders(page);
      loadCoupons();
      loadProfile();
      loadWishlist();
      loadAddresses();
      loadPaymentMethods();
      loadSettings();
      loadNotifications();
    }
  }, [isMounted]);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem('heyluz_notifications');
      const data = stored ? JSON.parse(stored) : [];
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
    }
  };

  // Mantener lista local de mensajes borrados por el usuario (ids del servidor)
  const loadDeletedMessageIds = () => {
    try {
      const raw = localStorage.getItem('heyluz_deleted_messages');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  };

  const saveDeletedMessageIds = (arr) => {
    try {
      localStorage.setItem('heyluz_deleted_messages', JSON.stringify(Array.isArray(arr) ? arr : []));
    } catch (e) {
      console.error('Error saving deleted ids', e);
    }
  };

  // Lista persistente de replies ya notificadas para evitar duplicados
  // notified replies stored as array of { id, ts }
  const NOTIFIED_KEY = 'heyluz_notified_replies';
  const NOTIFIED_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

  const loadNotifiedReplyIds = () => {
    try {
      const raw = localStorage.getItem(NOTIFIED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      // purgar entradas viejas
      const now = Date.now();
      const valid = arr.filter(item => item && item.id && (now - (item.ts || 0) <= NOTIFIED_TTL_MS));
      // si hubo purga, guardamos
      if (valid.length !== arr.length) {
        try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(valid)); } catch (e) { /* ignore */ }
      }
      return valid.map(i => String(i.id));
    } catch (e) {
      return [];
    }
  };

  const saveNotifiedReplyIds = (ids) => {
    try {
      const now = Date.now();
      // ids es array de strings
      const existingRaw = localStorage.getItem(NOTIFIED_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const map = new Map((existing || []).map(i => [String(i.id), i]));
      (ids || []).forEach(id => {
        map.set(String(id), { id: String(id), ts: now });
      });
      const res = Array.from(map.values());
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(res));
    } catch (e) {
      console.error('Error saving notified reply ids', e);
    }
  };

  // BroadcastChannel para sincronizar notificaciones entre pestañas
  const getBroadcast = () => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
    try {
      return new BroadcastChannel('heyluz_messages');
    } catch (e) {
      return null;
    }
  };

  // Cargar mensajes desde el servidor para el usuario (solo sus mensajes)
  const loadServerMessagesForUser = async () => {
    try {
      if (!profile || !profile.email) return;
      const res = await fetch(`/api/contact?email=${encodeURIComponent(profile.email)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const payload = await res.json().catch(() => null);
      if (!payload || !payload.ok) return;
      const serverMsgs = payload.data || [];

      // Mapear mensajes del servidor para unir con los locales
      // Los mensajes del server tienen estructura { id, nombre, email, telefono, asunto, mensaje, reply?, status }
      const local = localStorage.getItem('heyluz_notifications');
      const localMsgs = local ? JSON.parse(local) : [];

      // Construir una lista combinada: primero los locales (pendientes), luego los del servidor
      const pendingLocal = localMsgs.filter(m => !m.synced);
      const deletedIds = loadDeletedMessageIds();
      const serverMapped = serverMsgs
        .filter(m => !deletedIds.includes(String(m.id || '')))
        .map(m => ({
          id: m.id,
          nombre: m.nombre,
          title: m.asunto || m.title || 'Mensaje',
          asunto: m.asunto,
          preview: (m.mensaje || '').slice(0, 200),
          body: m.mensaje || m.body || '',
          mensaje: m.mensaje || '',
          email: m.email,
          telefono: m.telefono || '',
          date: m.createdAt,
          read: m.status === 'leido' || !!m.reply,
          synced: true,
          serverId: m.id,
          reply: m.reply || null
        }));

      // detectar nuevas respuestas del admin y notificar solo en ese caso
      // Detectar respuestas nuevas y evitar notificaciones duplicadas usando almacenamiento persistente
      const alreadyNotified = new Set(loadNotifiedReplyIds());
      const repliesToNotify = serverMsgs.filter(m => m.reply && !alreadyNotified.has(String(m.id)));
      if (repliesToNotify.length > 0) {
        const toMark = [];
        repliesToNotify.forEach(m => {
          try {
            toast.info(`Respuesta del admin: ${m.reply.body.slice(0, 120)}`);
            // intento mostrar notificación de escritorio si permitido
            try {
              if (typeof window !== 'undefined' && Notification && Notification.permission === 'granted') {
                showNewMessageNotification({ id: m.id, nombre: m.nombre, asunto: m.asunto });
              }
            } catch (e) { /* ignore */ }
            toMark.push(String(m.id));
          } catch (e) { /* ignore */ }
        });
        // Guardar los ids que notificamos para no volver a notificar
        const merged = Array.from(new Set([...Array.from(alreadyNotified), ...toMark]));
        saveNotifiedReplyIds(merged);
        // Broadcast para sincronizar con otras pestañas
        try {
          const bc = getBroadcast();
          if (bc) bc.postMessage({ type: 'notified_replies', ids: merged });
        } catch (e) { /* ignore */ }
      }

      const combined = [...pendingLocal, ...serverMapped];
      saveNotifications(combined);
    } catch (err) {
      console.error('Error loading server messages for user:', err);
    }
  };

  const saveNotifications = (list) => {
    try {
      localStorage.setItem('heyluz_notifications', JSON.stringify(list));
      // ensure we set a new array reference so React re-renders
      setNotifications(Array.isArray(list) ? [...list] : list);
    } catch (err) {
      console.error('Error saving notifications:', err);
    }
  };

  useEffect(() => {
    // refetch cuando cambie la página
    if (isMounted) fetchOrders(page);
  }, [page]);

  // Actualizar estadísticas cuando cambien los pedidos
  useEffect(() => {
    calculateStats();
  }, [orders, onlyMyOrders]);

  const loadOrders = () => {
    try {
      const stored = localStorage.getItem('heyluz_orders');
      const allOrders = stored ? JSON.parse(stored) : [];
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const fetchOrders = async (pageNum = 1) => {
    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const url = `/api/user/orders?page=${pageNum}&perPage=${perPage}`;
      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const payload = await res.json();
      if (payload && payload.ok) {
        setOrders(payload.data || []);
        setTotalOrdersServer(payload.total || 0);
      } else {
        throw new Error((payload && payload.error) || 'Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error fetching orders from API:', err);
      setOrdersError(String(err.message || err));
      // fallback a localStorage si hay error
      try {
        const stored = localStorage.getItem('heyluz_orders');
        const allOrders = stored ? JSON.parse(stored) : [];
        setOrders(allOrders);
      } catch (e) {
        setOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCoupons = () => {
    try {
      const settings = localStorage.getItem('heyluz_settings');
      const settingsData = settings ? JSON.parse(settings) : {};
      setCoupons(settingsData.coupons || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      setCoupons([]);
    }
  };

  const loadWishlist = () => {
    try {
      const stored = localStorage.getItem('heyluz_wishlist');
      const wishlistData = stored ? JSON.parse(stored) : [];
      setWishlist(wishlistData);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    }
  };

  const loadAddresses = () => {
    try {
      const stored = localStorage.getItem('heyluz_addresses');
      const addressesData = stored ? JSON.parse(stored) : [];
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    }
  };

  const loadPaymentMethods = () => {
    try {
      const stored = localStorage.getItem('heyluz_payments');
      const data = stored ? JSON.parse(stored) : [];
      setPaymentMethods(data);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setPaymentMethods([]);
    }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('heyluz_settings');
      const settings = stored ? JSON.parse(stored) : {};
      setAppSettings(settings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setAppSettings({});
    }
  };

  const saveSettings = (settings) => {
    try {
      const merged = { ...(appSettings || {}), ...(settings || {}) };
      localStorage.setItem('heyluz_settings', JSON.stringify(merged));
      setAppSettings(merged);
      toast.success('Configuración guardada');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('No se pudo guardar la configuración');
    }
  };

  const loadProfile = () => {
    try {
      const stored = localStorage.getItem('heyluz_profile');
      const profileData = stored ? JSON.parse(stored) : {};
      setProfile({
        name: profileData.name || user?.name || '',
        email: profileData.email || user?.email || `${user?.username}@correo.local`,
        phone: profileData.phone || '',
        preferences: profileData.preferences || {
          newsletter: true,
          notifications: true,
          language: 'es',
          currency: 'COP'
        }
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  //guardar métodos de pago
  const savePaymentMethods = (methods) => {
    try {
      localStorage.setItem('heyluz_payments', JSON.stringify(methods));
      setPaymentMethods(methods);
      toast.success('Métodos de pago actualizados');
    } catch (err) {
      console.error('Error saving payments:', err);
      toast.error('Error al guardar métodos de pago');
    }
  };

  const saveProfile = () => {
    try {
      localStorage.setItem('heyluz_profile', JSON.stringify(profile));
      showNotification('Perfil guardado correctamente', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Error al guardar el perfil', 'error');
    }
  };

  const calculateStats = () => {
    const filteredOrders = getFilteredOrders();
    const totalSpent = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const lastOrder = filteredOrders.length > 0 ? filteredOrders[filteredOrders.length - 1] : null;

    const now = Date.now();
    const activeCoupons = coupons.filter(c =>
      c.active !== false && (!c.expiresAt || new Date(c.expiresAt).getTime() >= now)
    );

    setStats({
      totalOrders: filteredOrders.length,
      totalSpent,
      lastOrderDate: lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString('es-ES') : '—',
      activeCoupons: activeCoupons.length
    });
  };

  const getFilteredOrders = () => {
    if (!onlyMyOrders) return orders;
    return orders.filter(order => 
      String(order?.user?.username || '') === String(user?.username)
    );
  };

  const formatPrice = (amount) => {
    const num = Number(amount || 0);
    
    // Formato simple y consistente para evitar problemas de hidratación
    return `$ ${num.toLocaleString('es-CO', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  };

  // ============= HANDLERS NOTIFICACIONES / MENSAJES =============
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n);
    saveNotifications(updated);
  };

  const handleMarkAsUnread = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: false, readAt: null } : n);
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id) => {
    const sid = String(id || '');
    const target = (notifications || []).find(n => String(n.id || '') === sid || String(n.serverId || '') === sid);
    if (!target) return;
    if (!target.read) {
      toast.warning('Solo puedes eliminar mensajes que ya hayan sido leídos.');
      return;
    }
    if (!confirm('¿Eliminar este mensaje?')) return; // keep browser confirm for destructive action
    const updated = (notifications || []).filter(n => !(String(n.id || '') === sid || String(n.serverId || '') === sid));
    saveNotifications(updated);
    // si el mensaje eliminado tenía serverId, persistirlo en la lista de borrados para que no reaparezca
    const serverId = target.serverId || null;
    if (serverId) {
      const deleted = loadDeletedMessageIds();
      if (!deleted.includes(String(serverId))) {
        deleted.push(String(serverId));
        saveDeletedMessageIds(deleted);
      }
    }
    // if the active message is the one deleted, close viewer
    if (activeMessage && (String(activeMessage.id || '') === sid || String(activeMessage.serverId || '') === sid)) {
      setActiveMessage(null);
    }
    toast.success('Mensaje eliminado');
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
    saveNotifications(updated);
  };

  const handleOpenMessage = (n) => {
    setActiveMessage(n);
    if (!n.read) handleMarkAsRead(n.id);
  };

  const handleSendNewMessage = async (data) => {
    // data: { title, body, email }
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newMsg = {
      id,
      nombre: profile.name || 'Usuario',
      title: data.title || 'Mensaje desde usuario',
      asunto: 'consulta',
      preview: (data.body || '').slice(0, 200),
      mensaje: data.body || '',
      email: data.email || profile.email || '',
      telefono: profile.phone || '',
      date: now,
      read: false,
      synced: false
    };

    // persistir localmente
    const updated = [newMsg, ...notifications];
    saveNotifications(updated);
    // intentar enviar al backend (api/contact) y actualizar estado de sincronización
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newMsg.nombre, email: newMsg.email, telefono: newMsg.telefono, asunto: newMsg.asunto, mensaje: newMsg.mensaje })
      });
      const payload = await res.json().catch(() => null);
      if (res.ok && payload && payload.ok) {
        // marcar como sincronizado y guardar server id si viene
        const serverId = payload.data?.id || null;
        const after = updated.map(n => n.id === id ? { ...n, synced: true, serverId } : n);
        saveNotifications(after);
      } else {
        console.warn('Backend no aceptó el mensaje, queda pendiente localmente');
      }
    } catch (e) {
      console.warn('No se pudo enviar al backend, conservado localmente');
    }

    setShowNewMessageModal(false);
    showNotification('Mensaje enviado', 'success');
  };

  // Sincronizar mensajes locales pendientes con el backend
  const isSyncingRef = React.useRef(false);
  const syncLocalMessages = async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const pending = (notifications || []).filter(n => !n.synced);
      if (pending.length === 0) return;

      let changed = false;
      const updated = [...notifications];

      for (const n of pending) {
        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: 'Usuario', email: n.email || '', asunto: 'consulta', mensaje: n.mensaje || n.body || '' })
          });
          const payload = await res.json().catch(() => null);
          if (res.ok && payload && payload.ok) {
            const idx = updated.findIndex(u => u.id === n.id);
            if (idx !== -1) {
              const newServerId = payload.data?.id || null;
              updated[idx] = { ...updated[idx], synced: true, serverId: newServerId };
              changed = true;
            }
          }
        } catch (err) {
          // no hacer nada, se reintentará luego
          console.warn('Sync fallo para mensaje', n.id, err && err.message ? err.message : err);
        }
      }

      if (changed) saveNotifications(updated);
      // Después de sincronizar, recargar mensajes del servidor para traer posibles respuestas del admin
      // si algunos mensajes recién sincronizados fueron borrados previamente por el usuario, limpiarlos
      const deletedIds = loadDeletedMessageIds();
      const filtered = (updated || []).filter(u => !(u.serverId && deletedIds.includes(String(u.serverId))));
      if (filtered.length !== updated.length) {
        saveNotifications(filtered);
      }
      await loadServerMessagesForUser();
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Ejecutar sincronización al montar y cuando volvamos online
  useEffect(() => {
    const bc = getBroadcast();
    if (bc) {
      const onMsg = (ev) => {
        try {
          const data = ev.data;
          if (data && data.type === 'notified_replies' && Array.isArray(data.ids)) {
            saveNotifiedReplyIds(data.ids);
          }
        } catch (e) { /* ignore */ }
      };
      bc.addEventListener('message', onMsg);
      return () => {
        try { bc.removeEventListener('message', onMsg); bc.close(); } catch (e) { /* ignore */ }
      };
    }
    if (!isMounted) return;
    syncLocalMessages();
    // también cargar mensajes del servidor para el usuario
    loadServerMessagesForUser();
    const onOnline = () => syncLocalMessages();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [isMounted, notifications]);

  const renderMessages = () => {
    const list = notifications || [];
    const filtered = list.filter(m => messagesFilter === 'all' ? true : (messagesFilter === 'unread' ? !m.read : !!m.read));

    return (
      <div className="card">
        <div className="card-header">
          <h3>Mensajes y notificaciones</h3>
          <div className="actions inline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowNewMessageModal(true)}><i className="fas fa-plus"></i> Nuevo mensaje</button>
            <select value={messagesFilter} onChange={(e) => setMessagesFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="unread">No leídos</option>
              <option value="read">Leídos</option>
            </select>
            <button className="btn btn-outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>Marcar todos leídos</button>
          </div>
        </div>
        <div style={{ padding: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }} className="muted">No hay mensajes</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {filtered.map(msg => (
                <div key={msg.id} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>{msg.title || 'Notificación'}</strong>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>{msg.date ? new Date(msg.date).toLocaleString('es-ES') : ''}</span>
                      {!msg.read && <span className="pill pill-primary" style={{ marginLeft: '0.5rem' }}>Nuevo</span>}
                      {!msg.synced && <span className="pill" style={{ marginLeft: '0.5rem', background: '#fff4e5', color: '#a56a00' }}>Pendiente</span>}
                    </div>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{msg.preview || (msg.body && msg.body.slice(0, 200))}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" onClick={() => handleOpenMessage(msg)}>Abrir</button>
                      {msg.read ? (
                        <button className="btn btn-secondary" onClick={() => handleMarkAsUnread(msg.id)}>Marcar no leído</button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handleMarkAsRead(msg.id)}>Marcar leído</button>
                      )}
                      <button className="btn btn-danger" onClick={() => handleDeleteNotification(msg.id)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Message viewer modal */}
                {activeMessage && (
          <div className="modal-overlay" onClick={() => setActiveMessage(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{activeMessage.title || 'Mensaje'}</h3>
                <button className="btn btn-icon" onClick={() => setActiveMessage(null)}><i className="fas fa-times"></i></button>
              </div>
              <div className="modal-body">
                <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {activeMessage.date ? new Date(activeMessage.date).toLocaleString('es-ES') : ''}
                  {!activeMessage.synced && <span className="pill" style={{ marginLeft: '0.5rem', background: '#fff4e5', color: '#a56a00' }}>Pendiente</span>}
                </div>
                <div dangerouslySetInnerHTML={{ __html: activeMessage.body || '' }} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveMessage(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Nuevo mensaje modal (form)
  const NewMessageModal = () => {
    const [form, setForm] = React.useState({ title: '', email: profile.email || '', body: '' });
    const [errors, setErrors] = React.useState({});
    const [sending, setSending] = React.useState(false);

    const validate = () => {
      const e = {};
      if (!form.title || form.title.trim().length < 3) e.title = 'El asunto debe tener al menos 3 caracteres';
      if (!form.body || form.body.trim().length < 5) e.body = 'El mensaje es demasiado corto';
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email no válido';
      return e;
    };

    const submit = async (ev) => {
      ev.preventDefault();
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length > 0) return;
      setSending(true);
      try {
        await handleSendNewMessage(form);
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowNewMessageModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Nuevo mensaje</h3>
            <button className="btn btn-icon" onClick={() => setShowNewMessageModal(false)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <span>Asunto</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                {errors.title && <div style={{ color: 'var(--danger)' }}>{errors.title}</div>}
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <span>Email (opcional)</span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <div style={{ color: 'var(--danger)' }}>{errors.email}</div>}
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <span>Mensaje</span>
                <textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                {errors.body && <div style={{ color: 'var(--danger)' }}>{errors.body}</div>}
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewMessageModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============= HANDLERS WISHLIST =============
  const handleAddToWishlist = (product) => {
    try {
      const newWishlist = [...wishlist, { ...product, addedAt: new Date().toISOString() }];
      setWishlist(newWishlist);
      localStorage.setItem('heyluz_wishlist', JSON.stringify(newWishlist));
      toast.success('Producto agregado a favoritos');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Error al agregar a favoritos');
    }
  };

  const handleRemoveFromWishlist = (productId) => {
    try {
      const newWishlist = wishlist.filter(item => item.id !== productId);
      setWishlist(newWishlist);
      localStorage.setItem('heyluz_wishlist', JSON.stringify(newWishlist));
      toast.success('Producto eliminado de favoritos');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Error al eliminar de favoritos');
    }
  };

  // ============= HANDLERS DIRECCIONES =============
  const handleAddAddress = (addressData) => {
    try {
      const newAddress = {
        id: Date.now().toString(),
        ...addressData,
        createdAt: new Date().toISOString()
      };
      
      let newAddresses = [...addresses, newAddress];
      
      // Si es la primera dirección o se marca como predeterminada
      if (newAddresses.length === 1 || addressData.isDefault) {
        newAddresses = newAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === newAddress.id
        }));
      }
      
      setAddresses(newAddresses);
      localStorage.setItem('heyluz_addresses', JSON.stringify(newAddresses));
      setShowAddressModal(false);
      setEditingAddress(null);
      toast.success('Dirección agregada correctamente');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Error al agregar dirección');
    }
  };

  const handleEditAddress = (addressId, addressData) => {
    try {
      let newAddresses = addresses.map(addr => 
        addr.id === addressId ? { ...addr, ...addressData } : addr
      );
      
      // Si se marca como predeterminada, quitar la marca de las demás
      if (addressData.isDefault) {
        newAddresses = newAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }));
      }
      
      setAddresses(newAddresses);
      localStorage.setItem('heyluz_addresses', JSON.stringify(newAddresses));
      setShowAddressModal(false);
      setEditingAddress(null);
      toast.success('Dirección actualizada correctamente');
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Error al actualizar dirección');
    }
  };

  const handleDeleteAddress = (addressId) => {
    try {
      if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
      
      const deletedAddress = addresses.find(addr => addr.id === addressId);
      let newAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // Si se eliminó la predeterminada, marcar la primera como predeterminada
      if (deletedAddress?.isDefault && newAddresses.length > 0) {
        newAddresses[0].isDefault = true;
      }
      
      setAddresses(newAddresses);
      localStorage.setItem('heyluz_addresses', JSON.stringify(newAddresses));
      toast.success('Dirección eliminada correctamente');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar dirección');
    }
  };

  const handleSetDefaultAddress = (addressId) => {
    try {
      const newAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      
      setAddresses(newAddresses);
      localStorage.setItem('heyluz_addresses', JSON.stringify(newAddresses));
      toast.success('Dirección predeterminada actualizada');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Error al establecer dirección predeterminada');
    }
  };

  // ============= HANDLERS SEGURIDAD =============
  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    // Aquí iría la llamada al API para cambiar la contraseña
    // Por ahora solo simulamos
    toast.success('Contraseña actualizada correctamente');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(false);
  };

  // ============= HANDLERS PREFERENCIAS =============
  const handlePreferencesSave = () => {
    try {
      const updatedProfile = { ...profile };
      setProfile(updatedProfile);
      // persistir preferencias tanto en el perfil como en la configuración global
      const existingProfile = JSON.parse(localStorage.getItem('heyluz_profile') || '{}');
      const mergedProfile = { ...existingProfile, ...updatedProfile };
      localStorage.setItem('heyluz_profile', JSON.stringify(mergedProfile));

      const existingSettings = JSON.parse(localStorage.getItem('heyluz_settings') || '{}');
      const mergedSettings = { ...existingSettings, preferences: mergedProfile.preferences };
      localStorage.setItem('heyluz_settings', JSON.stringify(mergedSettings));
      setAppSettings(mergedSettings);
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    }
  };

  // sincronizar profile.preferences con appSettings cuando appSettings cambie
  useEffect(() => {
    if (!appSettings) return;
    if (appSettings.preferences) {
      setProfile(prev => ({ ...prev, preferences: { ...prev.preferences, ...appSettings.preferences } }));
    }
  }, [appSettings]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Nota: la exportación CSV está deshabilitada en el dashboard de usuario.

  const handleReorder = (order) => {
    try {
      const items = (order.items || []).map(item => ({
        id: item.id,
        quantity: Number(item.quantity || 1),
        variantId: item.variantId || null
      }));
      localStorage.setItem('heyluz_reorder', JSON.stringify({ at: Date.now(), items }));
      localStorage.setItem('heyluz_open_cart', '1');
      router.push('/productos');
    } catch (error) {
      console.error('Error reordering:', error);
      router.push('/productos');
    }
  };

  const handleUseCoupon = (code) => {
    try {
      localStorage.setItem('heyluz_coupon', JSON.stringify({ code }));
      showNotification(`Cupón ${code} aplicado. Ve al carrito para usarlo.`, 'success');
    } catch (error) {
      console.error('Error applying coupon:', error);
    }
  };

  // Métodos de pago handlers
  const handleAddPayment = (pm) => {
    // Guardamos solo metadatos y una referencia al proveedor/pasarela.
    const defaultProvider = pm.provider || appSettings?.defaultGateway || 'gateway';
    const newPm = {
      id: Date.now().toString(),
      label: pm.label || (pm.brand ? `${pm.brand} •••• ${pm.last4 || ''}` : 'Método de pago'),
      provider: defaultProvider,
      external: pm.provider === 'gateway' || pm.provider === 'token',
      // permitir conservar last4 si viene de una migración, pero no es obligatorio
      last4: pm.last4 || undefined,
      isDefault: !!pm.isDefault
    };
    const updated = [...paymentMethods, newPm];
    // si es el primer método, marcar por defecto
    if (updated.length === 1) updated[0].isDefault = true;
    savePaymentMethods(updated);
    return newPm;
  };

  const handleEditPayment = (id, data) => {
    const updated = paymentMethods.map(p => p.id === id ? { ...p, ...data } : p);
    savePaymentMethods(updated);
  };

  const handleDeletePayment = (id) => {
    if (!confirm('¿Eliminar método de pago?')) return;
    const deleted = paymentMethods.find(p => p.id === id);
    let updated = paymentMethods.filter(p => p.id !== id);
    if (deleted?.isDefault && updated.length > 0) updated[0].isDefault = true;
    savePaymentMethods(updated);
  };

  const handleSetDefaultPayment = (id) => {
    const updated = paymentMethods.map(p => ({ ...p, isDefault: p.id === id }));
    savePaymentMethods(updated);
  };

  const getStatusClass = (status) => {
    const st = (status || 'pendiente').toLowerCase();
    if (st === 'pagado') return 'pill ok';
    if (st === 'enviado') return 'pill warn';
    if (st === 'cancelado') return 'pill danger';
    return 'pill off';
  };

  // Calcular desglose de totales de un pedido de forma segura
  const computeOrderBreakdown = (order) => {
    const items = order?.items || [];
    const subtotal = items.reduce((s, it) => {
      const price = Number(it.price ?? it.precio ?? it.total ?? 0);
      const qty = Number(it.quantity ?? it.cantidad ?? 1);
      return s + price * qty;
    }, 0);
    const shipping = Number(order?.shipping ?? order?.shippingCost ?? (subtotal >= 50 ? 0 : 5.99));
    const tax = Number(order?.tax ?? order?.taxes ?? 0);
    const discount = Number(order?.discount ?? order?.discountAmount ?? 0);
    const total = Number(order?.total ?? (subtotal + shipping + tax - discount));
    return { items, subtotal, shipping, tax, discount, total };
  };

  const [orderActionLoading, setOrderActionLoading] = useState(false);

  const updateOrderStatus = async (orderId, action) => {
    setOrderActionLoading(true);
    try {
      const res = await fetch('/api/user/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: orderId, action })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      const payload = await res.json();
      if (!payload || !payload.ok) throw new Error((payload && payload.error) || 'Error desconocido');

      const updated = payload.data;
      // actualizar lista local
      setOrders(prev => prev.map(o => (String(o.id) === String(updated.id) ? updated : o)));
      // si el modal está abierto, actualizar selectedOrder
      if (selectedOrder && String(selectedOrder.id) === String(updated.id)) {
        setSelectedOrder(updated);
      }
      showNotification('Estado del pedido actualizado', 'success');
    } catch (err) {
      console.error('Error updating order:', err);
      showNotification('No se pudo actualizar el pedido: ' + (err.message || err), 'error');
    } finally {
      setOrderActionLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="admin-grid">
      <div className="card">
        <h3>Resumen de cuenta</h3>
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-label">Pedidos</div>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Gastado</div>
            <div className="stat-value">{formatPrice(stats.totalSpent)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Último pedido</div>
            <div className="stat-value">{stats.lastOrderDate}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Cupones activos</div>
            <div className="stat-value">{stats.activeCoupons}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Cupones destacados</h3>
        <ul className="simple-list">
          {coupons
            .filter(c => c.active !== false && (!c.expiresAt || new Date(c.expiresAt).getTime() >= Date.now()))
            .slice(0, 5)
            .map((coupon, idx) => (
              <li key={idx}>
                <code>{coupon.code}</code> · {' '}
                {coupon.type === 'percent' ? `${coupon.value}%` : formatPrice(coupon.value)}
                {coupon.scope !== 'all' ? ` · ${coupon.scope}` : ''}
              </li>
            ))}
          {stats.activeCoupons === 0 && (
            <li className="muted">Sin cupones activos</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderOrders = () => {
    // aplicar filtros locales
    const base = getFilteredOrders();
    const filteredByQuery = base.filter(o => {
      if (!orderFilters.query) return true;
      const q = orderFilters.query.toLowerCase();
      return String(o.id).toLowerCase().includes(q) ||
        (o.user && ((o.user.username || '') + ' ' + (o.user.email || '')).toLowerCase().includes(q)) ||
        ((o.items || []).map(i => i.name).join(' ').toLowerCase().includes(q));
    });
    const filteredByStatus = filteredByQuery.filter(o => orderFilters.status === 'all' ? true : ((o.status || '').toLowerCase() === orderFilters.status));
    const filteredByDate = filteredByStatus.filter(o => {
      if (!orderFilters.dateFrom && !orderFilters.dateTo) return true;
      const t = new Date(o.createdAt).getTime();
      const from = orderFilters.dateFrom ? new Date(orderFilters.dateFrom).getTime() : -Infinity;
      const to = orderFilters.dateTo ? new Date(orderFilters.dateTo).getTime() : Infinity;
      return t >= from && t <= to;
    });
    const filteredOrders = filteredByDate;
    const totalPages = Math.ceil(filteredOrders.length / perPage);
    const paginatedOrders = [...filteredOrders].reverse().slice((page - 1) * perPage, page * perPage);

    return (
      <div className="card">
        <div className="card-header">
          <h3>Mis compras</h3>
          <div className="actions inline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={onlyMyOrders}
                onChange={(e) => setOnlyMyOrders(e.target.checked)}
              />
              Solo mis pedidos
            </label>
            <input
              type="text"
              placeholder="Buscar ID, producto, usuario..."
              value={orderFilters.query}
              onChange={(e) => setOrderFilters({ ...orderFilters, query: e.target.value })}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
            <select value={orderFilters.status} onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}>
              <option value="all">Todos</option>
              <option value="pagado">Pagado</option>
              <option value="enviado">Enviado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <input type="date" value={orderFilters.dateFrom} onChange={(e) => setOrderFilters({ ...orderFilters, dateFrom: e.target.value })} />
            <input type="date" value={orderFilters.dateTo} onChange={(e) => setOrderFilters({ ...orderFilters, dateTo: e.target.value })} />
            {/* Exportar CSV deshabilitado para usuarios normales */}
          </div>
        </div>
        {loadingOrders ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <span className="spinner" style={{ fontSize: '2rem' }}></span>
            <p className="muted">Cargando pedidos…</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="muted">Aún no tienes compras.</td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{new Date(order.createdAt).toLocaleString('es-ES')}</td>
                        <td>
                          <span className={getStatusClass(order.status)}>
                            {(order.status || 'pendiente').toLowerCase()}
                          </span>
                        </td>
                        <td className="u-break">
                          {(order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}
                        </td>
                        <td>{formatPrice(order.total)}</td>
                        <td className="actions">
                          <button 
                            className="btn btn-outline btn-icon"
                            onClick={() => handleViewOrder(order)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-outline btn-icon"
                            onClick={() => handleReorder(order)}
                            title="Repetir compra"
                          >
                            <i className="fas fa-rotate-right"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
                <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  &laquo; Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Siguiente &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCoupons = () => {
    const now = Date.now();
    const allCoupons = [...coupons].sort((a, b) => 
      (a.expiresAt || '') < (b.expiresAt || '') ? -1 : 1
    );

    return (
      <div className="card">
        <div className="card-header">
          <h3>Cupones y promociones</h3>
          <div className="actions inline">
            <button 
              className="btn btn-outline"
              onClick={() => {
                localStorage.setItem('heyluz_open_cart', '1');
                router.push('/productos');
              }}
            >
              <i className="fas fa-shopping-cart"></i> Ir al carrito
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Alcance</th>
                <th>Vigencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allCoupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="muted">Sin cupones disponibles</td>
                </tr>
              ) : (
                allCoupons.map((coupon, idx) => {
                  const isActive = coupon.active !== false && 
                    (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() >= now);
                  const scope = coupon.scope === 'all' 
                    ? 'Todos' 
                    : (coupon.scope === 'category' 
                      ? `Categoría ${coupon.category}` 
                      : `Productos`);
                  
                  return (
                    <tr key={idx}>
                      <td><code>{coupon.code}</code></td>
                      <td>{coupon.type}</td>
                      <td>
                        {coupon.type === 'percent' 
                          ? `${coupon.value}%` 
                          : formatPrice(coupon.value)}
                      </td>
                      <td>{scope}</td>
                      <td>
                        {coupon.expiresAt 
                          ? new Date(coupon.expiresAt).toLocaleDateString('es-ES')
                          : '—'}
                      </td>
                      <td>
                        {isActive ? (
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleUseCoupon(coupon.code)}
                          >
                            <i className="fas fa-tag"></i> Usar
                          </button>
                        ) : (
                          <span className="muted">No disponible</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Validaciones y feedback visual para el perfil
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');

  const validateProfile = () => {
    const errors = {};
    if (!profile.name || profile.name.trim().length < 2) {
      errors.name = 'El nombre es obligatorio y debe tener al menos 2 caracteres.';
    }
    if (!profile.email || !/^\S+@\S+\.\S+$/.test(profile.email)) {
      errors.email = 'El correo electrónico no es válido.';
    }
    if (profile.phone && profile.phone.length < 7) {
      errors.phone = 'El teléfono debe tener al menos 7 dígitos.';
    }
    return errors;
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const errors = validateProfile();
    setProfileErrors(errors);
    setProfileSuccess('');
    if (Object.keys(errors).length === 0) {
      saveProfile();
      setProfileSuccess('Perfil guardado correctamente');
    }
  };

  const renderProfile = () => (
    <div className="card">
      <div className="card-header">
        <h3>Perfil</h3>
      </div>
      <form onSubmit={handleProfileSave} noValidate>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ minWidth: '80px' }}>Nombre:</span>
            <input 
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Tu nombre"
              style={{ flex: 1, maxWidth: '300px' }}
            />
          </label>
          {profileErrors.name && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{profileErrors.name}</div>}

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ minWidth: '80px' }}>Email:</span>
            <input 
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="tucorreo@ejemplo.com"
              style={{ flex: 1, maxWidth: '300px' }}
            />
          </label>
          {profileErrors.email && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{profileErrors.email}</div>}

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ minWidth: '80px' }}>Teléfono:</span>
            <input 
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+52 123 456 7890"
              style={{ flex: 1, maxWidth: '300px' }}
            />
          </label>
          {profileErrors.phone && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{profileErrors.phone}</div>}
        </div>
        <footer>
          <button className="btn btn-primary" type="submit">
            Guardar perfil
          </button>
        </footer>
        {profileSuccess && <div style={{ color: 'var(--success)', marginTop: '1rem', fontSize: '1rem' }}>{profileSuccess}</div>}
      </form>
    </div>
  );

  const renderWishlist = () => (
    <div className="card">
      <div className="card-header">
        <h3>Mis Favoritos</h3>
        <span className="pill pill-primary">{wishlist.length} productos</span>
      </div>
      {wishlist.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fas fa-heart" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
          <p>No tienes productos en favoritos</p>
          <p style={{ fontSize: '0.9rem' }}>Agrega productos a tu lista de deseos para verlos aquí</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', padding: '1rem' }}>
          {wishlist.map((item) => (
            <div key={item.id} className="card" style={{ padding: '1rem', position: 'relative' }}>
              <button 
                onClick={() => handleRemoveFromWishlist(item.id)}
                className="btn btn-icon"
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--danger)', color: 'white' }}
                title="Eliminar de favoritos"
              >
                <i className="fas fa-times"></i>
              </button>
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                />
              )}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{item.name}</h4>
              <p style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
                {formatPrice(item.price)}
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Ver producto
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div className="card">
      <div className="card-header">
        <h3>Mis Direcciones</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setEditingAddress(null);
            setShowAddressModal(true);
          }}
        >
          <i className="fas fa-plus"></i> Agregar dirección
        </button>
      </div>
      {addresses.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fas fa-map-marker-alt" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
          <p>No tienes direcciones guardadas</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setEditingAddress(null);
              setShowAddressModal(true);
            }}
          >
            Agregar tu primera dirección
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className="card" 
              style={{ 
                padding: '1rem', 
                border: address.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              {address.isDefault && (
                <span className="pill pill-primary" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  Predeterminada
                </span>
              )}
              <h4 style={{ marginBottom: '0.5rem' }}>{address.name || 'Dirección'}</h4>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>{address.street}</p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>
                {address.city}, {address.state} {address.zip}
              </p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>{address.country}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {!address.isDefault && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleSetDefaultAddress(address.id)}
                  >
                    Establecer como predeterminada
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingAddress(address);
                    setShowAddressModal(true);
                  }}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div className="card">
      <div className="card-header">
        <h3>Seguridad</h3>
      </div>
      <div style={{ padding: '1rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Cambiar contraseña</h4>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Actualiza tu contraseña regularmente para mantener tu cuenta segura
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPasswordModal(true)}
        >
          <i className="fas fa-key"></i> Cambiar contraseña
        </button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="card">
      <div className="card-header">
        <h3>Preferencias</h3>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Notificaciones</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={profile.preferences.newsletter}
              onChange={(e) => setProfile({ 
                ...profile, 
                preferences: { ...profile.preferences, newsletter: e.target.checked }
              })}
            />
            <span>Recibir newsletter con ofertas y novedades</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={profile.preferences.notifications}
              onChange={(e) => setProfile({ 
                ...profile, 
                preferences: { ...profile.preferences, notifications: e.target.checked }
              })}
            />
            <span>Recibir notificaciones sobre pedidos</span>
          </label>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Región</h4>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ minWidth: '80px' }}>Idioma:</span>
            <select 
              value={profile.preferences.language}
              onChange={(e) => setProfile({ 
                ...profile, 
                preferences: { ...profile.preferences, language: e.target.value }
              })}
              style={{ flex: 1, maxWidth: '200px' }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ minWidth: '80px' }}>Moneda:</span>
            <select 
              value={profile.preferences.currency}
              onChange={(e) => setProfile({ 
                ...profile, 
                preferences: { ...profile.preferences, currency: e.target.value }
              })}
              style={{ flex: 1, maxWidth: '200px' }}
            >
              <option value="COP">COP ($)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="MXN">MXN ($)</option>
            </select>
          </label>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handlePreferencesSave}
        >
          Guardar preferencias
        </button>
        {isAdmin && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
            <h4>Configuración administradora</h4>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ minWidth: '160px' }}>Pasarela por defecto:</span>
              <select value={appSettings?.defaultGateway || ''} onChange={(e) => saveSettings({ defaultGateway: e.target.value })}>
                <option value="">(Ninguna)</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="gateway">Proveedor personalizado</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  // ============= MODALES =============
  const AddressModal = () => {
    const [formData, setFormData] = React.useState(
      editingAddress || {
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'México',
        isDefault: false
      }
    );
    const [addressErrors, setAddressErrors] = React.useState({});
    const [addressSuccess, setAddressSuccess] = React.useState('');

    const validateAddress = () => {
      const errors = {};
      if (!formData.name || formData.name.trim().length < 2) {
        errors.name = 'La etiqueta es obligatoria y debe tener al menos 2 caracteres.';
      }
      if (!formData.street || formData.street.trim().length < 5) {
        errors.street = 'La calle y número son obligatorios.';
      }
      if (!formData.city || formData.city.trim().length < 2) {
        errors.city = 'La ciudad es obligatoria.';
      }
      if (!formData.state || formData.state.trim().length < 2) {
        errors.state = 'El estado es obligatorio.';
      }
      if (!formData.zip || formData.zip.trim().length < 3) {
        errors.zip = 'El código postal es obligatorio.';
      }
      if (!formData.country || formData.country.trim().length < 2) {
        errors.country = 'El país es obligatorio.';
      }
      return errors;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setAddressSuccess('');
      const errors = validateAddress();
      setAddressErrors(errors);
      if (Object.keys(errors).length === 0) {
        if (editingAddress) {
          handleEditAddress(editingAddress.id, formData);
        } else {
          handleAddAddress(formData);
        }
        setAddressSuccess('Dirección guardada correctamente');
      }
    };

    return (
      <div className="modal-overlay" onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editingAddress ? 'Editar dirección' : 'Nueva dirección'}</h3>
            <button 
              className="btn btn-icon"
              onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <span style={{ display: 'block', marginBottom: '0.25rem' }}>Nombre / Etiqueta:</span>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Casa, Oficina, etc."
                  style={{ width: '100%' }}
                />
              </label>
              {addressErrors.name && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.name}</div>}

              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <span style={{ display: 'block', marginBottom: '0.25rem' }}>Calle y número: *</span>
                <input 
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Av. Principal #123"
                  required
                  style={{ width: '100%' }}
                />
              </label>
              {addressErrors.street && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.street}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>Ciudad: *</span>
                  <input 
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ciudad"
                    required
                    style={{ width: '100%' }}
                  />
                </label>
                {addressErrors.city && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.city}</div>}
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>Estado: *</span>
                  <input 
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Estado"
                    required
                    style={{ width: '100%' }}
                  />
                </label>
                {addressErrors.state && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.state}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>Código postal: *</span>
                  <input 
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="12345"
                    required
                    style={{ width: '100%' }}
                  />
                </label>
                {addressErrors.zip && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.zip}</div>}
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>País: *</span>
                  <input 
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="México"
                    required
                    style={{ width: '100%' }}
                  />
                </label>
                {addressErrors.country && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{addressErrors.country}</div>}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <span>Establecer como dirección predeterminada</span>
              </label>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingAddress ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
            {addressSuccess && <div style={{ color: 'var(--success)', marginTop: '1rem', fontSize: '1rem' }}>{addressSuccess}</div>}
          </form>
        </div>
      </div>
    );
  };

    const renderPayments = () => (
      <div className="card">
        <div className="card-header">
          <h3>Métodos de pago</h3>
          <div className="actions inline">
            <button className="btn btn-primary" onClick={() => { setShowPaymentModal(true); setEditingPayment(null); }}>
              <i className="fas fa-plus"></i> Agregar método
            </button>
          </div>
        </div>
        {paymentMethods.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="muted">No tienes métodos de pago guardados</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem' }}>
            {paymentMethods.map(pm => (
              <div key={pm.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{pm.label || (pm.provider ? pm.provider : 'Método')}</strong>
                  <div className="muted">{pm.provider ? `Proveedor: ${pm.provider}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!pm.isDefault && <button className="btn btn-secondary" onClick={() => handleSetDefaultPayment(pm.id)}>Predeterminar</button>}
                  <button className="btn btn-outline" onClick={() => { setEditingPayment(pm); setShowPaymentModal(true); }}>Editar</button>
                  <button className="btn btn-danger" onClick={() => handleDeletePayment(pm.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

  const PasswordModal = () => (
    <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cambiar contraseña</h3>
          <button 
            className="btn btn-icon"
            onClick={() => setShowPasswordModal(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handlePasswordChange}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Tu contraseña debe tener al menos 6 caracteres
            </p>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>Contraseña actual: *</span>
              <input 
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>Nueva contraseña: *</span>
              <input 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>Confirmar nueva contraseña: *</span>
              <input 
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                style={{ width: '100%' }}
              />
            </label>
            {passwordForm.newPassword && passwordForm.confirmPassword && 
             passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Cambiar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Navegación mi cuenta">
          <ul className="admin-nav">
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
              >
                <i className="fas fa-user-circle"></i> Resumen
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}
              >
                <i className="fas fa-receipt"></i> Mis compras
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'coupons' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('coupons'); }}
              >
                <i className="fas fa-ticket-alt"></i> Cupones y promos
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
              >
                <i className="fas fa-id-card"></i> Perfil
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('wishlist'); }}
              >
                <i className="fas fa-heart"></i> Favoritos
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('addresses'); }}
              >
                <i className="fas fa-map-marker-alt"></i> Direcciones
              </a>
            </li>
            <li>
              <a
                className={`admin-nav-link ${activeTab === 'payments' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('payments'); }}
              >
                <i className="fas fa-credit-card"></i> Métodos de pago
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'security' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('security'); }}
              >
                <i className="fas fa-lock"></i> Seguridad
              </a>
            </li>
            <li>
              <a 
                className={`admin-nav-link ${activeTab === 'preferences' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('preferences'); }}
              >
                <i className="fas fa-cog"></i> Preferencias
              </a>
            </li>
            <li>
              <a
                className={`admin-nav-link ${activeTab === 'messages' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('messages'); }}
              >
                <i className="fas fa-bell"></i> Mensajes {unreadCount > 0 && <span className="pill pill-primary" style={{ marginLeft: '0.5rem' }}>{unreadCount}</span>}
              </a>
            </li>
          </ul>
        </aside>

        <div className="admin-main">
          <header className="admin-header">
            <h1>Mi cuenta</h1>
            <div className="actions inline">
              <form action="/api/auth/logout" method="post">
                <button className="btn btn-outline" type="submit">
                  <i className="fas fa-sign-out-alt"></i> Salir
                </button>
              </form>
            </div>
          </header>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'coupons' && renderCoupons()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'wishlist' && renderWishlist()}
          {activeTab === 'addresses' && renderAddresses()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'messages' && renderMessages()}
        </div>
      </div>

      {/* Modal de detalle de pedido */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle de pedido</h2>
              <button 
                className="close-modal"
                onClick={() => setShowOrderModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const breakdown = computeOrderBreakdown(selectedOrder);
                const shippingAddress = selectedOrder.shippingAddress || selectedOrder.address || {};
                const paymentMethod = selectedOrder.paymentMethod || selectedOrder.payment || selectedOrder.payMethod || '';
                return (
                  <div className="order-details-grid">
                    <div className="order-info-row">
                      <span className="order-info-label">ID:</span>
                      <span className="order-info-value">{selectedOrder.id}</span>
                    </div>
                    <div className="order-info-row">
                      <span className="order-info-label">Factura:</span>
                      <span className="order-info-value">
                        {selectedOrder.invoiceId || <span className="muted">Sin factura</span>}
                      </span>
                    </div>
                    <div className="order-info-row">
                      <span className="order-info-label">Fecha:</span>
                      <span className="order-info-value">
                        {new Date(selectedOrder.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <div className="order-info-row">
                      <span className="order-info-label">Estado:</span>
                      <span className={getStatusClass(selectedOrder.status)}>
                        {(selectedOrder.status || 'pendiente').toLowerCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <div className="order-items-section">
                          <strong className="order-items-title">Productos</strong>
                          <div className="order-items-list">
                            {breakdown.items.map((item, idx) => (
                              <div key={idx} className="order-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <div className="order-item-info">
                                  <i className="fas fa-box order-item-icon" style={{ marginRight: '0.5rem' }}></i>
                                  <div>
                                    <span className="order-item-name">{item.name || item.title || item.product || 'Producto'}</span>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                      {item.quantity ? `Cantidad: ${item.quantity}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="order-item-price">{formatPrice(Number(item.price || item.total || 0))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <aside style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Dirección de envío</strong>
                          {shippingAddress && Object.keys(shippingAddress).length > 0 ? (
                            <div style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                              <div>{shippingAddress.name || shippingAddress.recipient || ''}</div>
                              <div>{shippingAddress.street || shippingAddress.line1 || ''}</div>
                              <div>{(shippingAddress.city || '') + (shippingAddress.state ? ', ' + shippingAddress.state : '')}</div>
                              <div>{(shippingAddress.zip || '') + (shippingAddress.country ? ' · ' + shippingAddress.country : '')}</div>
                            </div>
                          ) : (
                            <div className="muted">No especificada</div>
                          )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Método de pago</strong>
                          <div style={{ marginTop: '0.5rem' }}>{String(paymentMethod || 'No especificado')}</div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                          <strong>Totales</strong>
                          <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatPrice(breakdown.subtotal)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Envío</span><span>{breakdown.shipping === 0 ? 'GRATIS' : formatPrice(breakdown.shipping)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Impuestos</span><span>{formatPrice(breakdown.tax)}</span></div>
                            {breakdown.discount ? <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Descuento</span><span>-{formatPrice(breakdown.discount)}</span></div> : null}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginTop: '0.4rem' }}><span>Total</span><span>{formatPrice(breakdown.total)}</span></div>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowOrderModal(false)}
              >
                Cerrar
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* Usuarios normales solo pueden marcar recibido (entregado) */}
                <button 
                  className="btn btn-primary"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'mark_received')}
                  disabled={orderActionLoading}
                  title="Marcar como recibido"
                >
                  <i className="fas fa-check"></i> Marcar recibido
                </button>

                {isAdmin && (
                  <>
                    <button 
                      className="btn btn-outline"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'mark_shipped')}
                      disabled={orderActionLoading}
                      title="Marcar como enviado"
                    >
                      <i className="fas fa-shipping-fast"></i> Marcar enviado
                    </button>

                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        if (!confirm('¿Quieres solicitar devolución o cancelar este pedido?')) return;
                        updateOrderStatus(selectedOrder.id, 'request_return');
                      }}
                      disabled={orderActionLoading}
                      title="Solicitar devolución/cancelar"
                    >
                      <i className="fas fa-undo"></i> Solicitar devolución
                    </button>

                    <button 
                      className="btn btn-secondary"
                      onClick={() => window.print()}
                    >
                      <i className="fas fa-print"></i> Imprimir
                    </button>
                  </>
                )}

                {/* Botón de factura para usuarios si existe invoiceId */}
                {selectedOrder.invoiceId && (
                  <button className="btn btn-primary" onClick={() => openInvoiceWindow(selectedOrder)}>
                    <i className="fas fa-file-invoice"></i> Factura / Imprimir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Modal de nuevo mensaje */}
  {showNewMessageModal && <NewMessageModal />}

  {/* Modal de dirección */}
  {showAddressModal && <AddressModal />}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); setPaymentErrors({}); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPayment ? 'Editar método de pago' : 'Agregar método de pago'}</h3>
              <button className="btn btn-icon" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); setPaymentErrors({}); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const label = (form.label.value || '').trim();
              const provider = (form.provider.value || '').trim();
              const isDefault = form.isDefault.checked;

              const errors = {};
              if (!label) errors.label = 'Etiqueta obligatoria para identificar el método.';
              if (!provider) errors.provider = 'Selecciona el proveedor/pasarela.';

              setPaymentErrors(errors);
              if (Object.keys(errors).length > 0) return;

              const data = { label, provider, isDefault };
              if (editingPayment) {
                handleEditPayment(editingPayment.id, data);
              } else {
                handleAddPayment(data);
              }
              setShowPaymentModal(false);
              setEditingPayment(null);
              setPaymentErrors({});
            }}>
              <div className="modal-body">
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <span>Etiqueta</span>
                  <input name="label" defaultValue={editingPayment?.label || ''} placeholder="Mi método (ej: PayPal, Tarjeta Visa)" />
                  {paymentErrors.label && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{paymentErrors.label}</div>}
                </label>

                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <span>Proveedor / Pasarela</span>
                  <select name="provider" defaultValue={editingPayment?.provider || 'gateway'}>
                    <option value="gateway">Proveedor (pasarela)</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="cod">Contra entrega (COD)</option>
                  </select>
                  {paymentErrors.provider && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{paymentErrors.provider}</div>}
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" name="isDefault" defaultChecked={editingPayment?.isDefault || false} /> Establecer como predeterminada
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); setPaymentErrors({}); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingPayment ? 'Actualizar' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de contraseña */}
      {showPasswordModal && <PasswordModal />}
    </>
  );
}

export default function UserDashboard({ user }) {
  return (
    <ToastProvider>
      <UserDashboardContent user={user} />
    </ToastProvider>
  );
}
