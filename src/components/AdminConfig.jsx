'use client';

import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/utils/adminUtils';

const CURRENCIES = [
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'USD', symbol: 'US$', name: 'Dólar estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' }
];

export default function AdminConfig() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState({
    currency: 'COP',
    currencySymbol: '$',
    decimals: 0,
    tax: 19,
    shipping: 9900,
    freeShippingMin: 150000,
    paymentMethods: ['Efectivo', 'Tarjeta', 'Transferencia'],
    company: {
      name: '',
      email: '',
      phone: '',
      address: '',
      instagram: '',
      facebook: ''
    },
    newsletter: {
      memberTitle: '¡Bienvenido, {name}!',
      memberSubtitle: 'Como miembro exclusivo de HEYLUZ AROMAS, disfruta de beneficios únicos',
      benefits: [
        { icon: 'fa-percent', title: 'Hasta 20% de descuento', description: 'En productos seleccionados cada semana' },
        { icon: 'fa-gift', title: 'Envío gratis', description: 'En compras superiores a $40' },
        { icon: 'fa-star', title: 'Acceso anticipado', description: 'A nuevos lanzamientos y colecciones limitadas' }
      ]
    }
  });
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const s = getSettings();
      setSettings(s);
        setForm({
          ...s,
          paymentMethods: Array.isArray(s.paymentMethods) ? s.paymentMethods : []
        });
    }
  }, [isMounted]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const handleNewsletterChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      newsletter: { ...prev.newsletter, [field]: value }
    }));
  };

  const handleBenefitChange = (idx, field, value) => {
    const updated = [...form.newsletter.benefits];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm(prev => ({
      ...prev,
      newsletter: { ...prev.newsletter, benefits: updated }
    }));
  };

  const handleAddBenefit = () => {
    const newBenefit = { icon: 'fa-star', title: '', description: '' };
    setForm(prev => ({
      ...prev,
      newsletter: { ...prev.newsletter, benefits: [...prev.newsletter.benefits, newBenefit] }
    }));
  };

  const handleRemoveBenefit = (idx) => {
    const updated = form.newsletter.benefits.filter((_, i) => i !== idx);
    setForm(prev => ({
      ...prev,
      newsletter: { ...prev.newsletter, benefits: updated }
    }));
  };

  const handlePaymentMethodChange = (idx, value) => {
    const updated = [...form.paymentMethods];
    updated[idx] = value;
    setForm(prev => ({ ...prev, paymentMethods: updated }));
  };

  const handleAddPaymentMethod = () => {
    setForm(prev => ({ ...prev, paymentMethods: [...prev.paymentMethods, ''] }));
  };

  const handleRemovePaymentMethod = (idx) => {
    const updated = form.paymentMethods.filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, paymentMethods: updated }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    saveSettings(form);
    setSettings(form);
    setTimeout(() => {
      setSaving(false);
      alert('✅ Configuración guardada');
    }, 600);
  };

  if (!isMounted) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Configuración</h1>
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
        <h1>Configuración</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="contact-form">
          <h3 className="mb-16">Moneda y formato</h3>
          <div className="grid grid-2 mb-24">
            <div className="form-group">
              <label>Moneda</label>
              <select
                value={form.currency}
                onChange={e => handleChange('currency', e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Símbolo</label>
              <input
                type="text"
                value={form.currencySymbol ?? ""}
                onChange={e => handleChange('currencySymbol', e.target.value)}
                maxLength={3}
              />
            </div>
            <div className="form-group">
              <label>Decimales</label>
              <input
                type="number"
                value={form.decimals !== undefined && form.decimals !== null ? form.decimals : 0}
                onChange={e => handleChange('decimals', Number(e.target.value))}
                min={0}
                max={2}
              />
            </div>
          </div>

          <h3 className="mb-16">Impuestos y envío</h3>
          <div className="grid grid-2 mb-24">
            <div className="form-group">
              <label>IVA (%)</label>
              <input
                type="number"
                value={form.tax !== undefined && form.tax !== null ? form.tax : 0}
                onChange={e => handleChange('tax', Number(e.target.value))}
                min={0}
                max={30}
              />
            </div>
            <div className="form-group">
              <label>Costo de envío</label>
              <input
                type="number"
                value={form.shipping !== undefined && form.shipping !== null ? form.shipping : 0}
                onChange={e => handleChange('shipping', Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="form-group">
              <label>Envío gratis desde</label>
              <input
                type="number"
                value={form.freeShippingMin !== undefined && form.freeShippingMin !== null ? form.freeShippingMin : 0}
                onChange={e => handleChange('freeShippingMin', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <h3 className="mb-16">Métodos de pago</h3>
          <div className="mb-24">
            {form.paymentMethods.map((method, idx) => (
              <div key={idx} className="inline mb-8" style={{ gap: '0.5rem' }}>
                <input
                  type="text"
                  value={method !== undefined && method !== null ? method : ""}
                  onChange={e => handlePaymentMethodChange(idx, e.target.value)}
                  style={{ minWidth: '160px' }}
                />
                <button type="button" className="btn btn-outline btn-icon" onClick={() => handleRemovePaymentMethod(idx)} title="Eliminar método">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-primary" onClick={handleAddPaymentMethod}>
              <i className="fas fa-plus"></i> Añadir método
            </button>
          </div>

          <h3 className="mb-16">Datos de contacto y empresa</h3>
          <div className="grid grid-2 mb-24">
            <div className="form-group">
              <label>Nombre empresa</label>
              <input
                type="text"
                value={form.company?.name ?? ''}
                onChange={e => handleCompanyChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.company?.email ?? ''}
                onChange={e => handleCompanyChange('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={form.company?.phone ?? ''}
                onChange={e => handleCompanyChange('phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={form.company?.address ?? ''}
                onChange={e => handleCompanyChange('address', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                value={form.company?.instagram ?? ''}
                onChange={e => handleCompanyChange('instagram', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Facebook</label>
              <input
                type="text"
                value={form.company?.facebook ?? ''}
                onChange={e => handleCompanyChange('facebook', e.target.value)}
              />
            </div>
          </div>

          <h3 className="mb-16">Sección Newsletter / Miembros</h3>
          <div className="mb-24">
            <div className="form-group">
              <label>Título para miembros <small className="muted">(usa {'{name}'} para el nombre del usuario)</small></label>
              <input
                type="text"
                value={form.newsletter?.memberTitle ?? ''}
                onChange={e => handleNewsletterChange('memberTitle', e.target.value)}
                placeholder="¡Bienvenido, {name}!"
              />
            </div>
            <div className="form-group">
              <label>Subtítulo para miembros</label>
              <input
                type="text"
                value={form.newsletter?.memberSubtitle ?? ''}
                onChange={e => handleNewsletterChange('memberSubtitle', e.target.value)}
                placeholder="Como miembro exclusivo..."
              />
            </div>

            <h4 className="mt-24 mb-16">Beneficios de membresía</h4>
            {form.newsletter?.benefits?.map((benefit, idx) => (
              <div key={idx} className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)' }}>
                <div className="grid grid-3" style={{ gap: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Icono FontAwesome <small className="muted">(ej: fa-percent, fa-gift)</small></label>
                    <input
                      type="text"
                      value={benefit.icon ?? ''}
                      onChange={e => handleBenefitChange(idx, 'icon', e.target.value)}
                      placeholder="fa-star"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Título</label>
                    <input
                      type="text"
                      value={benefit.title ?? ''}
                      onChange={e => handleBenefitChange(idx, 'title', e.target.value)}
                      placeholder="Hasta 20% de descuento"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Descripción</label>
                    <input
                      type="text"
                      value={benefit.description ?? ''}
                      onChange={e => handleBenefitChange(idx, 'description', e.target.value)}
                      placeholder="En productos seleccionados"
                    />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline btn-small" onClick={() => handleRemoveBenefit(idx)}>
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-primary" onClick={handleAddBenefit}>
              <i className="fas fa-plus"></i> Añadir beneficio
            </button>
          </div>

          <div className="modal-footer" style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
