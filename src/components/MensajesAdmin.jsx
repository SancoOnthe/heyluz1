 'use client';

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext.js';
import { showNotification } from '@/utils/notifications';
import { 
  requestNotificationPermission, 
  showNewMessageNotification,
  getNotificationPermissionStatus 
} from '@/utils/notifications';

function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    const t = useToast?.();
    try { if (t) t.info('No hay datos para exportar'); } catch (e) { /* ignore */ }
    return;
  }
  
  const headers = ['ID', 'Fecha', 'Nombre', 'Email', 'Teléfono', 'Asunto', 'Mensaje', 'Estado'];
  const rows = data.map(m => [
    m.id,
    new Date(m.createdAt).toLocaleString(),
    m.nombre,
    m.email,
    m.telefono || '',
    m.asunto,
    m.mensaje.replace(/"/g, '""'), // escapar comillas
    m.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${c}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ReplyEditor({ message, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text || text.trim().length < 3) {
      const t = useToast?.();
      try { if (t) t.warning('Escribe una respuesta de al menos 3 caracteres'); } catch (e) { /* ignore */ }
      return;
    }
    setSending(true);
    try {
      await onSend(message.id, text);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Escribir respuesta</strong></label>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>{sending ? 'Enviando...' : 'Enviar respuesta'}</button>
        <button className="btn btn-outline" onClick={() => setText('')} disabled={sending}>Limpiar</button>
      </div>
    </div>
  );
}

export default function MensajesAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [query, setQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const previousMessageIds = useRef(new Set());
  const pollingInterval = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/contact', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        const newMessages = data.data;
        
        // Detectar mensajes nuevos para notificaciones
        if (previousMessageIds.current.size > 0 && notificationsEnabled) {
          const currentIds = new Set(newMessages.map(m => m.id));
          const newIds = [...currentIds].filter(id => !previousMessageIds.current.has(id));
          
          // Mostrar notificación para cada mensaje nuevo
          newIds.forEach(id => {
            const message = newMessages.find(m => m.id === id);
            if (message && message.status === 'nuevo') {
              showNewMessageNotification(message);
            }
          });
        }
        
        // Actualizar el set de IDs conocidos
        previousMessageIds.current = new Set(newMessages.map(m => m.id));
        setMessages(newMessages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Inicializar y solicitar permisos de notificaciones
  useEffect(() => {
    const initNotifications = async () => {
      const permitted = await requestNotificationPermission();
      setNotificationsEnabled(permitted);
    };
    initNotifications();
    load();
  }, []);

  // Polling cada 30 segundos cuando las notificaciones están habilitadas
  useEffect(() => {
    if (notificationsEnabled) {
      pollingInterval.current = setInterval(() => {
        load(true); // Silent load para no mostrar spinner
      }, 30000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [notificationsEnabled]);

  const changeStatus = async (id, status) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => prev.map(m => m.id === id ? data.data : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendReply = async (id, text) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: { body: text } })
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => prev.map(m => m.id === id ? data.data : m));
        const t = useToast?.();
        try { if (t) t.success('Respuesta enviada y guardada'); } catch (e) { /* ignore */ }
        try { showNotification('Respuesta enviada', { body: `Respuesta a ${data.data.nombre}` }); } catch (e) { /* ignore */ }
      } else {
        const t = useToast?.();
        try { if (t) t.error('No se pudo enviar la respuesta: ' + (data.error || 'error')); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error(err);
      alert('Error enviando la respuesta');
    }
  };


  // Fechas localizadas solo en cliente para evitar error de hidratación
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => { setClientReady(true); }, []);

  const filtered = messages.filter(m => {
    const matchStatus = filter === 'todos' || m.status === filter;
    const text = (m.nombre + ' ' + m.email + ' ' + m.mensaje).toLowerCase();
    const matchQuery = !query || text.includes(query.toLowerCase());
    return matchStatus && matchQuery;
  });

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCSV(filtered, `mensajes-${timestamp}.csv`);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    } else {
      const permitted = await requestNotificationPermission();
      if (permitted) {
        setNotificationsEnabled(true);
        load(true);
      } else {
        alert('Por favor, habilita las notificaciones en la configuración de tu navegador');
      }
    }
  };

  const notificationStatus = getNotificationPermissionStatus();
  const newMessagesCount = messages.filter(m => m.status === 'nuevo').length;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>
          Mensajes
          {newMessagesCount > 0 && (
            <span className="pill pill-primary" style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
              {newMessagesCount} {newMessagesCount === 1 ? 'nuevo' : 'nuevos'}
            </span>
          )}
        </h1>
        <div className="actions inline">
          {clientReady && notificationStatus !== 'unsupported' && (
            <button 
              className={`btn ${notificationsEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleToggleNotifications}
              title={notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
            >
              <i className={`fas fa-bell${notificationsEnabled ? '' : '-slash'}`}/>
              {notificationsEnabled ? ' Activas' : ' Activar'}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => load()}><i className="fas fa-rotate"/> Actualizar</button>
          <button className="btn btn-outline" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <i className="fas fa-file-csv"/> Exportar CSV
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="nuevo">Nuevos</option>
            <option value="leido">Leídos</option>
            <option value="archivado">Archivados</option>
          </select>
          <input placeholder="Buscar por nombre, email o texto" value={query} onChange={e=>setQuery(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
        </div>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}></i>
            <p>No hay mensajes</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Asunto</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>{clientReady ? new Date(m.createdAt).toLocaleString() : ''}</td>
                    <td>{m.nombre}</td>
                    <td><a href={`mailto:${m.email}`}>{m.email}</a></td>
                    <td>
                      <span className="pill" style={{ textTransform: 'capitalize' }}>{m.asunto}</span>
                    </td>
                    <td style={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.mensaje}</td>
                    <td>
                      <select value={m.status} onChange={(e)=>changeStatus(m.id, e.target.value)}>
                        <option value="nuevo">Nuevo</option>
                        <option value="leido">Leído</option>
                        <option value="archivado">Archivado</option>
                      </select>
                    </td>
                    <td>
                      <details>
                        <summary className="btn btn-small btn-outline">Ver / Responder</summary>
                        <div style={{ padding: '0.75rem 0' }}>
                          <p style={{ margin: 0 }}><strong>Teléfono:</strong> {m.telefono || '—'}</p>
                          <p style={{ margin: 0 }}><strong>Mensaje:</strong></p>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{m.mensaje}</p>
                          {m.reply ? (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', borderLeft: '3px solid var(--border-color)', background: '#f9f9f9' }}>
                              <strong>Respuesta:</strong>
                              <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{m.reply.body}</p>
                              <div className="muted" style={{ fontSize: '0.85rem' }}>Respondido por: {m.reply.responder || 'admin'} • {clientReady ? new Date(m.reply.repliedAt).toLocaleString() : ''}</div>
                            </div>
                          ) : (
                            <ReplyEditor message={m} onSend={sendReply} />
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
