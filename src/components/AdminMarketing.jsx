'use client';

import { useState, useEffect } from 'react';
import { getSettings, saveSettings, formatPrice, generateId } from '@/utils/adminUtils';

export default function AdminMarketing() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState({ coupons: [], banners: [] });
  const [tab, setTab] = useState('cupones');

  // Modal cupones
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'porcentaje',
    value: '',
    expires: '',
    maxUses: '',
    used: 0,
    active: true
  });

  // Modal banners
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    image: '',
    title: '',
    text: '',
    link: '',
    active: true
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadSettings();
    }
  }, [isMounted]);

  const loadSettings = () => {
    const s = getSettings();
    setSettings({
      coupons: s.coupons || [],
      banners: s.banners || []
    });
  };

  // Cupones
  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      type: 'porcentaje',
      value: '',
      expires: '',
      maxUses: '',
      used: 0,
      active: true
    });
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({ ...coupon });
    setShowCouponModal(true);
  };

  const handleDeleteCoupon = (id) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    const updated = settings.coupons.filter(c => c.id !== id);
    saveSettings({ ...settings, coupons: updated });
    setSettings(s => ({ ...s, coupons: updated }));
    alert('✅ Cupón eliminado');
  };

  const handleSubmitCoupon = (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.value) {
      alert('⚠️ Código y valor son obligatorios');
      return;
    }
    let updated;
    if (editingCoupon) {
      updated = settings.coupons.map(c =>
        c.id === editingCoupon.id ? { ...couponForm, id: editingCoupon.id } : c
      );
      alert('✅ Cupón actualizado');
    } else {
      updated = [
        ...settings.coupons,
        { ...couponForm, id: generateId('coup-'), used: 0 }
      ];
      alert('✅ Cupón creado');
    }
    saveSettings({ ...settings, coupons: updated });
    setSettings(s => ({ ...s, coupons: updated }));
    setShowCouponModal(false);
  };

  // Banners
  const handleCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      image: '',
      title: '',
      text: '',
      link: '',
      active: true
    });
    setShowBannerModal(true);
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerForm({ ...banner });
    setShowBannerModal(true);
  };

  const handleDeleteBanner = (id) => {
    if (!confirm('¿Eliminar este banner?')) return;
    const updated = settings.banners.filter(b => b.id !== id);
    saveSettings({ ...settings, banners: updated });
    setSettings(s => ({ ...s, banners: updated }));
    alert('✅ Banner eliminado');
  };

  const handleSubmitBanner = (e) => {
    e.preventDefault();
    if (!bannerForm.image || !bannerForm.title) {
      alert('⚠️ Imagen y título son obligatorios');
      return;
    }
    let updated;
    if (editingBanner) {
      updated = settings.banners.map(b =>
        b.id === editingBanner.id ? { ...bannerForm, id: editingBanner.id } : b
      );
      alert('✅ Banner actualizado');
    } else {
      updated = [
        ...settings.banners,
        { ...bannerForm, id: generateId('ban-') }
      ];
      alert('✅ Banner creado');
    }
    saveSettings({ ...settings, banners: updated });
    setSettings(s => ({ ...s, banners: updated }));
    setShowBannerModal(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Marketing</h1>
        <div className="actions inline">
          <button
            className={tab === 'cupones' ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setTab('cupones')}
          >
            <i className="fas fa-ticket-alt"></i> Cupones
          </button>
          <button
            className={tab === 'banners' ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setTab('banners')}
          >
            <i className="fas fa-bullhorn"></i> Banners
          </button>
        </div>
      </div>

      {/* Cupones */}
      {tab === 'cupones' && (
        <div className="card">
          <div className="card-header">
            <h3>Cupones de descuento</h3>
            <span className="pill pill-primary">{settings.coupons.length} cupones</span>
            <button className="btn btn-primary ml-md" onClick={handleCreateCoupon}>
              <i className="fas fa-plus"></i> Nuevo cupón
            </button>
          </div>
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Expira</th>
                  <th>Usos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {settings.coupons.length === 0 ? (
                  <tr key="no-coupons">
                    <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay cupones creados.
                    </td>
                  </tr>
                ) : (
                  settings.coupons.map((coupon) => (
                    <tr key={coupon.id || coupon.code}>
                      <td><strong>{coupon.code}</strong></td>
                      <td>{coupon.type === 'porcentaje' ? 'Porcentaje' : 'Fijo'}</td>
                      <td>
                        {coupon.type === 'porcentaje'
                          ? `${coupon.value}%`
                          : formatPrice(coupon.value)}
                      </td>
                      <td>
                        {coupon.expires
                          ? new Date(coupon.expires).toLocaleDateString('es-CO')
                          : '—'}
                      </td>
                      <td>
                        <span className="pill">
                          {coupon.used || 0} / {coupon.maxUses || '∞'}
                        </span>
                      </td>
                      <td>
                        {coupon.active ? (
                          <span className="pill ok">Activo</span>
                        ) : (
                          <span className="pill off">Inactivo</span>
                        )}
                      </td>
                      <td>
                        <div className="inline" style={{ gap: '0.25rem' }}>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleEditCoupon(coupon)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleDeleteCoupon(coupon.id)}
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
      )}

      {/* Banners */}
      {tab === 'banners' && (
        <div className="card">
          <div className="card-header">
            <h3>Banners promocionales</h3>
            <span className="pill pill-primary">{settings.banners.length} banners</span>
            <button className="btn btn-primary ml-md" onClick={handleCreateBanner}>
              <i className="fas fa-plus"></i> Nuevo banner
            </button>
          </div>
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Título</th>
                  <th>Texto</th>
                  <th>Link</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {settings.banners.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay banners creados.
                    </td>
                  </tr>
                ) : (
                  settings.banners.map((banner) => (
                    <tr key={banner.id}>
                      <td>
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt={banner.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', background: 'var(--gray-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-image" style={{ color: 'var(--text-secondary)' }}></i>
                          </div>
                        )}
                      </td>
                      <td><strong>{banner.title}</strong></td>
                      <td>{banner.text}</td>
                      <td>
                        {banner.link ? (
                          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="pill">
                            {banner.link}
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        {banner.active ? (
                          <span className="pill ok">Activo</span>
                        ) : (
                          <span className="pill off">Inactivo</span>
                        )}
                      </td>
                      <td>
                        <div className="inline" style={{ gap: '0.25rem' }}>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleEditBanner(banner)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleDeleteBanner(banner.id)}
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
      )}

      {/* Modal cupones */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingCoupon ? 'Editar cupón' : 'Nuevo cupón'}</h2>
              <button className="close-modal" onClick={() => setShowCouponModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitCoupon}>
                <div className="form-group">
                  <label>Código *</label>
                  <input type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Tipo *</label>
                  <select value={couponForm.type} onChange={e => setCouponForm({ ...couponForm, type: e.target.value })} required>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Valor fijo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Valor *</label>
                  <input type="number" value={couponForm.value} onChange={e => setCouponForm({ ...couponForm, value: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Expira</label>
                  <input type="date" value={couponForm.expires} onChange={e => setCouponForm({ ...couponForm, expires: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Usos máximos</label>
                  <input type="number" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm({ ...couponForm, active: e.target.checked })} />
                    <span>Activo</span>
                  </label>
                </div>
                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCouponModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingCoupon ? 'Actualizar' : 'Crear'} cupón</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal banners */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Editar banner' : 'Nuevo banner'}</h2>
              <button className="close-modal" onClick={() => setShowBannerModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitBanner}>
                <div className="form-group">
                  <label>URL de imagen *</label>
                  <input type="text" value={bannerForm.image} onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })} required />
                  {bannerForm.image && (
                    <img src={bannerForm.image} alt="Preview" style={{ marginTop: '0.5rem', maxWidth: '200px', borderRadius: '8px' }} onError={e => e.target.style.display = 'none'} />
                  )}
                </div>
                <div className="form-group">
                  <label>Título *</label>
                  <input type="text" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Texto</label>
                  <input type="text" value={bannerForm.text} onChange={e => setBannerForm({ ...bannerForm, text: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Link</label>
                  <input type="text" value={bannerForm.link} onChange={e => setBannerForm({ ...bannerForm, link: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm({ ...bannerForm, active: e.target.checked })} />
                    <span>Activo</span>
                  </label>
                </div>
                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowBannerModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingBanner ? 'Actualizar' : 'Crear'} banner</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
