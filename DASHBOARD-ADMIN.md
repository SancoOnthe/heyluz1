# 📊 Dashboard de Administrador - HEYLUZ AROMAS

## Descripción

Panel de control completo para administradores donde pueden gestionar productos, pedidos, reportes, marketing y configuración de la tienda.

## 🎯 Funcionalidades Implementadas

### ✅ **Dashboard Principal (`/admin`)**
- **Métricas en tiempo real:**
  - Ventas del día actual
  - Ventas del mes actual
  - Total de pedidos
  - Ingresos totales
- **Top 5 productos más vendidos** con ranking visual
- **Acciones rápidas:** Botones directos a las secciones principales
- **Información del sistema:** Productos activos, pedidos, usuario actual
- **Gestión de datos:**
  - 🌱 Sembrar datos de demostración
  - 📥 Importar datos desde JSON
  - 📤 Exportar todos los datos

### 🔄 **Navegación y Layout**
- **Sidebar lateral** con iconos FontAwesome
- **Active state** visual automático según ruta
- **6 secciones principales:**
  1. Dashboard - Resumen general
  2. Productos - Gestión completa
  3. Ventas - Pedidos y facturación
  4. Reportes - Gráficos y KPIs
  5. Marketing - Cupones y promociones
  6. Configuración - Ajustes de tienda

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── admin/
│       ├── page.js              # Dashboard principal (Server Component)
│       ├── layout.js            # Layout con sidebar (Client Component)
│       ├── productos/page.js    # Gestión de productos
│       ├── ventas/page.js       # Gestión de ventas
│       ├── reportes/page.js     # Reportes y gráficos
│       ├── marketing/page.js    # Marketing y cupones
│       └── config/page.js       # Configuración
├── components/
│   └── AdminDashboard.jsx       # Componente principal del dashboard
└── utils/
    └── adminUtils.js            # Utilidades compartidas
```

## 🔐 Autenticación y Seguridad

### **Protección de Rutas**
- Server-side cookie validation en cada página
- Redirect a `/admin/login` si no autenticado
- Verificación de roles permitidos: `admin`, `editor`
- Query param `redirect` para retorno post-login

### **Roles Permitidos**
- `admin` - Acceso completo a todas las funciones
- `editor` - Acceso completo (puede ser restringido en futuro)
- Otros roles son rechazados automáticamente

## 💾 Gestión de Datos (localStorage)

### **Claves de Almacenamiento**
```javascript
{
  'heyluz_products': [],      // Catálogo de productos
  'heyluz_orders': [],        // Historial de pedidos
  'heyluz_settings': {},      // Configuración de tienda
  'heyluz_featured_order': [] // Orden de productos destacados
}
```

### **Estructura de Producto**
```javascript
{
  id: 'prod-1',
  name: 'Elegancia Dorada',
  image: 'https://...',
  category: 'mujer|hombre|unisex',
  price: 89990,
  originalPrice: 119990,    // Opcional
  badge: 'Oferta',          // Opcional
  stock: 25,
  lowStock: 5,              // Umbral de alerta
  description: '...',
  ingredients: '...',
  published: true,
  variants: []              // Array de variantes
}
```

### **Estructura de Pedido**
```javascript
{
  id: 'ORD-1001',
  createdAt: '2025-10-20T...',
  status: 'pendiente|pagado|enviado|cancelado',
  items: [
    {
      name: 'Producto',
      quantity: 2,
      price: 89990
    }
  ],
  total: 179980,
  user: {
    username: 'user@example.com',
    email: 'user@example.com'
  },
  invoiceId: 'FAC-1001'     // Opcional
}
```

### **Estructura de Configuración**
```javascript
{
  name: 'HEYLUZ AROMAS',
  logo: '',
  currency: 'COP',
  tax: 19,                  // Porcentaje
  shipping: 15000,
  freeFrom: 200000,         // Envío gratis desde
  taxIncluded: false,
  orderPrefix: 'ORD-',
  orderNext: 1,
  invoicePrefix: 'FAC-',
  invoiceNext: 1,
  paymentMethods: {
    visa: true,
    mastercard: true,
    paypal: true,
    applePay: false
  },
  banner: {
    active: false,
    text: ''
  },
  coupons: [
    {
      code: 'BIENVENIDO10',
      type: 'percent|amount|bogo',
      value: 10,
      scope: 'all|category|product',
      category: 'mujer',    // Si scope=category
      products: ['1','2'],  // Si scope=product
      minSubtotal: 50000,
      active: true,
      expiresAt: '2025-11-20T...',
      maxUses: null,
      autoApply: false
    }
  ]
}
```

## 🛠️ Utilidades Disponibles

### **adminUtils.js**

#### **formatPrice(amount)**
```javascript
formatPrice(89990) // → "$ 89.990"
```
Formatea precios según la moneda configurada (COP por defecto).

#### **getProducts() / saveProducts(products)**
```javascript
const products = getProducts();
saveProducts(updatedProducts);
```
Lee/escribe productos desde/hacia localStorage.

#### **getOrders() / saveOrders(orders)**
```javascript
const orders = getOrders();
saveOrders(updatedOrders);
```
Lee/escribe pedidos desde/hacia localStorage.

#### **computeOrderStats(orders)**
```javascript
const stats = computeOrderStats(orders);
// Returns: { today, month, total, ordersCount, topProducts }
```
Calcula estadísticas de ventas y ranking de productos.

#### **seedDemoData()**
```javascript
const result = seedDemoData();
// Returns: { products: 5, orders: 3 }
```
Carga datos de demostración (5 productos, 3 pedidos, 2 cupones).

#### **exportToJSON(data, filename)**
```javascript
exportToJSON(allData, 'backup.json');
```
Exporta datos a archivo JSON descargable.

#### **exportToCSV(data, headers, filename)**
```javascript
exportToCSV(ordersData, ['ID', 'Fecha', 'Total'], 'ventas.csv');
```
Exporta datos a archivo CSV descargable.

## 📱 Testing y Desarrollo

### **Cargar Datos de Prueba**

**Opción 1: Desde el Dashboard**
1. Ve a `/admin`
2. Click en "Sembrar demo"
3. Los datos se cargan automáticamente

**Opción 2: Desde el Cargador HTML**
1. Abre `http://localhost:3000/admin-data-loader.html`
2. Click en "📦 Cargar Datos de Prueba"
3. Los datos incluyen:
   - 5 productos variados
   - 3 pedidos de ejemplo
   - 2 cupones activos

### **Importar/Exportar Datos**

**Exportar:**
```javascript
// Desde el dashboard
Click "Exportar datos" → Descarga JSON con todo

// O manualmente desde consola
const data = {
  products: JSON.parse(localStorage.getItem('heyluz_products')),
  orders: JSON.parse(localStorage.getItem('heyluz_orders')),
  settings: JSON.parse(localStorage.getItem('heyluz_settings'))
};
console.log(JSON.stringify(data, null, 2));
```

**Importar:**
```javascript
// Desde el dashboard
Click "Importar datos" → Selecciona archivo JSON

// O manualmente desde consola
const data = { /* ... */ };
localStorage.setItem('heyluz_products', JSON.stringify(data.products));
localStorage.setItem('heyluz_orders', JSON.stringify(data.orders));
localStorage.setItem('heyluz_settings', JSON.stringify(data.settings));
location.reload();
```

### **Limpiar Datos**
```javascript
// Desde admin-data-loader.html
Click "🗑️ Limpiar Todo"

// O desde consola
localStorage.removeItem('heyluz_products');
localStorage.removeItem('heyluz_orders');
localStorage.removeItem('heyluz_settings');
localStorage.removeItem('heyluz_featured_order');
location.reload();
```

## 🎨 Características de Diseño

### **Temas**
- ✅ **Modo Claro:** Diseño por defecto
- ✅ **Modo Oscuro:** Soportado automáticamente
- Sincronización con tema global del sitio

### **Responsive Design**
- **Desktop (>900px):** Sidebar fijo lateral
- **Mobile (<900px):** 
  - Sidebar arriba
  - Stats grid adaptable
  - Botones apilados

### **Componentes Visuales**
- **Stats Cards:** Con valores grandes y etiquetas
- **Pills/Badges:** Para estados y contadores
- **Ranking Visual:** Top productos con numeración colorida
- **Botones con Iconos:** FontAwesome integrado
- **Cards:** Con sombras y hover effects

## 🔄 Próximas Implementaciones

### **En Desarrollo:**
- [ ] Gestión completa de productos (CRUD)
- [ ] Sistema de variantes (talla, color, volumen)
- [ ] Gestión de pedidos con cambio de estado
- [ ] Reportes con gráficos Chart.js
- [ ] Sistema de cupones y promociones
- [ ] Configuración avanzada de tienda
- [ ] Exportación CSV/Excel de ventas
- [ ] Sistema de facturación e impresión
- [ ] Búsqueda y filtros avanzados
- [ ] Acciones masivas (bulk actions)

### **Futuras Mejoras:**
- [ ] Notificaciones en tiempo real
- [ ] Dashboard widgets personalizables
- [ ] Integración con API de envíos
- [ ] Sistema de roles y permisos granular
- [ ] Historial de cambios (audit log)
- [ ] Backup automático en la nube
- [ ] Multi-idioma para admin
- [ ] Temas personalizables

## 🎓 Uso

### **Acceso**
1. Iniciar sesión como admin en `/admin/login`
2. Credenciales de prueba:
   - Email: `admin@heyluz.com`
   - Password: `admin123`
3. Automáticamente redirige a `/admin`

### **Sin Sesión**
- Redirect automático a `/admin/login?redirect=/admin`
- Retorno automático después de login exitoso

### **Navegación**
- Click en items del sidebar para cambiar de sección
- Active state visual automático
- Botones de acción rápida en dashboard principal

## 📊 Monitoreo y Estadísticas

### **Métricas Disponibles**
```javascript
// Ventas de hoy
const today = stats.today; // Monto en COP

// Ventas del mes
const month = stats.month; // Monto en COP

// Total histórico
const total = stats.total; // Monto en COP

// Número de pedidos
const count = stats.ordersCount; // Número

// Top 5 productos
const top = stats.topProducts;
// [{ name: 'Producto', count: 15 }, ...]
```

### **Cálculo en Tiempo Real**
Las estadísticas se recalculan automáticamente cuando:
- Se cargan datos nuevos
- Se importan datos
- Se siembran datos demo
- Se recarga el componente

---

**Última actualización:** 20 de octubre de 2025  
**Versión:** 1.0.0 - Dashboard Principal  
**Autor:** HEYLUZ AROMAS Development Team

**Estado:** ✅ Dashboard Principal Completo - En desarrollo: Gestión de Productos
