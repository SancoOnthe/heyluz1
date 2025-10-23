"use client";
import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutClient() {
  const { cart, getSubtotal } = useCart();
  const router = useRouter();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/productos');
      return;
    }
    if (!clientReady) return;

    // Manejar el envío del formulario REAL del checkout
    const form = document.getElementById('checkoutForm');
    let handler;
    if (form) {
      handler = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        // Aquí iría la lógica para procesar el pago
        alert('¡Pedido realizado con éxito! En producción, aquí se procesaría el pago.');
        router.push('/user');
      };
      form.addEventListener('submit', handler);
    }

    // Inyectar los datos del carrito y totales en el sidebar del checkout
    const itemsContainer = document.getElementById('checkoutCartItems');
    if (itemsContainer) {
      itemsContainer.innerHTML = cart.map(item => `
        <div class=\"order-item\" key=\"${item.id}\">
          <div class=\"order-item-image\">
            <img src=\"${item.img}\" alt=\"${item.nombre}\" />
          </div>
          <div class=\"order-item-details\">
            <h4>${item.nombre}</h4>
            <p class=\"order-item-quantity\">Cantidad: ${item.quantity}</p>
          </div>
          <div class=\"order-item-price\">
            $${(item.precio * item.quantity).toFixed(2)}
          </div>
        </div>
      `).join('');
    }
    // Totales
    const subtotal = getSubtotal();
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    const subtotalEl = document.getElementById('checkoutSubtotal');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    const shippingEl = document.getElementById('checkoutShipping');
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'GRATIS' : `$${shipping.toFixed(2)}`;
    const totalEl = document.getElementById('checkoutTotal');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    return () => {
      if (form && handler) form.removeEventListener('submit', handler);
    };
  }, [clientReady, cart, getSubtotal, router]);

  // No renderiza nada
  return null;
}
      