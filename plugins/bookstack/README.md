# Plugin BookStack

Este plugin aporta una vista de comprobación y un visor para publicar diagramas Mermaid BP en BookStack respetando las posiciones y estilos manuales. El paquete incluye también un encabezado HTML para procesar esos diagramas en las páginas publicadas.

## Requisitos

- Mermaid BP con soporte para plugins de API v1 (`apiVersion: 1`).
- Para la vista previa, acceso a **Extensiones** en Mermaid BP.
- Para el encabezado de BookStack, permiso para editar el encabezado HTML global y una política de seguridad de contenido (CSP) que autorice el módulo ES inline generado, sus módulos importados y la descarga de Mermaid 11.17.2 desde jsDelivr.
- Para compilar desde fuentes: Node.js 22.18 o posterior.

## Instalar en Mermaid BP

Desde la raíz de este repositorio, ejecuta `npm ci` y `npm run build`. Copia la carpeta completa `dist/plugins/bookstack/` a `plugins/bookstack/` dentro de la distribución web ya compilada de Mermaid BP. Por ejemplo, en una distribución cuyo directorio publicado es `dist/`, el destino es `dist/plugins/bookstack/`. No es necesario reconstruir el editor.

Recarga Mermaid BP y activa **BookStack** en **Extensiones**. La vista previa sirve para comprobar el diagrama antes de publicarlo. Para retirar el plugin, elimina la carpeta `plugins/bookstack/` de la distribución y recarga.

También puedes instalar la release lista para usar: descarga `bookstack-v1.0.0.zip` y `bookstack-v1.0.0.zip.sha256` desde [Releases](https://github.com/cayetanobp/mermaid-bp-plugins/releases/tag/bookstack-v1.0.0), comprueba el SHA256 y extrae la carpeta `bookstack/` bajo `plugins/` en la distribución de Mermaid BP. La release enlaza la beta compatible del núcleo y declara la compatibilidad mediante `apiVersion: 1`.

## Instalar el encabezado en BookStack

La compilación produce `dist/plugins/bookstack/bookstack-header.html` y también copia el mismo archivo a `dist/bookstack-header.html`. Copia **todo el contenido** de `dist/plugins/bookstack/bookstack-header.html` y pégalo en el campo de HTML header global de la configuración de BookStack. Guarda la configuración y prueba una página con un bloque de código Mermaid.

El encabezado identifica exclusivamente bloques Mermaid que contengan el comentario `%% mermaid-bp:manual-layout` y cuyo tipo de diagrama sea `flowchart` o `graph`. Solo esos bloques se procesan con la disposición manual de Mermaid BP. Los demás bloques Mermaid quedan al visor habitual de BookStack, sin intervención del encabezado.

El archivo generado contiene un `<script type="module">` inline y carga Mermaid 11.17.2 desde `https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs`. La CSP del sitio debe autorizar ese script inline (por ejemplo, con el nonce o hash que admita la política de BookStack), los módulos que este importa y las conexiones necesarias a `cdn.jsdelivr.net`. Si la política de seguridad no permite ese CDN, puedes alojar esa versión en un origen propio y modificar la URL de jsDelivr en `plugins/bookstack/build.mjs` antes de compilar el encabezado.

## Límites

- El layout manual se aplica solo a `flowchart`/`graph` que llevan `%% mermaid-bp:manual-layout`; no modifica otros tipos ni bloques Mermaid sin esa marca.
- El resto de diagramas depende del visor habitual disponible en BookStack.
- La integración del encabezado requiere acceso de administración a la configuración global de BookStack y una CSP compatible con el módulo inline y sus fuentes.
- El encabezado requiere conectividad a jsDelivr salvo que se configure un alojamiento propio de Mermaid 11.17.2.
- La API de plugins no es un límite de seguridad: el código del plugin se ejecuta con los permisos de Mermaid BP.

## Desarrollo y contrato

El manifiesto declara `apiVersion: 1`. La entrada registra sus acciones mediante `context.ui`, y el documento se recibe por un canal temporal en memoria. El visor web y el encabezado se compilan con módulos y recursos de este paquete, sin importar rutas privadas del editor.

Comandos definidos por el repositorio:

```sh
npm run build
npm test
npm run test:browser
```

Consulta los scripts de `package.json` para el alcance de cada comando. Conserva `LICENSE`, `NOTICE.md` y `THIRD_PARTY_NOTICES.md` al redistribuir el plugin. El código original está bajo AGPL-3.0-only; las dependencias y recursos de terceros mantienen sus licencias indicadas en los avisos.
