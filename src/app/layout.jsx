import { Inter, Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";
import MobileMenuToggle from "../components/MobileMenuToggle";
import SearchButton from "../components/SearchButton";
import { CartProvider } from "../contexts/CartContext.jsx";
import CartButton from "../components/CartButton";
import CartDrawer from "../components/CartDrawer";

// Fuente principal moderna y legible
const inter = Inter({ 
  variable: "--font-body", 
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800']
});

// Fuente elegante para títulos
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata = {
  title: "HEYLUZ AROMAS - Perfumes de Lujo",
  description: "Descubre nuestra exclusiva colección de perfumes de lujo. HEYLUZ AROMAS, fragancias que despiertan emociones.",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  let role = null;
  try {
    const session = cookieStore.get('session');
    role = session ? JSON.parse(session.value).role : null;
  } catch {}

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </head>
  <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        <CartProvider>
          <header className="header">
            <nav className="navbar">
              <div className="nav-container">
                <div className="nav-logo">
                  <Link href="/"><h1>HEYLUZ AROMAS</h1></Link>
                  <div className="logo-subtitle">Luxury Fragrances</div>
                </div>
                <ul className="nav-menu" id="primary-navigation">
                  <li><Link className="nav-link" href="/#home">Inicio</Link></li>
                  <li><Link className="nav-link" href="/productos">Productos</Link></li>
                  <li><Link className="nav-link" href="/#sobre-nosotros">Nosotros</Link></li>
                  <li><Link className="nav-link" href="/#contacto">Contacto</Link></li>
                  {role ? (
                    <>
                      <li><Link className="nav-link" href="/user">Mi cuenta</Link></li>
                      {['admin','editor'].includes(role) && (
                        <li><Link className="nav-link" href="/admin">Admin</Link></li>
                      )}
                    </>
                  ) : null}
                </ul>
                <div className="nav-icons">
                  <SearchButton />
                  <CartButton />
                  <ThemeToggle />
                  {!role ? (
                    <Link className="nav-link" href="/login">Ingresar</Link>
                  ) : (
                    <form action="/api/auth/logout" method="post">
                      <button className="nav-link" style={{background:'transparent', border:0, cursor:'pointer'}}>Salir</button>
                    </form>
                  )}
                  <MobileMenuToggle />
                </div>
              </div>
            </nav>
          </header>
          <main className="page-top">
            {children}
          </main>
          <footer className="footer">
            <div className="container footer-content">
              <div className="footer-section">
                <h3>HEYLUZ AROMAS</h3>
                <p>Fragancias de lujo que despiertan emociones y crean memorias inolvidables.</p>
                <div className="social-links">
                  <a href="#" aria-label="Facebook"><i className="fab fa-facebook" /></a>
                  <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
                  <a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a>
                </div>
              </div>
              <div className="footer-section">
                <h4>Enlaces Rápidos</h4>
                <ul>
                  <li><Link href="/#home">Inicio</Link></li>
                  <li><Link href="/productos">Productos</Link></li>
                  <li><Link href="/#sobre-nosotros">Nosotros</Link></li>
                  <li><Link href="/#contacto">Contacto</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Categorías</h4>
                <ul>
                  <li><Link href="/productos?category=mujer">Perfumes para Mujer</Link></li>
                  <li><Link href="/productos?category=hombre">Perfumes para Hombre</Link></li>
                  <li><Link href="/productos?category=unisex">Fragancias Unisex</Link></li>
                  <li><Link href="/productos?category=nuevo">Nuevos Lanzamientos</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Información</h4>
                <ul id="cmsLinks" />
              </div>
            </div>
            <div className="container footer-bottom">
              <p>© {new Date().getFullYear()} HEYLUZ AROMAS. Todos los derechos reservados.</p>
              <div className="payment-methods">
                <i className="fab fa-cc-visa" title="Visa" />
                <i className="fab fa-cc-mastercard" title="Mastercard" />
                <i className="fab fa-cc-paypal" title="PayPal" />
                <i className="fab fa-cc-apple-pay" title="Apple Pay" />
              </div>
            </div>
          </footer>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
