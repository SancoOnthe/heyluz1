import OptimizedImage from '../components/OptimizedImage';
import AddToCartButton from '../components/AddToCartButton';
import Link from 'next/link';
import { dbClient as supabase } from '@/lib/dbClient';
import NewsletterForm from '@/components/NewsletterForm';
import ContactForm from '@/components/ContactForm';

// Placeholder base64 (1x1 gif transparente) para efecto blur
const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export default async function Home() {
  // Obtener productos destacados desde Supabase
  let productos = [];
  let CATEGORIES = [];
  try {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(6);
    productos = Array.isArray(data) ? data.slice(0, 3) : [];
    // construir categorías simples a partir de los productos
    const cats = new Set();
    (data || []).forEach(p => { if (p.categoria) cats.add(p.categoria); if (p.tags && Array.isArray(p.tags)) p.tags.forEach(t => cats.add(t)); });
    CATEGORIES = [{ key: 'todos', label: 'Todos' }, ...Array.from(cats).map(c => ({ key: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))];
  } catch (e) {
    console.error('Error fetching products from Supabase:', e && e.message);
    productos = [];
    CATEGORIES = [{ key: 'todos', label: 'Todos' }];
  }

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h2 className="hero-title">Descubre tu Fragancia Perfecta</h2>
          <p className="hero-subtitle">Cada aroma cuenta una historia única. Encuentra la tuya en nuestra colección exclusiva de perfumes de lujo.</p>
          <div className="hero-buttons">
            <Link href="/productos?category=nuevo" className="btn btn-primary">Explorar Colección</Link>
            <a href="#sobre-nosotros" className="btn btn-outline">Conoce Más</a>
          </div>
        </div>
        <div className="hero-image">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1515651673363-a866d96d7809?q=80&w=1600&auto=format&fit=crop"
            alt="Perfume de lujo HEYLUZ AROMAS"
            width={1200}
            height={800}
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Banners Promocionales con Overlay */}
      <section className="promo-banners">
        <div className="container">
          <div id="promoBanners" className="promo-banners-wrap">
            <Link href="/productos?category=nuevo" className="promo-banner-item">
              <OptimizedImage src="https://images.unsplash.com/photo-1520975776630-b1c7d77f4f0b?q=80&w=1200&auto=format&fit=crop" alt="Nuevos Lanzamientos" width={1200} height={600} placeholder="blur" blurDataURL={BLUR_DATA_URL} />
              <div className="promo-banner-overlay">
                <h3 className="promo-banner-title">Nuevos Lanzamientos</h3>
                <p className="promo-banner-text">Descubre las últimas fragancias</p>
                <span className="promo-banner-cta">Explorar →</span>
              </div>
            </Link>
            <Link href="/productos?category=mujer" className="promo-banner-item">
              <OptimizedImage src="https://images.unsplash.com/photo-1530639832028-7b1c6d1d27b9?q=80&w=1200&auto=format&fit=crop" alt="Para Mujer" width={1200} height={600} placeholder="blur" blurDataURL={BLUR_DATA_URL} />
              <div className="promo-banner-overlay">
                <h3 className="promo-banner-title">Colección Mujer</h3>
                <p className="promo-banner-text">Elegancia y sofisticación</p>
                <span className="promo-banner-cta">Ver Más →</span>
              </div>
            </Link>
            <Link href="/productos?category=hombre" className="promo-banner-item">
              <OptimizedImage src="https://images.unsplash.com/photo-1511215993065-45d7c56ad05b?q=80&w=1200&auto=format&fit=crop" alt="Para Hombre" width={1200} height={600} placeholder="blur" blurDataURL={BLUR_DATA_URL} />
              <div className="promo-banner-overlay">
                <h3 className="promo-banner-title">Colección Hombre</h3>
                <p className="promo-banner-text">Carácter y distinción</p>
                <span className="promo-banner-cta">Descubrir →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Banner CTA de Urgencia */}
      <section className="urgency-banner">
        <div className="container">
          <div className="urgency-banner-content">
            <div className="urgency-icon">
              <i className="fas fa-shipping-fast" />
            </div>
            <div className="urgency-text">
              <h3>Envío Gratis en Pedidos +$50</h3>
              <p>Oferta por tiempo limitado · Válido solo esta semana</p>
            </div>
            <Link href="/productos" className="btn btn-primary">
              Comprar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Información de Confianza */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fas fa-shield-alt" />
              </div>
              <div className="trust-content">
                <h4>Pago 100% Seguro</h4>
                <p>Encriptación SSL</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fas fa-undo-alt" />
              </div>
              <div className="trust-content">
                <h4>Devoluciones Fáciles</h4>
                <p>30 días de garantía</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fas fa-truck" />
              </div>
              <div className="trust-content">
                <h4>Envío Rápido</h4>
                <p>2-5 días hábiles</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fas fa-users" />
              </div>
              <div className="trust-content">
                <h4>+10,000 Clientes</h4>
                <p>Satisfechos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Búsqueda y Filtros */}
      <section className="search-section">
        <div className="container">
          <form className="search-bar" action="/productos" method="get">
            <input type="text" name="search" placeholder="Buscar perfumes..." className="search-input" />
            <button type="submit" className="search-button" aria-label="Buscar perfumes">
              <i className="fas fa-search" />
            </button>
          </form>
          <div className="filters">
            {CATEGORIES.map(c => (
              <Link key={c.key} href={`/productos${c.key==='todos'?'':`?category=${c.key}`}`} className={`filter-btn${c.key==='todos'?' active':''}`}>{c.label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section id="productos" className="productos">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nuestra Colección
              <span className="section-badge" title="Selección curada">
                <i className="fas fa-star" /> Destacados
              </span>
            </h2>
            <p className="section-subtitle section-note">Mostrando productos Nuevos y Populares. Explora el catálogo completo en la sección Productos.</p>
          </div>
          <div className="productos-grid">
            {productos.map((p) => (
              <article key={p.id} className="producto-card">
                <div className="producto-image">
                  <OptimizedImage
                    src={p.img}
                    alt={p.nombre}
                    fill
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={p.id === 1}
                  />
                  <span className="producto-badge">Nuevo</span>
                </div>
                <div className="producto-info">
                  <div className="producto-category">{p.categoria}</div>
                  <h3 className="producto-name">{p.nombre}</h3>
                  <p className="producto-description">Fragancia exclusiva de larga duración.</p>
                  <div className="producto-price">
                    <span className="price-current">${p.precio.toFixed(2)}</span>
                  </div>
                  <div className="producto-actions">
                    <AddToCartButton product={p} />
                    <Link className="btn btn-outline" href={`/productos/${p.id}`}>Ver detalles</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Lo Que Dicen Nuestros Clientes</h2>
            <p className="section-subtitle">Experiencias reales de quienes confían en nosotros</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
              </div>
              <p className="testimonial-text">&quot;La mejor experiencia comprando perfumes online. La fragancia llegó perfecta y el aroma es exactamente como lo esperaba. ¡Totalmente recomendado!&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <i className="fas fa-user-circle" />
                </div>
                <div className="testimonial-info">
                  <h4>María González</h4>
                  <p>Cliente verificada</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
              </div>
              <p className="testimonial-text">&quot;Excelente calidad y servicio. El perfume es auténtico y la entrega fue muy rápida. Sin duda volveré a comprar aquí.&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <i className="fas fa-user-circle" />
                </div>
                <div className="testimonial-info">
                  <h4>Carlos Ramírez</h4>
                  <p>Cliente verificado</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
                <i className="fas fa-star" />
              </div>
              <p className="testimonial-text">&quot;Me encanta la variedad de fragancias que ofrecen. El packaging es hermoso y el aroma perdura todo el día. ¡5 estrellas!&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <i className="fas fa-user-circle" />
                </div>
                <div className="testimonial-info">
                  <h4>Ana Martínez</h4>
                  <p>Cliente verificada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marcas/Proveedores */}
      <section className="brands-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trabajamos con las Mejores Casas Perfumeras</h2>
            <p className="section-subtitle">Calidad garantizada por líderes en la industria</p>
          </div>
          <div className="brands-grid">
            <div className="brand-item">
              <div className="brand-logo">
                <i className="fas fa-certificate" />
              </div>
              <p>Certificado ISO</p>
            </div>
            <div className="brand-item">
              <div className="brand-logo">
                <i className="fas fa-award" />
              </div>
              <p>Premio Excelencia</p>
            </div>
            <div className="brand-item">
              <div className="brand-logo">
                <i className="fas fa-star" />
              </div>
              <p>100% Original</p>
            </div>
            <div className="brand-item">
              <div className="brand-logo">
                <i className="fas fa-leaf" />
              </div>
              <p>Cruelty Free</p>
            </div>
            <div className="brand-item">
              <div className="brand-logo">
                <i className="fas fa-check-circle" />
              </div>
              <p>Calidad Premium</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h2 className="section-title">Suscríbete y Obtén 15% de Descuento</h2>
              <p className="section-subtitle">Recibe ofertas exclusivas, nuevos lanzamientos y consejos de fragancias directamente en tu correo</p>
              <ul className="newsletter-benefits">
                <li><i className="fas fa-check" /> Acceso anticipado a nuevas colecciones</li>
                <li><i className="fas fa-check" /> Descuentos exclusivos para suscriptores</li>
                <li><i className="fas fa-check" /> Guías de fragancias personalizadas</li>
              </ul>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section id="sobre-nosotros" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">Sobre HEYLUZ AROMAS</h2>
              <p>En HEYLUZ AROMAS, creemos que cada fragancia es una expresión única de personalidad. Desde 2020, nos hemos dedicado a curar una colección excepcional de perfumes de lujo que despiertan emociones y crean memorias inolvidables.</p>
              <p>Nuestra pasión por la perfumería nos lleva a seleccionar cuidadosamente cada fragancia, trabajando con las mejores casas perfumeras del mundo para ofrecerte experiencias olfativas extraordinarias.</p>
              <div className="about-features">
                <div className="feature">
                  <i className="fas fa-crown" />
                  <h3>Calidad Premium</h3>
                  <p>Solo los mejores perfumes de lujo</p>
                </div>
                <div className="feature">
                  <i className="fas fa-shipping-fast" />
                  <h3>Envío Rápido</h3>
                  <p>Entrega segura y rápida</p>
                </div>
                <div className="feature">
                  <i className="fas fa-heart" />
                  <h3>Satisfacción</h3>
                  <p>Garantía de satisfacción 100%</p>
                </div>
              </div>
            </div>
            <div className="about-image">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1585386959984-a41552231698?q=80&w=1200&auto=format&fit=crop"
                alt="Sobre HEYLUZ AROMAS"
                width={1200}
                height={800}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="contact">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Contáctanos</h2>
            <p className="section-subtitle">
¿Tienes preguntas? Estamos aquí para ayudarte</p>
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-map-marker-alt" />
                <div>
                  <h3>Dirección</h3>
                  <p>Av. Principal 123<br />Ciudad, País</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone" />
                <div>
                  <h3>Teléfono</h3>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope" />
                <div>
                  <h3>Email</h3>
                  <p>info@heyluzaromas.com</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-clock" />
                <div>
                  <h3>Horarios</h3>
                  <p>Lun - Vie: 9:00 - 18:00<br />Sáb: 10:00 - 16:00</p>
                </div>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
