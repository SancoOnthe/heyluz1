'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContactForm() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('heyluz_profile') || 'null');
      if (profile && (profile.email || profile.name)) {
        setLoggedIn(true);
        return;
      }
    } catch (e) {
      // ignore
    }

    // fallback: detectar cookie de sesión
    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.split('; ').find(c => c.startsWith('session='));
        if (match) setLoggedIn(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOk(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo enviar');
      setOk(true);
      setForm({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
    } catch (err) {
      setError(err.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    loggedIn ? (
      <div className="card" style={{ padding: '1rem' }}>
        <h4>Enviar mensaje</h4>
        <p className="muted">Ya estás registrado. Usa el panel de usuario para enviar mensajes y revisar respuestas.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Link href="/user?tab=messages" className="btn btn-primary">Ir a Mensajes</Link>
          <button className="btn btn-outline" onClick={() => window.location.href = '/user?tab=messages'}>Abrir panel</button>
        </div>
      </div>
    ) : (
      <form className="contact-form" onSubmit={onSubmit}>
      <div className="form-group">
        <input type="text" name="nombre" placeholder="Tu nombre" required value={form.nombre} onChange={onChange} />
      </div>
      <div className="form-group">
        <input type="email" name="email" placeholder="Tu email" required value={form.email} onChange={onChange} />
      </div>
      <div className="form-group">
        <input type="tel" name="telefono" placeholder="Tu teléfono" value={form.telefono} onChange={onChange} />
      </div>
      <div className="form-group">
        <select name="asunto" title="Selecciona el asunto de tu consulta" required value={form.asunto} onChange={onChange}>
          <option value="">Selecciona un asunto</option>
          <option value="consulta">Consulta General</option>
          <option value="producto">Consulta de Producto</option>
          <option value="pedido">Estado de Pedido</option>
          <option value="devolucion">Devolución</option>
        </select>
      </div>
      <div className="form-group">
        <textarea name="mensaje" placeholder="Tu mensaje" rows={5} required value={form.mensaje} onChange={onChange} />
      </div>
      {ok && <div className="pill" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', marginBottom: '1rem' }}>¡Mensaje enviado! Te responderemos pronto.</div>}
      {error && <div className="pill danger" style={{ background: '#fee', color: '#900', marginBottom: '1rem' }}>{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Mensaje'}</button>
    </form>
    )
  );
}
