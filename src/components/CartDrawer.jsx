"use client";
import { useCart } from '../contexts/CartContext.jsx';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getTotalItems,
    getSubtotal 
  } = useCart();
  
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Si no está autenticado, redirigir al login con redirect a checkout
      closeCart();
      router.push('/login?redirect=/checkout');
    } else {
      // Si está autenticado, ir directamente al checkout
      closeCart();
      router.push('/checkout');
    }
  };

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={closeCart} />
      
      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-header">
          <h2>
            <i className="fas fa-shopping-bag" /> 
            Carrito de Compras
            {getTotalItems() > 0 && (
              <span className="cart-header-count">({getTotalItems()})</span>
            )}
          </h2>
          <button 
            className="cart-close" 
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <i className="fas fa-shopping-bag cart-empty-icon" />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos para comenzar tu compra</p>
              <button className="btn btn-primary" onClick={closeCart}>
                Explorar Productos
              </button>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <OptimizedImage
                        src={item.img}
                        alt={item.nombre}
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.nombre}</h4>
                      <p className="cart-item-category">{item.categoria}</p>
                      <p className="cart-item-price">${item.precio.toFixed(2)}</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="cart-item-quantity">
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <i className="fas fa-minus" />
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Eliminar producto"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón vaciar carrito */}
              {cart.length > 0 && (
                <button 
                  className="btn-clear-cart"
                  onClick={() => {
                    if (confirm('¿Estás seguro de vaciar el carrito?')) {
                      clearCart();
                    }
                  }}
                >
                  <i className="fas fa-trash-alt" /> Vaciar carrito
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer con totales */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Envío:</span>
                <span>{shipping === 0 ? 'GRATIS' : `$${shipping.toFixed(2)}`}</span>
              </div>
              {subtotal < 50 && (
                <p className="cart-shipping-note">
                  <i className="fas fa-info-circle" /> 
                  Envío gratis en compras mayores a $50
                </p>
              )}
              <div className="cart-total-row cart-total-final">
                <span>Total:</span>
                <span className="cart-total-amount">${total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-checkout"
              onClick={handleCheckout}
            >
              <i className="fas fa-lock" /> {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
            </button>
            <button className="btn btn-outline" onClick={closeCart}>
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
