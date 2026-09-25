# Lab 2 demo — Static Web App + CI/CD

App mínima en React que muestra "Productos" consumiendo un Mock Service de
Azure API Management. Pensada para practicar el flujo completo del Lab 2
sin repetir el error de los 2 workflows en conflicto.

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
