'use client';

import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegación admin">
        <ul className="admin-nav">
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}
              href="/admin"
              title="Dashboard"
            >
              <i className="fas fa-gauge"></i> Dashboard
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/productos') ? 'active' : ''}`}
              href="/admin/productos"
              title="Productos"
            >
              <i className="fas fa-box"></i> Productos
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/ventas') ? 'active' : ''}`}
              href="/admin/ventas"
              title="Ventas"
            >
              <i className="fas fa-receipt"></i> Ventas
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/reportes') ? 'active' : ''}`}
              href="/admin/reportes"
              title="Reportes"
            >
              <i className="fas fa-chart-line"></i> Reportes
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/marketing') ? 'active' : ''}`}
              href="/admin/marketing"
              title="Marketing"
            >
              <i className="fas fa-bullhorn"></i> Marketing
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/mensajes') ? 'active' : ''}`}
              href="/admin/mensajes"
              title="Mensajes"
            >
              <i className="fas fa-inbox"></i> Mensajes
            </a>
          </li>
          <li>
            <a 
              className={`admin-nav-link ${isActive('/admin/config') ? 'active' : ''}`}
              href="/admin/config"
              title="Configuración"
            >
              <i className="fas fa-gear"></i> Configuración
            </a>
          </li>
        </ul>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
