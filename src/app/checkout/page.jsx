import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import CheckoutClient from "../../components/CheckoutClient";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect('/login?redirect=/checkout');
  }

  let userData = null;
  try {
    userData = JSON.parse(session.value);
  } catch {
    redirect('/login?redirect=/checkout');
  }

  return (
    <section className="checkout-page page-top">
      <CheckoutClient />
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Finalizar Compra</h1>
          <p className="section-subtitle">Completa tu pedido de manera segura</p>
        </div>

        <div className="checkout-grid">
          {/* Formulario de envío */}
          <div className="checkout-main">
            <div className="checkout-section">
              <h2 className="checkout-section-title">
                <i className="fas fa-shipping-fast" /> Información de Envío
              </h2>
              <form className="checkout-form" id="checkoutForm">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      <i className="fas fa-user" /> Nombre *
                    </label>
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName" 
                      required 
                      placeholder="Juan"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">
                      <i className="fas fa-user" /> Apellido *
                    </label>
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName" 
                      required 
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <i className="fas fa-envelope" /> Email *
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <i className="fas fa-phone" /> Teléfono *
                  </label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    required 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <i className="fas fa-map-marker-alt" /> Dirección *
                  </label>
                  <input 
                    type="text" 
                    id="address" 
                    name="address" 
                    required 
                    placeholder="Calle Principal 123"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">
                      <i className="fas fa-city" /> Ciudad *
                    </label>
                    <input 
                      type="text" 
                      id="city" 
                      name="city" 
                      required 
                      placeholder="Ciudad"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">
                      <i className="fas fa-map" /> Estado/Provincia *
                    </label>
                    <input 
                      type="text" 
                      id="state" 
                      name="state" 
                      required 
                      placeholder="Estado"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">
                      <i className="fas fa-mail-bulk" /> Código Postal *
                    </label>
                    <input 
                      type="text" 
                      id="zipCode" 
                      name="zipCode" 
                      required 
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">
                    <i className="fas fa-comment-dots" /> Notas del pedido (opcional)
                  </label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    rows={3}
                    placeholder="Instrucciones especiales de entrega..."
                  />
                </div>
              </form>
            </div>

            <div className="checkout-section">
              <h2 className="checkout-section-title">
                <i className="fas fa-credit-card" /> Método de Pago
              </h2>
              <div className="payment-methods-checkout">
                <label className="payment-option">
                  <input type="radio" name="payment" value="card" defaultChecked />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <div className="payment-icon-wrapper">
                        <i className="fas fa-credit-card" />
                      </div>
                      <div className="payment-text">
                        <span className="payment-title">Tarjeta de Crédito/Débito</span>
                        <span className="payment-subtitle">Pago seguro con tarjeta</span>
                      </div>
                    </div>
                    <div className="payment-cards">
                      <i className="fab fa-cc-visa" title="Visa" />
                      <i className="fab fa-cc-mastercard" title="Mastercard" />
                      <i className="fab fa-cc-amex" title="American Express" />
                    </div>
                  </div>
                </label>

                <label className="payment-option">
                  <input type="radio" name="payment" value="paypal" />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <div className="payment-icon-wrapper paypal">
                        <i className="fab fa-paypal" />
                      </div>
                      <div className="payment-text">
                        <span className="payment-title">PayPal</span>
                        <span className="payment-subtitle">Pago rápido y seguro</span>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="payment-option">
                  <input type="radio" name="payment" value="cash" />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <div className="payment-icon-wrapper cash">
                        <i className="fas fa-money-bill-wave" />
                      </div>
                      <div className="payment-text">
                        <span className="payment-title">Pago contra entrega</span>
                        <span className="payment-subtitle">Paga cuando recibas tu pedido</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h2 className="order-summary-title">Resumen del Pedido</h2>
              
              <div id="checkoutCartItems" className="order-items">
                {/* Los items se cargarán dinámicamente desde el carrito */}
              </div>

              <div className="order-shipping-info">
                <div className="shipping-badge">
                  <i className="fas fa-truck" />
                  <span>Envío Gratis +$50</span>
                </div>
              </div>

              <div className="order-totals">
                <div className="order-total-row">
                  <span>Subtotal:</span>
                  <span id="checkoutSubtotal">$0.00</span>
                </div>
                <div className="order-total-row">
                  <span>Envío:</span>
                  <span id="checkoutShipping">$0.00</span>
                </div>
              </div>

              <div className="order-features">
                <div className="order-feature-item">
                  <i className="fas fa-undo-alt" />
                  <span>Devolución 30 días</span>
                </div>
                <div className="order-feature-item">
                  <i className="fas fa-certificate" />
                  <span>100% Original</span>
                </div>
              </div>

              <div className="order-total-row order-total-final">
                <span>Total:</span>
                <span id="checkoutTotal">$0.00</span>
              </div>

              <button 
                type="submit" 
                form="checkoutForm"
                className="btn btn-primary btn-checkout-submit"
              >
                <i className="fas fa-lock" /> Completar Pedido
              </button>

              <div className="checkout-security">
                <i className="fas fa-shield-alt" />
                <span>Pago 100% seguro y encriptado</span>
              </div>

              <Link href="/productos" className="btn btn-outline btn-block">
                <i className="fas fa-arrow-left" /> Seguir Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
