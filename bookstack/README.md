# BookStack

Este plugin ofrece una vista de comprobación y un encabezado instalable para BookStack. Usa Mermaid 11.17.2 y reconoce `%% mermaid-bp:manual-layout` y `%% graph:positions` para conservar posiciones guardadas por el editor. Solo procesa diagramas `flowchart` o `graph` etiquetados; los demás bloques quedan disponibles para el visor habitual de BookStack.

## Compilar e instalar

Desde la raíz de este repositorio, ejecuta `npm install` y `npm run build`. Copia `dist/plugins/bookstack/` completa en `dist/plugins/bookstack/` de una distribución compilada de Mermaid BP. La distribución existente del editor no necesita reconstruirse. Para retirar BookStack, elimina esa carpeta.

El archivo `bookstack-header.html` se puede pegar en el campo de HTML del encabezado de BookStack. Comprueba que la política CSP permite módulos ES y conexiones al CDN de jsDelivr. Como alternativa, aloja Mermaid 11.17.2 en tu propio origen y ajusta el URL del CDN en `build.mjs`.

## Contrato

El manifiesto conserva `apiVersion: 1`. El plugin declara sus acciones a través de `context.ui` y recibe el documento por un canal temporal en memoria. El visor web y el encabezado se construyen con módulos y recursos incluidos aquí; no importan rutas del editor.

## Pruebas

`npm test` comprueba que el paquete sea propio y no dependa de módulos privados del editor. `npm run test:browser` comprueba el preview compilado, el filtrado de bloques y las posiciones guardadas.

## Licencia

El código original está bajo AGPL-3.0-only. Conserva `LICENSE`, `NOTICE.md` y `THIRD_PARTY_NOTICES.md` cuando distribuyas el plugin.
