# 🔐 Usuarios de Prueba - HEYLUZ AROMAS

## Credenciales de Acceso

### 👤 Usuario Administrador
- **Email:** `admin@heyluz.com`
- **Contraseña:** `admin123`
- **Rol:** Admin
- **Acceso:** Panel de administración + Dashboard de usuario
- **Redirect:** `/admin`

### ✏️ Usuario Editor
- **Email:** `editor@heyluz.com`
- **Contraseña:** `editor123`
- **Rol:** Editor
- **Acceso:** Panel de administración + Dashboard de usuario
- **Redirect:** `/admin`

### 👥 Usuario Normal
- **Email:** `user@heyluz.com`
- **Contraseña:** `user123`
- **Rol:** Viewer
- **Acceso:** Dashboard de usuario
- **Redirect:** `/user`

---

## 🚀 Cómo Usar

### Opción 1: Login con usuarios existentes

1. Ve a `/login`
2. Ingresa uno de los emails y contraseñas de arriba
3. Serás redirigido automáticamente según tu rol

### Opción 2: Crear nueva cuenta

1. Ve a `/register`
2. Completa el formulario con tus datos
3. La cuenta se crea automáticamente como **Viewer**
4. Serás redirigido a `/user`

---

## 📋 Flujos de Redirección

### Login Normal
```
/login → API /api/auth/login → /user (o /admin si es admin/editor)
```

### Login desde Checkout
```
/checkout → redirect a /login?redirect=/checkout
/login?redirect=/checkout → login exitoso → /checkout
```

### Registro Normal
```
/register → API /api/auth/register → /user
```

### Registro desde Checkout
```
/checkout → redirect a /login?redirect=/checkout
/login?redirect=/checkout → click "Regístrate" 
→ /register?redirect=/checkout → registro exitoso → /checkout
```

---

## 🔒 Sistema de Sesión

### Cookie de Sesión
- **Nombre:** `session`
- **Duración:** 7 días
- **Contenido:**
  ```json
  {
    "role": "admin|editor|viewer",
    "username": "username",
    "email": "email@example.com",
    "name": "Nombre Completo"
  }
  ```

### Rutas Protegidas

#### `/user` - Dashboard de Usuario
- **Requiere:** Cookie de sesión válida
- **Roles permitidos:** `admin`, `editor`, `viewer`
- **Redirect si no auth:** `/login?redirect=/user`

#### `/checkout` - Página de Pago
- **Requiere:** Cookie de sesión válida
- **Roles permitidos:** Cualquiera autenticado
- **Redirect si no auth:** `/login?redirect=/checkout`

#### `/admin` - Panel de Administración
- **Requiere:** Cookie de sesión válida
- **Roles permitidos:** `admin`, `editor`
- **Redirect si no auth:** `/login`

---

## 🛠️ Personalización

### Agregar Nuevos Usuarios de Prueba

Edita `src/app/api/auth/login/route.js`:

```javascript
const users = [
  { email: 'admin@heyluz.com', password: 'admin123', role: 'admin', username: 'admin', name: 'Administrador' },
  { email: 'editor@heyluz.com', password: 'editor123', role: 'editor', username: 'editor', name: 'Editor' },
  { email: 'user@heyluz.com', password: 'user123', role: 'viewer', username: 'user', name: 'Usuario' },
  // Agrega aquí más usuarios
  { email: 'tu@email.com', password: 'tupassword', role: 'viewer', username: 'tuuser', name: 'Tu Nombre' },
];
```

### Cambiar Duración de Sesión

Edita los archivos API (`login/route.js` y `register/route.js`):

```javascript
maxAge: 60 * 60 * 24 * 7 // 7 días en segundos
// Cambiar por:
maxAge: 60 * 60 * 24 * 30 // 30 días
// o:
maxAge: 60 * 60 // 1 hora
```

---

## 🐛 Troubleshooting

### "El login no redirige"

**Solución:**
1. Abre las DevTools (F12)
2. Ve a la pestaña "Application" > "Cookies"
3. Verifica que existe la cookie `session`
4. Si no existe, revisa la consola por errores
5. Prueba con una ventana de incógnito

### "Redirige pero sigo viendo la página de login"

**Solución:**
1. Limpia las cookies del navegador
2. Cierra todas las pestañas del sitio
3. Vuelve a intentar el login

### "Error 401 - Credenciales inválidas"

**Solución:**
1. Verifica que estés usando uno de los emails de prueba exactos
2. Las contraseñas son case-sensitive
3. No agregues espacios antes o después

### "No puedo acceder a /admin"

**Solución:**
1. Debes usar `admin@heyluz.com` o `editor@heyluz.com`
2. Los usuarios normales no tienen acceso
3. Cierra sesión y vuelve a entrar con un usuario admin

---

## 📝 Notas de Desarrollo

### Para Producción

Este sistema de autenticación es **SOLO PARA DESARROLLO**. En producción debes:

1. ✅ **Base de datos:** Usar MongoDB, PostgreSQL, etc.
2. ✅ **Hashing:** Hashear contraseñas con bcrypt
3. ✅ **Tokens:** Usar JWT o NextAuth.js
4. ✅ **HTTPS:** Cookies secure solo por HTTPS
5. ✅ **Validación:** Email verification
6. ✅ **Rate limiting:** Prevenir brute force
7. ✅ **2FA:** Autenticación de dos factores
8. ✅ **OAuth:** Login con Google, Facebook, etc.

### Librerías Recomendadas

- **NextAuth.js** - Sistema completo de auth
- **Prisma** - ORM para base de datos
- **bcryptjs** - Hashing de contraseñas
- **jsonwebtoken** - Manejo de JWT
- **zod** - Validación de esquemas

---

**Última actualización:** 20 de octubre de 2025
