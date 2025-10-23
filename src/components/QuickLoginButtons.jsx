'use client';

export default function QuickLoginButtons() {
  const handleQuickLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        window.location.href = data.redirect || '/';
      } else {
        alert(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      alert('Error al iniciar sesión');
    }
  };

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem',
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)'
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
        ⚡ Acceso Rápido (Desarrollo)
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Haz clic para iniciar sesión automáticamente:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          onClick={() => handleQuickLogin('admin@heyluz.com', 'admin123')}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}
        >
          <i className="fas fa-user-shield" style={{ color: 'var(--danger)' }}></i>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Administrador</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              admin@heyluz.com
            </div>
          </div>
        </button>

        <button
          onClick={() => handleQuickLogin('editor@heyluz.com', 'editor123')}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}
        >
          <i className="fas fa-user-edit" style={{ color: 'var(--warning)' }}></i>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Editor</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              editor@heyluz.com
            </div>
          </div>
        </button>

        <button
          onClick={() => handleQuickLogin('user@heyluz.com', 'user123')}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}
        >
          <i className="fas fa-user" style={{ color: 'var(--success)' }}></i>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Usuario</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              user@heyluz.com
            </div>
          </div>
        </button>
      </div>
      <p style={{ 
        fontSize: '0.7rem', 
        color: 'var(--text-light)', 
        marginTop: '1rem',
        fontStyle: 'italic'
      }}>
        ⚠️ Solo visible en entorno de desarrollo
      </p>
    </div>
  );
}
