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
APIM (mismo patrón del Lab 1, repetido por cada uno). Ejemplos de JSON para
el Sample/Definition de cada mock:

**`resumen`**
```json
{
  "disponible": 83090,
  "gastado": 46910,
  "meta": 130000,
  "ultimoMovimiento": { "descripcion": "Frijoles + aceite · Autoservicio La Guaria", "monto": 4200 }
}
```

**`precios`**
```json
[
  { "id": 1, "tienda": "Autoservicio La Guaria", "zona": "Goicoechea", "precio": 2490, "reportes": 88 },
  { "id": 2, "tienda": "Súper El Roble", "zona": "Sabana", "precio": 2680, "reportes": 64 }
]
```

**`gastos`**
```json
[
  { "id": 1, "descripcion": "Frijoles + aceite", "monto": 4200, "categoria": "Despensa", "fecha": "2026-05-14" }
]
```

**`plan`**
```json
{
  "meta": 130000,
  "categorias": [
    { "nombre": "Despensa", "presupuesto": 50000 },
    { "nombre": "Transporte", "presupuesto": 30000 }
  ]
}
```

**`perfil`**
```json
{ "nombre": "Ana Estudiante", "universidad": "TEC", "carrera": "Ingeniería" }
```

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
