"use client";
import { useCart } from '../contexts/CartContext';

export default function CartButton() {
  const { getTotalItems, toggleCart } = useCart();
  const count = getTotalItems();

  return (
    <button 
      className="cart-btn" 
      aria-label="Carrito de compras"
      onClick={toggleCart}
    >
      <i className="fas fa-shopping-bag" />
      {count > 0 && <span className="cart-count">{count}</span>}
    </button>
  );
}
