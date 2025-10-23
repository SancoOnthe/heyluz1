"use client";
import { useCart } from '../contexts/CartContext';

export default function AddToCartButton({ product, className = "btn btn-primary", showIcon = false }) {
  const { addToCart, openCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    openCart();
  };

  return (
    <button 
      className={className} 
      onClick={handleAddToCart}
      type="button"
      aria-label={`Agregar ${product.nombre} al carrito`}
    >
      {showIcon && <i className="fas fa-shopping-cart" />} 
      {showIcon ? ' Agregar' : 'Añadir al Carrito'}
    </button>
  );
}
