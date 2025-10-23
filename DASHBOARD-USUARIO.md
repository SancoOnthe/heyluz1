# 📊 Dashboard de Usuario - HEYLUZ AROMAS

## Descripción

Panel de control completo para usuarios registrados donde pueden gestionar sus pedidos, ver cupones disponibles y actualizar su perfil.

## 🎯 Funcionalidades Implementadas

### ✅ **Resumen de Cuenta (Dashboard)**
- **Estadísticas en tiempo real:**
  - Total de pedidos realizados
  - Monto total gastado
  - Fecha del último pedido
  - Cupones activos disponibles
- **Cupones destacados:** Lista de los 5 cupones más relevantes
- **Diseño responsive:** Cards adaptables con hover effects

### ✅ **Mis Compras**
- **Tabla completa de pedidos** con:
  - ID de pedido
  - Fecha y hora
  - Estado (pendiente, pagado, enviado, cancelado)
  - Lista de items comprados
  - Total del pedido
- **Filtro "Solo mis pedidos":** Ver solo tus propios pedidos
- **Acciones por pedido:**
  - 👁️ **Ver detalles:** Modal con información completa
  - 🔄 **Repetir compra:** Reagregar items al carrito
- **Estados visuales:** Pills de colores según estado
- **Responsive:** Table scroll horizontal en móvil

### ✅ **Cupones y Promociones**
- **Tabla de cupones** mostrando:
  - Código del cupón
  - Tipo (porcentaje o monto fijo)
  - Valor del descuento
  - Alcance (todos, categoría, productos)
  - Fecha de vigencia
- **Botón "Usar cupón":** Aplica automáticamente al carrito
- **Estados:**
  - Activos: Botón de uso disponible
  - Vencidos/inactivos: Marcados como no disponibles
- **Integración con carrito:** Redirige a productos con cupón aplicado

### ✅ **Perfil de Usuario**
- **Campos editables:**
  - Nombre completo
  - Email
  - Dirección de envío
- **Persistencia:** Guardado en localStorage
- **Pre-llenado:** Datos del usuario desde sesión
- **Validación:** Feedback visual al guardar

### ✅ **Modal de Detalle de Pedido**
- Información completa del pedido
- ID de factura
- Lista detallada de productos con precios
- Botón de impresión/PDF
- Animación de entrada suave
- Cierre con botón X o clic fuera

## 🎨 Características de Diseño

### **Navegación por Pestañas**
- Sidebar lateral con iconos FontAwesome
- Active state visual
- Sticky en desktop
- Collapse en mobile

### **Temas**
- ✅ **Modo Claro:** Por defecto
- ✅ **Modo Oscuro:** Toggle disponible
- Persistencia de preferencia
- Sincronización con preferencias del sistema

### **Responsive Design**
- **Desktop (>900px):** Sidebar lateral fijo
- **Tablet (768-900px):** Sidebar colapsable
- **Mobile (<768px):** 
  - Sidebar arriba
  - Stats grid 2 columnas
  - Tables con scroll horizontal
  - Botones apilados

### **Elementos Visuales**
- **Pills/Badges:** Estados de pedidos con colores
- **Stats Cards:** Con hover effect y animaciones
- **Tables:** Striped rows con hover
- **Modal:** Backdrop blur y animación slide
- **Icons:** FontAwesome integrado

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── user/
│       ├── page.js           # Server component con auth
│       └── login/
│           └── page.js        # Login de usuario
├── components/
│   └── UserDashboard.jsx      # Cliente component principal
└── app/
    └── globals.css            # Estilos del dashboard
```

## 🔐 Autenticación y Seguridad

### **Protección de Rutas**
- Server-side cookie validation
- Redirect a `/login` si no autenticado
- Verificación de roles permitidos
- Query param `redirect` para retorno

### **Roles Permitidos**
- `admin` - Acceso completo + enlace al panel admin
- `editor` - Acceso completo + enlace al panel admin
- `viewer` - Acceso completo

### **Datos Persistentes**
- **localStorage:**
  - `heyluz_orders` - Pedidos
  - `heyluz_profile` - Perfil de usuario
  - `heyluz_settings` - Configuración (cupones, moneda)
  - `heyluz_coupon` - Cupón aplicado
  - `heyluz_reorder` - Items para reordenar
  - `heyluz_open_cart` - Flag para abrir carrito

## 💾 Gestión de Datos

### **Lectura de Datos**
```javascript
// Cargar pedidos
const orders = JSON.parse(localStorage.getItem('heyluz_orders')) || [];

// Cargar cupones
const settings = JSON.parse(localStorage.getItem('heyluz_settings')) || {};
const coupons = settings.coupons || [];

// Cargar perfil
const profile = JSON.parse(localStorage.getItem('heyluz_profile')) || {};
```

### **Escritura de Datos**
```javascript
// Guardar perfil
localStorage.setItem('heyluz_profile', JSON.stringify(profile));

// Aplicar cupón
localStorage.setItem('heyluz_coupon', JSON.stringify({ code }));

// Reordenar pedido
localStorage.setItem('heyluz_reorder', JSON.stringify({ at: Date.now(), items }));
```

### **Sincronización**
- Actualización automática con `useEffect`
- Recarga de datos al cambiar tabs
- Storage events para multi-tab sync (preparado)

## 🎯 Funciones Principales

### **calculateStats()**
Calcula estadísticas del dashboard:
- Total de pedidos (filtrados)
- Monto total gastado
- Fecha último pedido
- Cupones activos

### **getFilteredOrders()**
Filtra pedidos según checkbox "Solo mis pedidos":
- Compara `order.user.username` con `user.username`
- Fallback a todos si no hay match

### **formatPrice(amount)**
Formatea precios según moneda configurada:
- Lee `heyluz_settings.currency`
- Usa `Intl.NumberFormat` para locale español
- Fallback a USD si falla

### **handleViewOrder(order)**
Abre modal con detalle completo del pedido

### **handleReorder(order)**
Reordena un pedido previo:
1. Extrae items del pedido
2. Guarda en `heyluz_reorder`
3. Marca flag `heyluz_open_cart`
4. Redirect a `/productos`

### **handleUseCoupon(code)**
Aplica cupón al carrito:
1. Guarda en `heyluz_coupon`
2. Muestra notificación
3. Usuario debe ir al carrito

## 🎨 Componentes de UI

### **Stats Grid**
```jsx
<div className="stats-grid">
  <div className="stat">
    <div className="stat-label">Label</div>
    <div className="stat-value">Value</div>
  </div>
</div>
```

### **Pills/Badges**
```jsx
<span className="pill ok">Pagado</span>
<span className="pill warn">Enviado</span>
<span className="pill danger">Cancelado</span>
<span className="pill off">Pendiente</span>
```

### **Modal**
```jsx
<div className="modal" style={{ display: 'block' }}>
  <div className="modal-content">
    <div className="modal-header">
      <h2>Título</h2>
      <button className="close-modal">&times;</button>
    </div>
    <div className="modal-body">
      {/* Contenido */}
    </div>
  </div>
</div>
```

## 🔄 Integración con E-commerce

### **Con Carrito**
- Botón "Ir al carrito" con flag `heyluz_open_cart`
- Reordenar pedidos agrega items automáticamente
- Cupones se aplican al checkout

### **Con Checkout**
- Pedidos creados aparecen automáticamente
- Estados sincronizados
- Facturas vinculadas

### **Con Admin**
- Usuarios admin/editor ven enlace al panel
- Gestión de cupones desde admin
- Configuración de moneda/impuestos

## 📱 Testing

### **Crear Pedido de Prueba**
```javascript
// En consola del navegador
const testOrder = {
  id: 'ORD-' + Date.now(),
  createdAt: new Date().toISOString(),
  status: 'pagado',
  items: [
    { id: 1, name: 'Perfume Test', quantity: 2, price: 50 }
  ],
  total: 100,
  user: { username: 'testuser' },
  invoiceId: 'INV-' + Date.now()
};

const orders = JSON.parse(localStorage.getItem('heyluz_orders') || '[]');
orders.push(testOrder);
localStorage.setItem('heyluz_orders', JSON.stringify(orders));
location.reload();
```

### **Crear Cupón de Prueba**
```javascript
const settings = JSON.parse(localStorage.getItem('heyluz_settings') || '{}');
if (!settings.coupons) settings.coupons = [];
settings.coupons.push({
  code: 'TEST10',
  type: 'percent',
  value: 10,
  scope: 'all',
  active: true,
  expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString()
});
localStorage.setItem('heyluz_settings', JSON.stringify(settings));
location.reload();
```

## 🚀 Mejoras Futuras

- [ ] Notificaciones toast en lugar de alert()
- [ ] Paginación para pedidos (>20 items)
- [ ] Búsqueda/filtro de pedidos por fecha
- [ ] Exportar pedidos a CSV
- [ ] Historial de uso de cupones
- [ ] Wishlist de productos
- [ ] Sistema de puntos/recompensas
- [ ] Chat de soporte integrado
- [ ] Notificaciones push de pedidos
- [ ] Tracking de envíos en tiempo real

## 🎓 Uso

### **Acceso**
1. Crear cuenta en `/register` o `/login`
2. Iniciar sesión
3. Click en "Mi cuenta" en el header
4. URL directa: `/user`

### **Sin Sesión**
- Redirect automático a `/login?redirect=/user`
- Retorno automático después de login

### **Con Admin**
- Usuarios admin/editor ven enlace al panel admin
- Navegación fluida entre dashboards

---

**Última actualización:** 20 de octubre de 2025  
**Versión:** 1.0.0  
**Autor:** HEYLUZ AROMAS Development Team
