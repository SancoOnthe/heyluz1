'use client';

import { useState, useEffect } from 'react';
import { 
  getProducts, 
  saveProducts, 
  formatPrice,
  generateId,
  exportToCSV
} from '@/utils/adminUtils';

export default function AdminProductos() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Formulario de producto
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: 'mujer',
    price: '',
    originalPrice: '',
    badge: '',
    stock: '',
    lowStock: 5,
    description: '',
    ingredients: '',
    published: true,
    variants: [],
    // Nuevos campos
    brand: '',
    origin: '',
    type: '',
    family: ''
  });

  // Variante temporal
  const [variantForm, setVariantForm] = useState({
    size: '',
    color: '',
    volume: '',
    price: '',
    stock: ''
  });

  // Acciones masivas
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      (async () => {
        const server = await fetchProductsFromServer();
        if (server && server.length > 0) {
          setProducts(server);
          setFilteredProducts(server);
          saveProducts(server);
        } else {
          loadProducts();
        }
      })();
    }
  }, [isMounted]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, categoryFilter, publishedFilter, lowStockOnly, brandFilter, originFilter, typeFilter]);

  const loadProducts = () => {
    const loaded = getProducts();
    setProducts(loaded);
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Búsqueda por nombre
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filtro por estado de publicación
    if (publishedFilter) {
      const isPublished = publishedFilter === 'true';
      filtered = filtered.filter(p => p.published === isPublished);
    }

    // Solo productos con stock bajo
    if (lowStockOnly) {
      filtered = filtered.filter(p => 
        (p.stock || 0) <= (p.lowStock || 5)
      );
    }

    // Filtro por marca
    if (brandFilter) {
      filtered = filtered.filter(p => p.brand === brandFilter);
    }

    // Filtro por origen
    if (originFilter) {
      filtered = filtered.filter(p => p.origin === originFilter);
    }

    // Filtro por tipo
    if (typeFilter) {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      image: '',
      category: 'mujer',
      price: '',
      originalPrice: '',
      badge: '',
      stock: '',
      lowStock: 5,
      description: '',
      ingredients: '',
      published: true,
      variants: []
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      image: product.image || '',
      category: product.category || 'mujer',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      badge: product.badge || '',
      stock: product.stock || '',
      lowStock: product.lowStock || 5,
      description: product.description || '',
      ingredients: product.ingredients || '',
      published: product.published !== false,
      variants: product.variants || []
    });
    setShowModal(true);
  };

  const handleDelete = (productId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
    alert('✅ Producto eliminado');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description) {
      alert('⚠️ Por favor completa todos los campos requeridos');
      return;
    }

    const productData = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      stock: Number(formData.stock || 0),
      lowStock: Number(formData.lowStock || 5)
    };

    let updated;
    if (editingProduct) {
      // Actualizar existente
      updated = products.map(p => 
        p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
      );
      alert('✅ Producto actualizado');
    } else {
      // Crear nuevo
      const newProduct = {
        ...productData,
        id: generateId('prod-')
      };
      updated = [...products, newProduct];
      alert('✅ Producto creado');
    }

    setProducts(updated);
    saveProducts(updated);
    setShowModal(false);
  };

  const handleAddVariant = () => {
    if (!variantForm.size && !variantForm.color && !variantForm.volume) {
      alert('⚠️ Completa al menos un atributo de la variante');
      return;
    }

    const newVariant = {
      ...variantForm,
      price: Number(variantForm.price || 0),
      stock: Number(variantForm.stock || 0)
    };

    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    });

    // Reset variant form
    setVariantForm({
      size: '',
      color: '',
      volume: '',
      price: '',
      stock: ''
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = () => {
    if (selectedProducts.length === 0) {
      alert('⚠️ Selecciona al menos un producto');
      return;
    }

    if (!bulkAction) {
      alert('⚠️ Selecciona una acción');
      return;
    }

    let updated = [...products];

    switch (bulkAction) {
      case 'publish':
        const publishValue = bulkValue === 'true';
        updated = updated.map(p =>
          selectedProducts.includes(p.id) ? { ...p, published: publishValue } : p
        );
        alert(`✅ ${selectedProducts.length} productos ${publishValue ? 'publicados' : 'despublicados'}`);
        break;

      case 'pricePercent':
        const percent = Number(bulkValue || 0);
        if (percent === 0) {
          alert('⚠️ Ingresa un porcentaje');
          return;
        }
        updated = updated.map(p =>
          selectedProducts.includes(p.id)
            ? { ...p, price: Math.round(p.price * (1 + percent / 100)) }
            : p
        );
        alert(`✅ Precios ajustados ${percent > 0 ? '+' : ''}${percent}%`);
        break;

      case 'stockSet':
        const stockValue = Number(bulkValue || 0);
        updated = updated.map(p =>
          selectedProducts.includes(p.id) ? { ...p, stock: stockValue } : p
        );
        alert(`✅ Stock actualizado a ${stockValue}`);
        break;

      case 'delete':
        if (!confirm(`¿Eliminar ${selectedProducts.length} productos seleccionados?`)) {
          return;
        }
        updated = updated.filter(p => !selectedProducts.includes(p.id));
        alert(`✅ ${selectedProducts.length} productos eliminados`);
        setSelectedProducts([]);
        break;

      default:
        return;
    }

    setProducts(updated);
    saveProducts(updated);
    setBulkAction('');
    setBulkValue('');
  };

  const handleExportCSV = () => {
    const data = filteredProducts.map(p => [
      p.id,
      p.name,
      p.category,
      p.price,
      p.stock,
      p.published ? 'Sí' : 'No'
    ]);

    exportToCSV(
      data,
      ['ID', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Publicado'],
      'productos.csv'
    );
  };

  if (!isMounted) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Productos</h1>
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
          <h1>Productos</h1>
          <div className="actions inline">
            <button className="btn btn-primary" onClick={handleCreate}>
              <i className="fas fa-plus"></i> Nuevo producto
            </button>
            <button className="btn btn-outline" onClick={handleExportCSV}>
              <i className="fas fa-file-csv"></i> Exportar CSV
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Listado de productos</h3>
            <span className="pill pill-primary">{filteredProducts.length} productos</span>
          </div>

          {/* Filtros */}
          <div className="inline mb-12 filters" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              title="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="unisex">Unisex</option>
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              title="Filtrar por marca"
            >
              <option value="">Todas las marcas</option>
              {[...new Set(products.map(p => p.brand).filter(Boolean))].sort().map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              title="Filtrar por origen"
            >
              <option value="">Todos los orígenes</option>
              <option value="arabe">Árabe</option>
              <option value="occidental">Occidental</option>
              <option value="nicho">Nicho</option>
              <option value="otro">Otro</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              title="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="edp">EDP (Eau de Parfum)</option>
              <option value="edt">EDT (Eau de Toilette)</option>
              <option value="edc">EDC (Eau de Cologne)</option>
              <option value="perfume">Perfume/Extrait</option>
              <option value="otro">Otro</option>
            </select>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              title="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="true">Publicados</option>
              <option value="false">No publicados</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span className="muted">Solo stock bajo</span>
            </label>
          </div>

          {/* Acciones masivas */}
          {selectedProducts.length > 0 && (
            <div className="inline mb-12" style={{ background: 'var(--gray-light)', padding: '1rem', borderRadius: '8px' }}>
              <span className="muted">{selectedProducts.length} seleccionados</span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                title="Acción masiva"
                className="ml-md"
              >
                <option value="">Elegir acción...</option>
                <option value="publish">Cambiar publicación</option>
                <option value="pricePercent">Ajustar precio (%)</option>
                <option value="stockSet">Establecer stock</option>
                <option value="delete">Eliminar seleccionados</option>
              </select>

              {bulkAction === 'publish' && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="ml-md"
                >
                  <option value="true">Publicar</option>
                  <option value="false">Despublicar</option>
                </select>
              )}

              {bulkAction === 'pricePercent' && (
                <input
                  type="number"
                  placeholder="% (+/-)"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="ml-md"
                  style={{ width: '120px' }}
                />
              )}

              {bulkAction === 'stockSet' && (
                <input
                  type="number"
                  placeholder="Stock"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="ml-md"
                  style={{ width: '120px' }}
                />
              )}

              <button
                className="btn btn-primary ml-md"
                onClick={handleBulkAction}
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Tabla de productos */}
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th style={{ width: '80px' }}>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th style={{ width: '150px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      {products.length === 0 
                        ? 'No hay productos. Crea uno nuevo o carga datos demo desde el dashboard.'
                        : 'No se encontraron productos con los filtros aplicados.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          aria-label={`Seleccionar ${product.name}`}
                        />
                      </td>
                      <td>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '60px',
                              height: '60px',
                              background: 'var(--gray-light)',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="fas fa-image" style={{ color: 'var(--text-secondary)' }}></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        {product.badge && (
                          <span className="pill pill-primary ml-sm">{product.badge}</span>
                        )}
                        {product.variants?.length > 0 && (
                          <span className="muted ml-sm">({product.variants.length} variantes)</span>
                        )}
                      </td>
                      <td>
                        <span className="pill">{product.category}</span>
                      </td>
                      <td>
                        <strong>{formatPrice(product.price)}</strong>
                        {product.originalPrice && (
                          <div className="muted" style={{ fontSize: '0.85rem', textDecoration: 'line-through' }}>
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={product.stock <= (product.lowStock || 5) ? 'pill danger' : ''}>
                          {product.stock || 0}
                        </span>
                        {product.stock <= (product.lowStock || 5) && (
                          <div className="muted" style={{ fontSize: '0.8rem' }}>
                            <i className="fas fa-exclamation-triangle"></i> Bajo
                          </div>
                        )}
                      </td>
                      <td>
                        {product.published ? (
                          <span className="pill ok">Publicado</span>
                        ) : (
                          <span className="pill off">Borrador</span>
                        )}
                      </td>
                      <td>
                        <div className="actions inline" style={{ gap: '0.25rem' }}>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleEdit(product)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => handleDelete(product.id)}
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

      {/* Modal de producto */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>URL de imagen</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{ marginTop: '0.5rem', maxWidth: '200px', borderRadius: '8px' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="mujer">Mujer</option>
                    <option value="hombre">Hombre</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Precio *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="89990"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio original</label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="119990"
                      step="0.01"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="25"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock bajo</label>
                    <input
                      type="number"
                      value={formData.lowStock}
                      onChange={(e) => setFormData({ ...formData, lowStock: e.target.value })}
                      placeholder="5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Badge</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Nuevo, Oferta..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del producto"
                    rows="3"
                    required
                  />
                </div>

                <h3 className="mt-24 mb-16">Clasificación y Características</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Chanel, Dior, Lattafa..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Familia olfativa</label>
                    <input
                      type="text"
                      value={formData.family}
                      onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                      placeholder="Oriental, Floral, Amaderado..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Origen</label>
                    <select
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    >
                      <option value="">Sin especificar</option>
                      <option value="arabe">Árabe</option>
                      <option value="occidental">Occidental</option>
                      <option value="nicho">Nicho</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo de concentración</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="">Sin especificar</option>
                      <option value="edp">EDP (Eau de Parfum)</option>
                      <option value="edt">EDT (Eau de Toilette)</option>
                      <option value="edc">EDC (Eau de Cologne)</option>
                      <option value="perfume">Perfume/Extrait</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ingredientes principales</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Rosa, Jazmín, Vainilla"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    />
                    <span>Publicado</span>
                  </label>
                </div>

                {/* Variantes */}
                <hr style={{ margin: '1.5rem 0' }} />
                <h3 style={{ marginBottom: '1rem' }}>Variantes (opcional)</h3>
                
                {formData.variants.length > 0 && (
                  <div className="overflow-auto mb-12">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Talla</th>
                          <th>Color</th>
                          <th>Volumen</th>
                          <th>Precio</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.variants.map((variant, idx) => (
                          <tr key={idx}>
                            <td>{variant.size || '—'}</td>
                            <td>{variant.color || '—'}</td>
                            <td>{variant.volume || '—'}</td>
                            <td>{formatPrice(variant.price)}</td>
                            <td>{variant.stock}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-outline btn-icon"
                                onClick={() => handleRemoveVariant(idx)}
                                title="Eliminar variante"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Talla"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Color"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Volumen"
                    value={variantForm.volume}
                    onChange={(e) => setVariantForm({ ...variantForm, volume: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variantForm.stock}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddVariant}
                >
                  <i className="fas fa-plus"></i> Añadir variante
                </button>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Actualizar' : 'Crear'} producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
