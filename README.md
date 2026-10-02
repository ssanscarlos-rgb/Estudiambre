# Lab 2 demo — Static Web App + CI/CD

App en React con varias páginas (Productos, Perfil, Comparar, Portal) que
consumen distintos endpoints de Mock Services en Azure API Management.
Pensada para practicar el flujo completo del Lab 2 sin repetir el error de
los 2 workflows en conflicto.

## ⚠️ Cambio importante en REACT_APP_API_URL

Ahora que hay varias páginas, `REACT_APP_API_URL` debe apuntar solo a la
**base** de tu API (hasta la versión), SIN el nombre del recurso al final:

```
https://tu-apim.azure-api.net/v1
```

(antes era `.../v1/products`, ahora cada página en `src/pages/` agrega su
propio recurso: `products`, `profile`, `compare`, `portal` — mira `src/api.js`)

Cada uno de esos recursos necesita su propia operación + Mock response
en APIM, igual que hiciste para `products` en el Lab 1.

## Páginas y recursos de este proyecto (EstudiAmbre)

| Ruta | Página | Recurso en APIM |
|---|---|---|
| `/` | Panel | GET `resumen` |
| `/comparar` | Comparar | GET `precios` |
| `/registrar` | Registrar | GET/POST/PUT/DELETE `gastos` |
| `/plan` | Plan | GET/PUT `plan` |
| `/perfil` | Perfil | GET `perfil` |

Cada recurso necesita su propia operación + Response 200 + Mock policy en
APIM (mismo patrón del Lab 1, repetido por cada uno). **Actualiza estos
Samples en APIM** — cambiaron respecto a la versión anterior para calzar
con el diseño final:

**`resumen`** (GET, usado en Panel)
```json
{
  "nombre": "María Fernanda",
  "quincenaLabel": "Quincena del 15 al 30 de setiembre",
  "disponible": 87400,
  "gastado": 62600,
  "meta": 150000,
  "mensaje": "Vas bien: te quedan ₡5 830 por día hasta el 30. Ojo con los antojos de café.",
  "ultimosMovimientos": [
    { "id": 1, "descripcion": "Café del parqueo", "monto": 1200, "categoria": "Antojos", "fecha": "Hoy" },
    { "id": 2, "descripcion": "Pasaje bus San Pedro", "monto": 430, "categoria": "Transporte", "fecha": "Ayer" }
  ],
  "radarTop3": [
    { "id": 1, "producto": "Arroz Tío Pelón 1 kg", "tienda": "Pali San Pedro", "precio": 785 },
    { "id": 2, "producto": "Café 1820 molido 250 g", "tienda": "Mas x Menos", "precio": 2150 }
  ]
}
```

**`precios`** (GET, usado en Comparar — la URL incluye `?producto=...` pero
en el mock puedes ignorar el query y devolver siempre esta forma)
```json
{
  "producto": "Arroz Tío Pelón 1 kg",
  "totalReportes": 44,
  "resultados": [
    { "id": 1, "tienda": "Pali San Pedro", "zona": "San Pedro", "precio": 785, "reportes": 14 },
    { "id": 2, "tienda": "Mas x Menos Montes de Oca", "zona": "Montes de Oca", "precio": 820, "reportes": 9 }
  ]
}
```

**`gastos`** (CRUD completo — 4 operaciones distintas en APIM, todas bajo el mismo path base)

- **GET `/gastos`** — historial completo
  ```json
  [
    { "id": 1, "descripcion": "Café del parqueo", "monto": 1200, "categoria": "Antojos", "fecha": "Hoy" },
    { "id": 2, "descripcion": "Pasaje bus San Pedro", "monto": 430, "categoria": "Transporte", "fecha": "Ayer" }
  ]
  ```
- **POST `/gastos`** — registrar uno nuevo. El mock puede devolver
  simplemente `{ "ok": true }`.
- **PUT `/gastos/{id}`** — editar uno existente. Necesita un parámetro de
  plantilla: al escribir la URL en "Add operation" pon `/gastos/{id}` (las
  llaves hacen que APIM detecte `id` como Template parameter automáticamente,
  revísalo en el tab **Template**). El mock puede devolver `{ "ok": true }`.
- **DELETE `/gastos/{id}`** — eliminar uno existente. Misma URL con
  `{id}`. El mock puede devolver `{ "ok": true }`.

El frontend hace estas 4 llamadas de verdad (editar y eliminar están en
`Registrar.js`, con los íconos de lápiz/basura que aparecen al pasar el
mouse sobre cada fila), pero como son mocks, no esperes que un PUT/DELETE
persista entre recargas — cada mock responde lo mismo sin importar el
`{id}` que le llegue. Eso es normal y suficiente para la Fase I.

**`plan`** (GET y PUT)
```json
{
  "meta": 150000,
  "categorias": [
    { "nombre": "Comida", "gastado": 38200, "presupuesto": 60000 },
    { "nombre": "Transporte", "gastado": 9460, "presupuesto": 20000 }
  ]
}
```
El botón **"Editar meta"** y **"+ Agregar categoría"** de la pantalla Plan
mandan un **PUT `/plan`** con el objeto completo actualizado. El mock de
esa operación puede devolver el mismo JSON de arriba o `{ "ok": true }`.

**`perfil`** (GET, usado también en el sidebar/header de TODAS las páginas)
```json
{
  "nombre": "Jean Carlos Huertas Piedra",
  "correo": "ssanscarlos@gmail.com",
  "universidad": "TEC San Carlos",
  "quincenaDias": "Días 1 y 15 de cada mes",
  "racha": 6,
  "notificacionesNoLeidas": 1,
  "insignias": ["Primera quincena completa", "10 reportes de precios", "Racha de 7 días"]
}
```

⚠️ Como `perfil` ahora se llama en **cada página** (para el sidebar y el
header), asegúrate de que esa operación específica tenga el Mock response
bien configurado — si falla, vas a ver el error repetido en las 5
pantallas, no solo en Perfil.

**`notificaciones`** (GET, nuevo — se llama en cada página para el panel de la campana)
```json
[
  { "id": 1, "titulo": "Presupuesto de Transporte", "mensaje": "Te queda poco presupuesto en Transporte esta quincena.", "fecha": "Hoy", "leida": false },
  { "id": 2, "titulo": "Bajó el precio", "mensaje": "El arroz Tío Pelón bajó de precio en Pali San Pedro.", "fecha": "Ayer", "leida": true }
]
```
El punto rojo de la campana aparece si al menos una tiene `"leida": false`.

## Fuentes e íconos

- Tipografía: **Sora** (títulos) y **Manrope** (texto), cargadas desde Google
  Fonts en `public/index.html`. Necesitas conexión a internet para que
  carguen; si Azure Static Web Apps no tiene salida a `fonts.googleapis.com`
  (no debería ser el caso, es un dominio público), cae al sans-serif del
  sistema sin romper nada.
- Íconos: [`lucide-react`](https://lucide.dev) (licencia ISC), ya no hay
  emojis en la interfaz. El mapeo de categoría → ícono está en `src/icons.js`.

## Sugerencias (autocomplete)

Componente reutilizable `src/components/Suggest.js`, usado en dos lugares:

- **Comparar** → sugiere contra `src/catalog.js`, una lista fija de ~15
  productos comunes escrita a mano en el frontend. **No es un mock**, es
  solo para autocompletar lo que el usuario escribe; la búsqueda en sí
  sigue yendo 100% a `/precios`. Si quieres que también venga de un mock,
  se puede mover a una operación `GET /catalogo` más adelante.
- **Registrar** → sugiere contra las descripciones de gastos ya cargados
  (no hace falta mock nuevo, usa los datos que ya trajo `GET /gastos`).

## Monto con stepper (±₡50)

`src/components/AmountInput.js` reemplaza los `<input type="number">` en
Registrar y Plan: dos botones +/- que suman o restan de 50 en 50, sin las
flechas nativas del navegador (que se ven distinto — y mal — según el
navegador), y no deja escribir números negativos.

## Reglas de formularios

- Los botones "Buscar" (Comparar) y "Guardar gasto" (Registrar) están
  **deshabilitados hasta que los campos obligatorios estén completos** —
  no solo muestran un error al hacer click, no se pueden presionar antes.
- Los campos obligatorios llevan un asterisco (`*`) junto a la etiqueta, y
  cada formulario tiene una nota "* Campos obligatorios" debajo del botón.

## Logo

`src/components/Logo.js` ya no tiene la ruta de la imagen fija en el
código — recibe la ubicación por prop (`src`), igual que el campo
`"image"` del Lab 1 devolvía una URL en vez de la imagen misma.

- **Dentro de la app (sidebar, ya logueado):** `Layout.js` le pasa
  `perfil?.logoUrl`, el valor que trae el mock de `GET /perfil`. Agrega
  este campo nuevo al Sample en APIM:
  ```json
  "logoUrl": "/logo.svg"
  ```
  (lo agregas dentro del mismo JSON de `perfil` que ya tienes, junto a
  `nombre`, `racha`, etc.)
- **Pantalla de login (antes de autenticarse):** ahí todavía no hay
  sesión ni token para llamarle a ningún mock, así que `LoginScreen.js`
  usa `<Logo size={48} />` sin `src`, lo que cae automáticamente al
  archivo local `public/logo.svg`. Es la única excepción razonable: el
  branding previo al login no puede depender de una llamada autenticada.

En ambos casos, si la imagen no carga (ruta mala, archivo faltante),
cae automáticamente a un círculo con la letra "E" — no rompe nada.

**El archivo físico** igual tiene que existir en `public/logo.svg` de tu
repo (o el nombre que pongas en `logoUrl`, siempre que sea una ruta
dentro de tu propio Static Web App o una URL pública completa). El mock
solo dice *dónde* está la imagen — el archivo en sí no sale de APIM,
igual que en el Lab 1 las fotos de productos eran URLs a Walmart/Icon,
no bytes de imagen dentro del JSON.

## Navegar con la rueda del mouse

Scroll hacia abajo/arriba sobre la página cambia de panel (Panel →
Comparar → Registrar → Plan → Perfil y viceversa), implementado en
`Layout.js`. Tiene un cooldown de ~650ms entre cambios para que no se
dispare varias veces de un solo gesto, y revisa si hay algo scrolleable
debajo del cursor (una lista larga, el dropdown de notificaciones, etc.)
antes de hijackear el scroll — si todavía hay contenido por scrollear ahí,
deja que se comporte normal y no cambia de panel.

## Agregar una página nueva

1. Crea `src/pages/NuevaPagina.js` copiando el patrón de `Perfil.js`
2. Cambia el `apiGet("...")` por el nombre del recurso que corresponda
3. Agrégala en `src/App.js` dentro de `<Routes>`
4. Agrega el link en el arreglo `links` de `src/components/Layout.js`
5. En APIM, crea la operación + Response 200 + Mock policy para ese recurso

## 1. Subir a tu propio repo

```bash
cd lab2-demo
git init
git add .
git commit -m "init: app minima para lab 2"
git branch -M test          # el lab usa el branch "test"
git remote add origin <URL-de-tu-repo-vacio>
git push -u origin test
```

## 2. Conectar Azure Static Web Apps

1. En Azure, crea un nuevo recurso **Static Web App**.
2. Conéctalo a tu repo de GitHub, branch **test**.
3. Azure va a intentar crear su propio workflow y su propio secret
   `AZURE_STATIC_WEB_APPS_API_TOKEN_<algo>` en el repo.
4. **Importante (aquí fue donde se trabaron la vez pasada):** borra el
   workflow que Azure generó automáticamente en `.github/workflows/`
   (va a tener un nombre parecido a tu URL) y deja **solo** el archivo
   `azure-static-web-apps.yml` de este proyecto, para no tener 2 workflows
   compitiendo.
5. Copia el nombre del secret que Azure creó
   (`AZURE_STATIC_WEB_APPS_API_TOKEN_...`) y en el workflow de este repo
   cambia la línea:
   ```yaml
   azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
   ```
   por el nombre real que te dio Azure (o renombra el secret en GitHub para
   que coincida con `AZURE_STATIC_WEB_APPS_API_TOKEN`, como prefieras).

## 3. Crear el ambiente y las variables en GitHub

GitHub → tu repo → **Settings → Environments → New environment** → nómbralo
`test` (tiene que ser **exactamente igual** a la línea `environment: test`
del workflow).

Dentro de ese ambiente:

- **Environment variables** →
  - `REACT_APP_API_URL` = la URL base de tu Mock Service, ej:
    `https://tu-apim.azure-api.net/v1`
  - `REACT_APP_GOOGLE_CLIENT_ID` = el Client ID que generas en el paso 6
    (no es secreto, un Client ID de OAuth es público por diseño — por eso
    va en variables y no en secrets)

Ya **no se usa** `REACT_APP_API_KEY` / subscription key — la autenticación
ahora es con Google (ver más abajo).

## 4. Disparar el deploy

Haz un commit nuevo (o desde GitHub → Actions → re-run del último run) para
forzar que el workflow corra con las variables ya configuradas.

## 5. CORS en API Management

Si al abrir la URL de Static Web Apps ves un error de CORS en la consola:

API Management → tu API → versión → **All operations** → **Add policy** →
**Allow cross-origin resource sharing (CORS)** → Origin = la URL exacta de
tu Static Web App (sin `/` al final) → Allowed methods: **GET, POST, PUT
y DELETE** (ya usamos los cuatro) →
Allowed headers: `*` → Save.

## 6. Autenticación con Google (reemplaza la subscription key)

### 6.1 Crear el Client ID en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) → crea un
   proyecto nuevo (o usa uno existente) → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID**.
   - Si es la primera vez, te va a pedir configurar la "OAuth consent
     screen" antes: tipo **External**, nombre de la app, tu correo — para
     un proyecto de curso no hace falta verificarla, queda en modo "Testing".
3. Application type: **Web application**.
4. **Authorized JavaScript origins** → agrega la URL exacta de tu Static
   Web App (sin `/` al final):
   ```
   https://tu-app.azurestaticapps.net
   ```
   Agrega también `http://localhost:3000` si quieres probar en local.
5. No necesitas "Authorized redirect URIs" — el flujo usado (Google
   Identity Services, botón de "Sign in with Google") no redirige, abre un
   popup y devuelve el token directo al JavaScript.
6. Crea y copia el **Client ID** (termina en `.apps.googleusercontent.com`).
   Ese valor es `REACT_APP_GOOGLE_CLIENT_ID` del paso 3.

### 6.2 Configurar APIM para validar el token de Google

En vez de pedir `Ocp-Apim-Subscription-Key`, ahora APIM valida el ID token
(JWT) que Google le dio al usuario cuando inició sesión.

1. **Quitar la exigencia de subscription key**: tu API → **Settings** →
   desmarca **"Subscription required"** → Save. (Si no lo desmarcas, vas a
   seguir recibiendo 401 por falta de subscription key, además del que
   pueda dar el JWT.)
2. Tu API → **All operations** → Inbound processing → **Add policy** →
   busca **"Validate JWT"** (o edita el XML directo con el ícono `</>`) y
   pega, **antes** de la política de CORS que ya tenías:
   ```xml
   <validate-jwt header-name="Authorization" scheme="Bearer"
                 failed-validation-httpcode="401"
                 failed-validation-error-message="Token de Google inválido o ausente.">
       <openid-config url="https://accounts.google.com/.well-known/openid-configuration" />
       <audiences>
           <audience>TU_CLIENT_ID.apps.googleusercontent.com</audience>
       </audiences>
       <issuers>
           <issuer>https://accounts.google.com</issuer>
       </issuers>
   </validate-jwt>
   ```
   Reemplaza `TU_CLIENT_ID` por el Client ID real del paso 6.1.
3. El orden de las políticas en Inbound processing debe quedar:
   `validate-jwt` → `cors` → `mock-response` (cada operación individual
   sigue con su propio mock-response; CORS y validate-jwt van en
   "All operations" para que apliquen a todas).
4. Guarda y prueba en el tab **Test** de una operación — sin un token real
   de Google en el header `Authorization`, debería darte 401. No puedes
   probar un 200 desde el portal (no tienes un token de Google a mano
   ahí), pero sí desde tu app ya logueada.

### 6.3 Qué cambió en el frontend

- `src/auth.js` carga el script de Google, maneja el botón de login y
  guarda el ID token (dura ~1 hora, Google lo renueva solo mientras la
  pestaña siga abierta gracias a `auto_select`).
- `src/api.js` ahora manda `Authorization: Bearer <token>` en vez de
  `Ocp-Apim-Subscription-Key`.
- La app entera queda detrás de `LoginScreen` hasta que el usuario inicia
  sesión — revisa `src/App.js`.
- El sidebar y Perfil muestran el nombre/foto/correo **reales** de la
  cuenta de Google logueada, ya no los campos `nombre`/`correo` del mock
  `perfil` (esos dos campos del mock ya no se usan, pero no pasa nada si
  los dejas, simplemente se ignoran).
