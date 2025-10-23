'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OptimizedImage from './OptimizedImage';
import AddToCartButton from './AddToCartButton';
import Link from 'next/link';

const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

const CATEGORIES = [
  { key: 'todos', label: 'Todos' },
  { key: 'mujer', label: 'Mujer' },
  { key: 'hombre', label: 'Hombre' },
  { key: 'unisex', label: 'Unisex' }
];

export default function ProductosClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [mounted, setMounted] = useState(false);

  const category = (searchParams.get('category') || 'todos').toLowerCase();
  const search = (searchParams.get('search') || '').toLowerCase();
  const sortBy = searchParams.get('sort') || 'destacado';
  const brandFilter = searchParams.get('brand') || '';
  const originFilter = searchParams.get('origin') || '';
  const typeFilter = searchParams.get('type') || '';

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const server = await fetch('/api/admin/products').then(r => r.ok ? r.json() : null);
        if (server && server.data && server.data.length > 0) {
          setProducts(server.data.filter(p => p.published !== false));
          try { localStorage.setItem('heyluz_products', JSON.stringify(server.data)); } catch (e) {}
          return;
        }
      } catch (e) {
        // ignore server errors and fallback to localStorage
      }

      try {
        const stored = localStorage.getItem('heyluz_products');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProducts(parsed.filter(p => p.published !== false));
        }
      } catch (e) {
        console.error('Error loading products:', e);
      }
    })();
  }, []);

  const applyFilters = () => {
    let filtered = [...products];

    // Filtrar por categoría
    if (category && category !== 'todos') {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filtrar por búsqueda
    if (search) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.brand?.toLowerCase().includes(search)
      );
    }

    // Filtrar por marca
    if (brandFilter) {
      filtered = filtered.filter(p => p.brand === brandFilter);
    }

    // Filtrar por origen
    if (originFilter) {
      filtered = filtered.filter(p => p.origin === originFilter);
    }

    // Filtrar por tipo
    if (typeFilter) {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    // Ordenar productos
    switch (sortBy) {
      case 'precio-asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'precio-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'nombre-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'nombre-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default:
        // Orden por ID descendente (más nuevos primero)
        filtered.sort((a, b) => b.id - a.id);
    }

    return filtered;
  };

  const filtered = applyFilters();
  const availableBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/productos?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/productos');
  };

  if (!mounted) {
    return (
      <div className="container page-top">
        <p className="muted">Cargando productos...</p>
      </div>
    );
  }

  const activeFiltersCount = [category !== 'todos', search, brandFilter, originFilter, typeFilter, sortBy !== 'destacado'].filter(Boolean).length;

  return (
    <>
      <section className="search-section page-top">
        <div className="container">
          <div className="section-header section-header-compact">
            <h1 className="section-title">Catálogo de Productos</h1>
            <p className="section-subtitle">Filtra por categoría, marca, origen o tipo</p>
          </div>

          {/* Barra de búsqueda */}
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); handleFilterChange('search', e.target.search.value); }}>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar perfumes, marcas..."
              className="search-input"
              aria-label="Buscar perfumes"
            />
            <button type="submit" className="search-button" aria-label="Buscar">
              <i className="fas fa-search" />
            </button>
          </form>

          {/* Filtros principales de categoría */}
          <div className="filters">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => handleFilterChange('category', c.key === 'todos' ? '' : c.key)}
                className={`filter-btn${c.key === category ? ' active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Filtros avanzados */}
          <div className="inline mb-12 filters" style={{ flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            <select value={brandFilter} onChange={(e) => handleFilterChange('brand', e.target.value)} title="Filtrar por marca">
              <option value="">Todas las marcas</option>
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select value={originFilter} onChange={(e) => handleFilterChange('origin', e.target.value)} title="Filtrar por origen">
              <option value="">Todos los orígenes</option>
              <option value="arabe">Árabe</option>
              <option value="occidental">Occidental</option>
              <option value="nicho">Nicho</option>
              <option value="otro">Otro</option>
            </select>

            <select value={typeFilter} onChange={(e) => handleFilterChange('type', e.target.value)} title="Filtrar por tipo">
              <option value="">Todos los tipos</option>
              <option value="edp">EDP (Eau de Parfum)</option>
              <option value="edt">EDT (Eau de Toilette)</option>
              <option value="edc">EDC (Eau de Cologne)</option>
              <option value="perfume">Perfume/Extrait</option>
              <option value="otro">Otro</option>
            </select>

            <select value={sortBy} onChange={(e) => handleFilterChange('sort', e.target.value)} title="Ordenar por">
              <option value="destacado">Destacados</option>
              <option value="precio-asc">Precio: Menor a mayor</option>
              <option value="precio-desc">Precio: Mayor a menor</option>
              <option value="nombre-asc">Nombre: A-Z</option>
              <option value="nombre-desc">Nombre: Z-A</option>
            </select>

            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="btn btn-outline btn-small">
                <i className="fas fa-times" /> Limpiar ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="toolbar-right" style={{ marginBottom: '1.5rem' }}>
            <span className="toolbar-count">
              <strong>{filtered.length}</strong> {filtered.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>
      </section>

      <section className="productos">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-search" />
              </div>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otros filtros o explora todas las categorías</p>
              <button onClick={clearFilters} className="btn btn-primary">
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="productos-grid">
              {filtered.map((p) => (
                <article key={p.id} className="producto-card">
                  <div className="producto-image">
                    <OptimizedImage
                      src={p.image || '/placeholder.jpg'}
                      alt={p.name}
                      fill
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {p.badge && <span className="producto-badge">{p.badge}</span>}
                    {p.origin === 'arabe' && <span className="producto-badge badge-popular" style={{ top: '3.5rem' }}>🌙 Árabe</span>}
                  </div>
                  <div className="producto-info">
                    <div className="producto-category">
                      {p.brand && <span style={{ fontWeight: 600 }}>{p.brand}</span>}
                      {p.brand && p.category && ' · '}
                      {p.category}
                    </div>
                    <h3 className="producto-name">{p.name}</h3>
                    <p className="producto-description">{p.description || 'Sin descripción'}</p>
                    {(p.family || p.type) && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        {p.family && <span>🌸 {p.family}</span>}
                        {p.family && p.type && ' · '}
                        {p.type && <span>{p.type.toUpperCase()}</span>}
                      </div>
                    )}
                    <div className="producto-price">
                      <span className="price-current">${(p.price || 0).toFixed(2)}</span>
                      {p.originalPrice && <span className="price-original">${p.originalPrice.toFixed(2)}</span>}
                    </div>
                    <div className="producto-actions">
                      <AddToCartButton product={{ ...p, nombre: p.name, precio: p.price, img: p.image, categoria: p.category }} className="btn btn-primary btn-add-cart" showIcon={true} />
                      <Link href={`/productos/${p.id}`} className="btn btn-outline" aria-label={`Ver detalles de ${p.name}`}>
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="trust-section-mini">
        <div className="container">
          <div className="trust-grid-mini">
            <div className="trust-item-mini">
              <i className="fas fa-shipping-fast" />
              <span>Envío Gratis +$50</span>
            </div>
            <div className="trust-item-mini">
              <i className="fas fa-shield-alt" />
              <span>Pago Seguro</span>
            </div>
            <div className="trust-item-mini">
              <i className="fas fa-undo-alt" />
              <span>Devolución 30 días</span>
            </div>
            <div className="trust-item-mini">
              <i className="fas fa-certificate" />
              <span>100% Original</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
