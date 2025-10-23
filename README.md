# WEBPERFUM Next.js

Proyecto migrado desde HTML/CSS/JS plano a Next.js (App Router). Esta rama ahora usa Supabase como capa de datos y autenticación. El modo local con JSON existe todavía en el repositorio para referencia, pero el código de producción requiere Supabase configurado.

## Principales rutas

* `/` → portada
* `/productos` → listado demo de productos
* `/login` → login local que setea cookie de sesión
* `/user` → dashboard de usuario (protegido)
* `/admin` → dashboard admin y subrutas (protegido)

## Autenticación (Supabase)

Este proyecto usa Supabase Auth + tablas (`profiles`, `products`, `orders`) para autenticación y datos.

* POST `/api/auth/login` — usa Supabase Auth (signInWithPassword) y crea una cookie de sesión con los datos esenciales del usuario.
* POST `/api/auth/logout` — borra la cookie de sesión.
* GET `/api/auth/check` — valida la sesión con Supabase (si existe) o devuelve el estado de la cookie de sesión.

## Notas sobre la migración a Supabase

* El proyecto ahora depende de Supabase. Revisa `scripts/supabase-schema.sql` para el esquema inicial y `scripts/migrate-to-supabase.js` para migrar datos locales a Supabase.

## Cómo ejecutar en desarrollo (PowerShell)

```powershell
# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

## Qué probar rápidamente (con Supabase)

1. Crea un proyecto en Supabase y aplica `scripts/supabase-schema.sql` desde el SQL editor.
1. Configura las variables en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (opcional pero recomendado).
1. Ejecuta migración (opcional) para importar datos de `src/data/*.json`:

```powershell
npm install
npm run migrate-supabase -- --dry-run   # inspecciona
npm run migrate-supabase                 # ejecuta la migración real
```

1. Ejecuta el servidor de desarrollo y prueba login/registro via forms.

```powershell
npm run dev
```

## Mejoras de imágenes

* `src/components/OptimizedImage.jsx` protege contra `src === ""` y no pasa cadenas vacías a `next/image`.
* Si una imagen falla, se usa `/fallback.svg` (guardado en `public/fallback.svg`).
* Si no hay `src`, se muestra un placeholder cuadrado con ícono (CSS en `src/app/globals.css`).

## Notas de desarrollo y seguridad

* Actualmente las contraseñas se guardan en texto plano en `src/data/users.json` — esto es sólo para desarrollo. En producción debes usar hashing (bcrypt) y un backend seguro.
* La cookie `session` se crea con flags `httpOnly` y `sameSite=lax`. Ajusta `secure` según despliegue HTTPS.

## Próximos pasos sugeridos (dashboard de usuario)

* Mejorar la UI/UX del `UserDashboard` (`src/components/UserDashboard.jsx`): añadir secciones reales, soporte para editar perfil vía API y mostrar pedidos reales.
* Añadir backend persistente (SQLite/Postgres) o integrar tu servicio para producción.
* Añadir pruebas unitarias y e2e para flows de login/logout y protección de rutas.

## Contribuir

* Cualquier PR debe incluir una breve descripción y pasos para reproducir.
* Para cambios en auth, actualiza `src/data/*.json` con usuarios de prueba.

## Contacto

* Si trabajas conmigo en esto, dime qué mejoras del dashboard quieres priorizar y las implemento.
