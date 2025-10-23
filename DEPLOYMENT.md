
---

# Guía de despliegue — Heyluz Aromas

Guía concisa y limpia para desplegar la aplicación usando Supabase (DB + Auth) y Vercel.

## 1) Requisitos previos

* Cuenta en Supabase (https://app.supabase.com).
* Cuenta en Vercel (https://vercel.com).
* Permisos para ejecutar SQL en tu proyecto Supabase.

---

## 2) Preparar Supabase

1. Crea un proyecto en Supabase.
2. Copia la URL del proyecto y la anon key (public).
3. Si vas a ejecutar migraciones o crear usuarios desde scripts, copia también la service_role key y guárdala como secreto (no subir al repositorio).
4. En el SQL Editor ejecuta `scripts/supabase-schema.sql` o adapta el schema según tus necesidades.

---

## 3) Variables de entorno (local y en Vercel)

Crea un archivo `.env.local` en la raíz del proyecto (NO lo subas al repositorio):

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>    # sólo en secrets/production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En Vercel añade las mismas variables. Marca `SUPABASE_SERVICE_ROLE_KEY` como secreto en Production.

---

## 4) Migración de datos (opcional, recomendada)

1. Instala dependencias:

```bash
npm install
```

2. Ejecuta una migración de prueba (dry-run):

```powershell
npm run migrate-supabase -- --dry-run
```

3. Si todo se ve bien, ejecuta la migración real (requiere `SUPABASE_SERVICE_ROLE_KEY`):

```powershell
npm run migrate-supabase
```

---

## 5) Despliegue en Vercel

1. Empuja el repositorio a tu VCS (GitHub/GitLab/Bitbucket):

```bash
git add .
git commit -m "Deploy: preparar para producción"
git push
```

2. En Vercel crea un proyecto desde tu repositorio.
3. Configura las Environment Variables para Production/Preview/Development.
4. Despliega y espera a que la build termine.

---

## 6) Verificaciones post-despliegue

* La página principal se carga correctamente.
* Login (Supabase Auth) funciona.
* El dashboard del admin es accesible (si aplica).
* Los productos se muestran (verificar `published = true`).

---

## 7) Problemas comunes

* "Invalid API key": revisa que pegaste las claves correctamente y sin espacios extra.
* "Row Level Security": ejecuta el SQL del schema y revisa las políticas RLS en Supabase.
* Productos no se muestran: verifica `published` y las políticas RLS.

---

## 8) Notas de seguridad

* Nunca subas `SUPABASE_SERVICE_ROLE_KEY` al repositorio.
* Mantén las claves en los secrets de tu proveedor (Vercel, Netlify, etc.).

---

## 9) Recursos

* [Next.js docs](https://nextjs.org/docs)
* [Supabase docs](https://supabase.com/docs)
* [Vercel docs](https://vercel.com/docs)
* [Supabase docs](https://supabase.com/docs)
* [Vercel docs](https://vercel.com/docs)

# 🚀 Guía de Despliegue (configuración local o proveedor externo)
## 📋 Requisitos Previos
* Nota: este proyecto ahora usa Supabase como proveedor de datos y autenticación. Sigue los pasos abajo para crear el proyecto en Supabase y configurar variables de entorno.
## 🗄️ Paso 1: Preparar la capa de datos
Recomendación: usar Supabase (Postgres gestionado). El resto de las instrucciones asumen que usarás Supabase.
## 💻 Paso 2: Configurar Variables de Entorno Locales
### 2.1 Crear archivo `.env.local`
En la raíz del proyecto:
```bash
cp .env.local.example .env.local
```
### 2.2 Editar `.env.local`
```env
# Variables mínimas para Supabase (NO subir a repositorios públicos)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # mantener como secreto
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
### 2.3 Probar localmente
```bash
npm run dev
```
Abre http://localhost:3000 y verifica (tras configurar Supabase y migrar datos):
* ✅ Productos se cargan desde la tabla `products`
* ✅ Login funciona via Supabase Auth
* ✅ Dashboard del admin es accesible
## 🎯 Paso 3: Migrar Datos Existentes (Opcional)
Si ya tienes productos/datos en localStorage, puedes migrarlos:
### 3.1 Exportar desde Admin
1. Ve a `/admin/productos`
2. Haz clic en **Exportar CSV**
3. Guarda el archivo
### 3.2 Importar datos
Importa los datos desde CSV o desde tu fuente actual al destino elegido. Si usas almacenamiento local, importa el CSV a `src/data/` y adapta el formato a los adaptadores de la app.
## 🚢 Paso 4: Desplegar en Vercel
### 4.1 Conectar con GitHub
1. Sube tu proyecto a GitHub (si no lo has hecho):
# 🚀 Guía de Despliegue (configuración local o proveedor externo)

## 📋 Requisitos Previos

* Nota: este proyecto usa Supabase como proveedor de datos y autenticación. Sigue los pasos abajo para crear el proyecto en Supabase y configurar variables de entorno.

* Cuenta en [Vercel](https://vercel.com) (o alternativa)

## 🗄️ Paso 1: Preparar la capa de datos

Recomendación: usar Supabase (Postgres gestionado). El resto de las instrucciones asumen que usarás Supabase.

## 💻 Paso 2: Configurar Variables de Entorno Locales

### 2.1 Crear archivo `.env.local`

En la raíz del proyecto:

```bash
cp .env.local.example .env.local
```

### 2.2 Editar `.env.local`

```ini
# Variables mínimas para Supabase (NO subir a repositorios públicos)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # mantener como secreto
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.3 Probar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y verifica (tras configurar Supabase y migrar datos):

* ✅ Productos se cargan desde la tabla `products`
* ✅ Login funciona vía Supabase Auth
* ✅ Dashboard del admin es accesible

## 🎯 Paso 3: Migrar Datos Existentes (Opcional)

Si ya tienes productos/datos en localStorage, puedes migrarlos.

### 3.1 Exportar desde Admin

1. Ve a `/admin/productos`
2. Haz clic en **Exportar CSV**
3. Guarda el archivo

### 3.2 Importar datos

Importa los datos desde CSV o desde tu fuente actual al destino elegido. Si usas almacenamiento local, importa el CSV a `src/data/` y adapta el formato a los adaptadores de la app.

## 🚢 Paso 4: Desplegar en Vercel

### 4.1 Conectar con GitHub

1. Sube tu proyecto a GitHub (si no lo has hecho):

```bash
git init
git add .
git commit -m "Initial commit - Heyluz Aromas"
git remote add origin https://github.com/tu-usuario/heyluz-aromas.git
git push -u origin main
```

### 4.2 Importar en Vercel

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. **Framework Preset**: Next.js (autodetectado)
4. **Root Directory**: `./` (por defecto)

### 4.3 Configurar Variables de Entorno

En la página de configuración del proyecto en Vercel:

1. Haz clic en **Environment Variables**
2. Añade una por una (ejemplo):

```ini
# Añade aquí las variables de entorno necesarias para tu proveedor (p. ej. APP_URL, API_KEYS)
NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
```

3. Aplica a: **Production**, **Preview**, y **Development**

### 4.4 Desplegar

1. Haz clic en **Deploy**
2. Espera 2–5 minutos
3. Tu sitio estará en: [https://tu-proyecto.vercel.app](https://tu-proyecto.vercel.app)

### 4.5 Actualizar Redirect URLs en tu proveedor de autenticación

Si utilizas un proveedor de autenticación externa, configura las Redirect URLs y el Site URL según las instrucciones del proveedor.

## ✅ Paso 5: Verificación Post-Despliegue

### Checklist

* [ ] Página principal carga correctamente
* [ ] Login funciona (admin@heyluzaromas.com)
* [ ] Dashboard del admin es accesible
* [ ] Puedes crear/editar productos
* [ ] Formulario de contacto envía mensajes
* [ ] Newsletter/registro funciona
* [ ] Filtros de productos funcionan
* [ ] Checkout y pedidos funcionan
* [ ] Notificaciones del admin funcionan (si están en HTTPS)

## 🔒 Paso 6: Seguridad y Optimización

### 6.1 Configurar Dominios Personalizados (Opcional)

En Vercel:

1. Ve a **Settings** → **Domains**
2. Añade tu dominio personalizado
3. Sigue las instrucciones para configurar DNS


Tu tienda HEYLUZ AROMAS ahora está en producción con:

* ✅ Base de datos PostgreSQL escalable
* ✅ Autenticación segura

### Productos no se muestran
* Asegúrate de tener `published = true` en los productos
---

# 🚀 Guía de Despliegue (configuración local o proveedor externo)

## 📋 Requisitos Previos

* Nota: este proyecto usa Supabase como proveedor de datos y autenticación. Sigue los pasos abajo para crear el proyecto en Supabase y configurar variables de entorno.

* Cuenta en [Vercel](https://vercel.com) (o alternativa)

## 🗄️ Paso 1: Preparar la capa de datos

Recomendación: usar Supabase (Postgres gestionado). El resto de las instrucciones asumen que usarás Supabase.

## 💻 Paso 2: Configurar Variables de Entorno Locales

### 2.1 Crear archivo `.env.local`

En la raíz del proyecto:

```bash
cp .env.local.example .env.local
```

### 2.2 Editar `.env.local`

```ini
# Variables mínimas para Supabase (NO subir a repositorios públicos)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # mantener como secreto
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.3 Probar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y verifica (tras configurar Supabase y migrar datos):

* ✅ Productos se cargan desde la tabla `products`
* ✅ Login funciona vía Supabase Auth
* ✅ Dashboard del admin es accesible

## 🎯 Paso 3: Migrar Datos Existentes (Opcional)

Si ya tienes productos/datos en localStorage, puedes migrarlos.

### 3.1 Exportar desde Admin

1. Ve a `/admin/productos`
2. Haz clic en **Exportar CSV**
3. Guarda el archivo

### 3.2 Importar datos

Importa los datos desde CSV o desde tu fuente actual al destino elegido. Si usas almacenamiento local, importa el CSV a `src/data/` y adapta el formato a los adaptadores de la app.

## 🚢 Paso 4: Desplegar en Vercel

### 4.1 Conectar con GitHub

1. Sube tu proyecto a GitHub (si no lo has hecho):

```bash
git init
git add .
git commit -m "Initial commit - Heyluz Aromas"
git remote add origin https://github.com/tu-usuario/heyluz-aromas.git
git push -u origin main
```

### 4.2 Importar en Vercel

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. **Framework Preset**: Next.js (autodetectado)
4. **Root Directory**: `./` (por defecto)

### 4.3 Configurar Variables de Entorno

En la página de configuración del proyecto en Vercel:

1. Haz clic en **Environment Variables**
2. Añade una por una (ejemplo):

```ini
# Añade aquí las variables de entorno necesarias para tu proveedor (p. ej. APP_URL, API_KEYS)
NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
```

3. Aplica a: **Production**, **Preview**, y **Development**

### 4.4 Desplegar

1. Haz clic en **Deploy**
2. Espera 2–5 minutos
3. Tu sitio estará en: [https://tu-proyecto.vercel.app](https://tu-proyecto.vercel.app)

### 4.5 Actualizar Redirect URLs en tu proveedor de autenticación

Si utilizas un proveedor de autenticación externa, configura las Redirect URLs y el Site URL según las instrucciones del proveedor.

## ✅ Paso 5: Verificación Post-Despliegue

### Checklist

* [ ] Página principal carga correctamente
* [ ] Login funciona (admin@heyluzaromas.com)
* [ ] Dashboard del admin es accesible
* [ ] Puedes crear/editar productos
* [ ] Formulario de contacto envía mensajes
* [ ] Newsletter/registro funciona
* [ ] Filtros de productos funcionan
* [ ] Checkout y pedidos funcionan
* [ ] Notificaciones del admin funcionan (si están en HTTPS)

## 🔒 Paso 6: Seguridad y Optimización

### 6.1 Configurar Dominios Personalizados (Opcional)

En Vercel:

1. Ve a **Settings** → **Domains**
2. Añade tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### 6.2 Habilitar Storage para Imágenes (Opcional)

Si quieres subir imágenes directamente:

1. Configura el proveedor de almacenamiento que uses (S3, Cloud Storage, etc.) y ajusta las políticas/ACLs según tus requisitos.

### 6.3 Monitoreo

* **Vercel**: Ve a **Analytics** para ver tráfico
* **Proveedor de BD**: Revisa los reportes/monitor de tu proveedor para uso de BD

## 🐛 Solución de Problemas Comunes

### Error: "Invalid API key"

* Verifica que copiaste las claves/API de tu proveedor de datos
* Asegúrate de usar `NEXT_PUBLIC_` para variables del cliente

### Error: "Row Level Security"

* Verifica que ejecutaste todo el SQL del schema
* Comprueba que el usuario tiene el rol correcto en `profiles`

### Productos no se muestran

* Asegúrate de tener `published = true` en los productos
* Verifica las políticas RLS de la tabla `products`

### Login no funciona

* Verifica las Redirect URLs en la configuración del proveedor de autenticación
* Comprueba que el usuario existe en **Authentication** → **Users**

## 📚 Recursos Adicionales

* [Documentación del proveedor de datos que uses]
* [Documentación de Next.js](https://nextjs.org/docs)
* [Documentación de Vercel](https://vercel.com/docs)

## 🎉 Listo

Tu tienda HEYLUZ AROMAS ahora está en producción con:

* ✅ Base de datos PostgreSQL escalable
* ✅ Autenticación segura
* ✅ API REST automática
* ✅ Despliegue global con CDN
* ✅ SSL/HTTPS incluido
* ✅ Backups automáticos

Para actualizar en el futuro:

```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel detectará el push y redeplegará automáticamente.

---

## ➤ Integración con Supabase (obligatorio para producción)

1. Crea un proyecto en [https://app.supabase.com](https://app.supabase.com) y copia la `URL` y la `anon key`.
   Si necesitas operar sobre Auth o hacer migraciones automáticas, copia también la `service_role key` (GUÁRDALA como secreto).

2. Abre el SQL Editor y ejecuta `scripts/supabase-schema.sql` (o ajusta el schema a tus necesidades).

3. Configura las variables de entorno en Vercel (o tu proveedor):

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY (solo en Secrets/Production)

4. Migración de datos (opcional pero recomendado): usa el script incluido:

```powershell
npm install
npm run migrate-supabase -- --dry-run   # inspecciona los datos que se migrarán
npm run migrate-supabase                 # ejecuta la migración (usa service_role)
```

5. Despliega en Vercel con las env vars configuradas.

6. Revisa las políticas RLS y ajusta roles (admin/editor/user) según tu modelo.

---

## ➤ Integración con Supabase (obligatorio para producción)

1. Crea un proyecto en [https://app.supabase.com](https://app.supabase.com) y copia la `URL` y la `anon key`.
   Si necesitas operar sobre Auth o hacer migraciones automáticas, copia también la `service_role key` (GUÁRDALA como secreto).

2. Abre el SQL Editor y ejecuta `scripts/supabase-schema.sql` (o ajusta el schema a tus necesidades).

3. Configura las variables de entorno en Vercel (o tu proveedor):

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY (solo en Secrets/Production)

4. Migración de datos (opcional pero recomendado): usa el script incluido:

```powershell
npm install
npm run migrate-supabase -- --dry-run   # inspecciona los datos que se migrarán
npm run migrate-supabase                 # ejecuta la migración (usa service_role)
```

5. Despliega en Vercel con las env vars configuradas.

6. Revisa las políticas RLS y ajusta roles (admin/editor/user) según tu modelo.

* ✅ Despliegue global con CDN
* ✅ SSL/HTTPS incluido
* ✅ Backups automáticos

Para actualizar en el futuro:
```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel detectará el push y redesplegar automáticamente.

---

## ➤ Integración con Supabase (obligatorio para producción)

1. Crea un proyecto en https://app.supabase.com y copia la `URL` y la `anon key`. Si necesitas operar sobre Auth o hacer migraciones automáticas, copia también la `service_role key` (GUÁRDALA como secreto).

2. Abre el SQL Editor y ejecuta `scripts/supabase-schema.sql` (o ajusta el schema a tus necesidades).

3. Configura las variables de entorno en Vercel (o tu proveedor):

   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (solo en Secrets/Production)

4. Migración de datos (opcional pero recomendado): usa el script incluido:

```powershell
npm install
npm run migrate-supabase -- --dry-run   # inspecciona los datos que se migrarán
npm run migrate-supabase                 # ejecuta la migración (usa service_role)
```

5. Despliega en Vercel con las env vars configuradas.

6. Revisa las políticas RLS y ajusta roles (admin/editor/user) según tu modelo.
