/**
 * Utilidades para notificaciones push del navegador
 */

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title, options = {}) {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    // Auto-cerrar después de 5 segundos
    if (options.autoClose !== false) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  }

  return null;
}

export function showNewMessageNotification(message) {
  return showNotification('Nuevo mensaje de contacto', {
    body: `De: ${message.nombre}\nAsunto: ${message.asunto}`,
    tag: `message-${message.id}`,
    requireInteraction: false,
    data: { messageId: message.id }
  });
}

export function getNotificationPermissionStatus() {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
