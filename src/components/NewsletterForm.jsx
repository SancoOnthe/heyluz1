'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEFAULT_CONFIG = {
  memberTitle: '¡Bienvenido, {name}!',
  memberSubtitle: 'Como miembro exclusivo de HEYLUZ AROMAS, disfruta de beneficios únicos',
  benefits: [
    { icon: 'fa-percent', title: 'Hasta 20% de descuento', description: 'En productos seleccionados cada semana' },
    { icon: 'fa-gift', title: 'Envío gratis', description: 'En compras superiores a $40' },
    { icon: 'fa-star', title: 'Acceso anticipado', description: 'A nuevos lanzamientos y colecciones limitadas' }
  ]
};

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Cargar configuración desde localStorage
    try {
      const settings = localStorage.getItem('heyluz_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.newsletter) {
          setConfig(parsed.newsletter);
        }
      }
    } catch (e) {
      console.error('Error loading newsletter config:', e);
    }

    // Verificar si hay sesión activa
    fetch('/api/auth/check', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // No hay sesión, usuario público
      });
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    params.set('source', 'newsletter');
    router.push(`/register?${params.toString()}`);
  };

  if (!mounted) {
    return null; // Evitar hidratación
  }

  // Si hay usuario autenticado, mostrar contenido exclusivo
  if (user) {
    const title = config.memberTitle.replace('{name}', user.name || 'Miembro');
    
    return (
      <div className="newsletter-member-content">
        <div className="member-welcome">
          <i className="fas fa-crown" style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', opacity: 0.9 }}>
            {config.memberSubtitle}
          </p>
        </div>
        <div className="member-benefits" style={{ display: 'grid', gap: '1rem', textAlign: 'left' }}>
          {config.benefits.map((benefit, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <i className={`fas ${benefit.icon}`} style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{benefit.title}</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{benefit.description}</span>
              </div>
            </div>
          ))}
        </div>
        <Link href="/productos" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
          Explorar Ofertas Exclusivas
        </Link>
      </div>
    );
  }

  // Usuario no autenticado: mostrar formulario de suscripción
  return (
    <form className="newsletter-form" onSubmit={onSubmit}>
      <div className="form-group">
        <input type="email" name="email" placeholder="Tu correo electrónico" required value={email} onChange={(e)=>setEmail(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Redirigiendo…' : 'Suscribirme Ahora'}
      </button>
      <p className="newsletter-privacy">Al suscribirte aceptas nuestra política de privacidad. Puedes cancelar en cualquier momento.</p>
    </form>
  );
}
