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

## Páginas y recursos de este proyecto (EstudiAmb...)

| Ruta | Página | Recurso en APIM |
|---|---|---|
| `/` | Panel | GET `resumen` |
| `/comparar` | Comparar | GET `precios` |
| `/registrar` | Registrar | GET/POST `gastos` |
| `/plan` | Plan | GET `plan` |
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

**`gastos`** (GET para historial, POST para registrar uno nuevo)
```json
[
  { "id": 1, "descripcion": "Café del parqueo", "monto": 1200, "categoria": "Antojos", "fecha": "Hoy" },
  { "id": 2, "descripcion": "Pasaje bus San Pedro", "monto": 430, "categoria": "Transporte", "fecha": "Ayer" }
]
```
Para el POST, el mock puede devolver simplemente `{ "ok": true }`.

**`plan`** (GET)
```json
{
  "meta": 150000,
  "categorias": [
    { "nombre": "Comida", "gastado": 38200, "presupuesto": 60000 },
    { "nombre": "Transporte", "gastado": 9460, "presupuesto": 20000 }
  ]
}
```

**`perfil`** (GET, usado también en el sidebar/header de TODAS las páginas)
```json
{
  "nombre": "María Fernanda Solís",
  "correo": "mafe.solis@ucr.ac.cr",
  "universidad": "UCR · Rodrigo Facio",
  "quincenaDias": "Días 15 y 30 de cada mes",
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

## Reglas de formularios

- Los botones "Buscar" (Comparar) y "Guardar gasto" (Registrar) están
  **deshabilitados hasta que los campos obligatorios estén completos** —
  no solo muestran un error al hacer click, no se pueden presionar antes.
- Los campos obligatorios llevan un asterisco (`*`) junto a la etiqueta, y
  cada formulario tiene una nota "* Campos obligatorios" debajo del botón.

## Agregar una página nueva

1. Crea `src/pages/NuevaPagina.js` copiando el patrón de `Perfil.js`
2. Cambia el `apiGet("...")` por el nombre del recurso que corresponda
3. Agrégala en `src/App.js` dentro de `<Routes>`
4. Agrega el link en `src/components/Navbar.js`
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

- **Environment variables** → `REACT_APP_API_URL` = la URL completa de tu
  Mock Service, ej: `https://tu-apim.azure-api.net/v1/products`
- **Environment secrets** → `REACT_APP_API_KEY` = tu Subscription key de
  APIM

## 4. Disparar el deploy

Haz un commit nuevo (o desde GitHub → Actions → re-run del último run) para
forzar que el workflow corra con las variables ya configuradas.

## 5. CORS en API Management

Si al abrir la URL de Static Web Apps ves un error de CORS en la consola:

API Management → tu API → versión → **All operations** → **Add policy** →
**Allow cross-origin resource sharing (CORS)** → Origin = la URL exacta de
tu Static Web App (sin `/` al final) → Allowed methods: GET (agrega más
según lo que necesites) → Save.

Con eso la página "Productos" debería mostrar los items del Mock Service.
