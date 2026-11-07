# Lab 2 demo — Static Web App + CI/CD

App en React con varias páginas (Productos, Perfil, Comparar, Portal) que
consumen distintos endpoints de Mock Services en Azure API Management.
Pensada para practicar el flujo completo del Lab 2 sin repetir el error de
los 2 workflows en conflicto.


## Variables de entorno (Fase II: un microservicio por API)

`REACT_APP_API_URL` es la **base por defecto**, hasta la versión y SIN el
recurso al final: `https://tu-apim.azure-api.net/v1`. Sirve mientras todo
esté en una sola API de APIM (por ejemplo, con mocks).

Cuando cada microservicio tenga su propia API en APIM, cada uno puede tener
su base. Si una variable no está, usa `REACT_APP_API_URL`:

| Variable | Recursos que atiende |
|---|---|
| `REACT_APP_API_URL_GASTOS_PLAN` | `gastos`, `plan`, `resumen` |
| `REACT_APP_API_URL_NOTIFICACIONES` | `notificaciones` |
| `REACT_APP_API_URL_PERFIL` | `perfil` |
| `REACT_APP_API_URL_PRECIOS` | `precios` |
| `REACT_APP_API_URL_PERFIL_PRECIOS` | respaldo para `perfil` y `precios` si falta su variable propia |

El mapa recurso → microservicio está en `src/api.js`. Se configuran en el
Environment `test` de GitHub, igual que `REACT_APP_API_URL`.

## Contrato de la API (Fase II)

Todas las rutas van bajo `/v1`, con `Authorization: Bearer <Google JWT>`.

| Ruta | Página | Recurso (microservicio) |
|---|---|---|
| `/` | Panel | GET `resumen` (Gastos y Plan) + GET `precios?producto=…&page=0&size=3` (Perfil y Precios) |
| `/comparar` | Comparar | GET `precios?producto=&page=&size=` (Perfil y Precios) |
| `/registrar` | Registrar | GET `gastos?page=&size=&q=`, POST `gastos`, PATCH/DELETE `gastos/{id}` (Gastos y Plan) |
| `/plan` | Plan | GET `plan`, PATCH `plan` (Gastos y Plan) |
| `/perfil` | Perfil | GET `perfil`, PATCH `perfil` (Perfil y Precios) |
| (campana) | Notificaciones | GET `notificaciones?page=&size=`, PATCH `notificaciones/{id}` (Notificaciones) |

Reglas comunes:

- **Paginación:** página base **0**. Respuesta
  `{ "content": [...], "page": 0, "size": 10, "totalElements": 42, "totalPages": 5 }`.
  El frontend pide **una página a la vez** (nunca todo el historial). La
  búsqueda de gastos va al servidor con `?q=`.
- **PATCH, no PUT:** editar gastos, plan y perfil manda solo los campos que
  cambian. Perfil: `nombre`, `universidad`, `quincenaDias`, `preferencias`.
  Plan: `meta` y/o `categorias` (arreglo completo).
- **Fechas:** Epoch en milisegundos (UTC). El frontend las muestra en la zona
  horaria del dispositivo (`formatFecha` en `src/format.js`; si llega un
  texto como "Hoy", lo muestra tal cual, y un valor menor a 1e11 lo toma como
  segundos por si el profe lo pide así).
- **Errores:** `{ "status": 500, "message": "...", "correlationId": "..." }`.
  El frontend usa el `status`.

### Muestras para los mocks de APIM

Mientras los microservicios no estén, estos son los Samples de cada
operación (Response 200 + mock-response):

**`resumen`** (GET) — ya no trae `nombre`, `quincenaLabel` ni `radarTop3`
```json
{
  "disponible": 87400,
  "gastado": 62600,
  "meta": 150000,
  "mensaje": "Vas bien: te quedan ₡5 830 por día hasta el 30.",
  "ultimosMovimientos": [
    { "id": "1", "descripcion": "Café del parqueo", "monto": 1200, "categoria": "Antojos", "fecha": 1793500000000 },
    { "id": "2", "descripcion": "Pasaje bus San Pedro", "monto": 430, "categoria": "Transporte", "fecha": 1793413600000 }
  ]
}
```

**`precios`** (GET `precios?producto=...&page=0&size=3`)
```json
{
  "content": [
    { "id": "1", "tienda": "Pali San Pedro", "zona": "San Pedro", "precio": 785, "reportes": 14 },
    { "id": "2", "tienda": "Mas x Menos Montes de Oca", "zona": "Montes de Oca", "precio": 820, "reportes": 9 }
  ],
  "page": 0, "size": 3, "totalElements": 2, "totalPages": 1
}
```

**`gastos`**
- GET `/gastos` (con `page`, `size`, `q` en el query; el mock puede ignorarlos)
  ```json
  {
    "content": [
      { "id": "1", "descripcion": "Café del parqueo", "monto": 1200, "categoria": "Antojos", "fecha": 1793500000000 },
      { "id": "2", "descripcion": "Pasaje bus San Pedro", "monto": 430, "categoria": "Transporte", "fecha": 1793413600000 }
    ],
    "page": 0, "size": 5, "totalElements": 2, "totalPages": 1
  }
  ```
- POST `/gastos` → el mock puede devolver `{ "ok": true }`.
- **PATCH** `/gastos/{id}` → `{ "ok": true }`. (En APIM, la operación nueva usa
  `/gastos/{id}`; borra la PUT.)
- DELETE `/gastos/{id}` → `{ "ok": true }`.

**`plan`** (GET y **PATCH**)
```json
{
  "meta": 150000,
  "categorias": [
    { "nombre": "Comida", "gastado": 38200, "presupuesto": 60000 },
    { "nombre": "Transporte", "gastado": 9460, "presupuesto": 20000 }
  ]
}
```
"Editar meta" manda `PATCH /plan {"meta": ...}`; "+ Agregar categoría" manda
`PATCH /plan {"categorias": [...]}` con el arreglo completo.

**`perfil`** (GET y **PATCH**) — `nombre` y `quincenaDias` (arreglo) son nuevos
```json
{
  "nombre": "",
  "universidad": "TEC San Carlos",
  "quincenaDias": [1, 15],
  "racha": 6,
  "insignias": ["Primera quincena completa", "10 reportes de precios", "Racha de 7 días"],
  "preferencias": { "tema": "light" },
  "logoUrl": "/logo.png"
}
```
`nombre` vacío = se usa el nombre de la cuenta de Google. El correo y la foto
salen siempre de Google y no son editables. `preferencias.tema` guarda el
tema claro/oscuro (se aplica al entrar).

**`notificaciones`** (GET paginado y PATCH)
```json
{
  "content": [
    { "id": "1", "tipo": "PRESUPUESTO_80", "titulo": "Presupuesto de Transporte", "mensaje": "Te queda poco presupuesto en Transporte esta quincena.", "leida": false, "fecha": 1793500000000 },
    { "id": "2", "tipo": "PRECIO", "titulo": "Bajó el precio", "mensaje": "El arroz Tío Pelón bajó de precio en Pali San Pedro.", "leida": true, "fecha": 1793413600000 }
  ],
  "page": 0, "size": 10, "totalElements": 2, "totalPages": 1
}
```
PATCH `/notificaciones/{id}` con `{"leida": true}` (al tocar una no leída). El
punto rojo de la campana aparece si alguna de las **cargadas** está sin leer.
La campana pide de a 10 y "Cargar más" trae la siguiente página. Lo que llegue
en tiempo real (SignalR, pendiente) entra arriba con `prepend` de
`src/hooks/useNotificaciones.js`.

## Errores que no estorban

- **Error de una acción** (guardar, editar, borrar, marcar leída): un toast
  abajo a la derecha que se cierra solo (6 s; los de éxito 3 s) y tiene "×".
  No tapa la pantalla ni bloquea nada; el formulario queda abierto para
  reintentar. Ver `src/components/Toast.js`.
- **Error de carga** de una pantalla: una franja de una línea con
  "Reintentar" (`src/components/ErrorStrip.js`). Si ya había datos, se siguen
  viendo; si no, solo falta esa parte (en el Panel, "Últimos movimientos" y
  "Radar de precios" fallan por separado porque vienen de servicios distintos).
- La pantalla completa de error solo queda para rutas inexistentes (404).

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
  "logoUrl": "/logo.png"
  ```
  (lo agregas dentro del mismo JSON de `perfil` que ya tienes, junto a
  `nombre`, `racha`, etc.)
- **Pantalla de login (antes de autenticarse):** ahí todavía no hay
  sesión ni token para llamarle a ningún mock, así que `LoginScreen.js`
  usa `<Logo size={48} />` sin `src`, lo que cae automáticamente al
  archivo local `public/logo.png`. Es la única excepción razonable: el
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

1. Crea `src/pages/NuevaPagina.js` copiando el patrón de `Panel.js`
2. Cambia el `apiGet("...")` por el nombre del recurso que corresponda y,
   si es un recurso nuevo, agrégalo a `SERVICIO_POR_RECURSO` en `src/api.js`
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
tu Static Web App (sin `/` al final) → Allowed methods: **GET, POST, PATCH
y DELETE** (¡PATCH es obligatorio en Fase II: sin él el navegador bloquea editar gastos, plan y perfil!) →
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
  `Ocp-Apim-Subscription-Key`, y expone `apiGet`, `apiPost`, `apiPatch` y
  `apiDelete` (ya no hay `apiPut`).
- La app entera queda detrás de `LoginScreen` hasta que el usuario inicia
  sesión — revisa `src/App.js`.
- La foto y el correo son siempre los de la cuenta de Google. El nombre que
  se muestra es `perfil.nombre` (editable en Perfil) y, si está vacío, el de
  Google.
