# Mermaid BP Plugins

Repositorio de plugins oficiales para Mermaid BP. Cada plugin se mantiene como una carpeta autónoma y se distribuye con JavaScript listo para el navegador, manifiesto, recursos y avisos legales. Los plugins usan la API pública del editor; no dependen de módulos privados del núcleo.

## Instalar un plugin

1. Descarga o compila el plugin y conserva completa su carpeta de paquete, incluidos `plugin.json`, recursos y avisos.
2. Copia la carpeta dentro de `plugins/` de la distribución web de Mermaid BP. Por ejemplo, el paquete BookStack va en `dist/plugins/bookstack/`.
3. Recarga Mermaid BP y abre **Extensiones** para activarlo o desactivarlo.

En una instalación web, la instalación, actualización y retirada de carpetas corresponde al administrador del servidor. La interfaz solo permite gestionar la activación de los plugins ya disponibles. Para retirarlo, el administrador elimina su carpeta y se recarga la aplicación. En escritorio, sigue la función de instalación de **Extensiones** disponible en esa versión.

## Estructura del repositorio

```text
bookstack/       Código, manifiesto, recursos, pruebas y guía del plugin BookStack
scripts/         Herramientas compartidas de empaquetado y avisos
dist/            Salida generada por la compilación (no se versiona)
```

Cada carpeta de plugin incluye su propio `README.md`, `plugin.json`, punto de entrada y archivos necesarios para compilarlo. Los recursos de terceros y sus licencias se documentan junto al paquete.

## API pública y compatibilidad

El contrato público actual es la API v1 del núcleo. El plugin declara `apiVersion: 1` en `plugin.json`; el editor ejecuta plugins cuya versión de API admite y muestra como incompatibles las demás. El identificador debe coincidir con el nombre de carpeta. El punto de entrada predeterminado es `index.js` y exporta un objeto con `setup(context)`. Puede ser asíncrono y devolver una función de limpieza.

El contexto público ofrece:

- `context.apiVersion`: versión del contrato.
- `context.document.read()`: instantánea inmutable del código y nombre del documento.
- `context.document.subscribe(listener)`: observa cambios y devuelve una función para retirar la suscripción.
- `context.ui.addAction(action)`: añade un botón o enlace y devuelve una función para retirarlo.
- `context.ui.addGuideStep(step)`: añade un paso a la guía y devuelve una función para retirarlo.
- `context.ui.notify(message)`: muestra un aviso en el editor.

Al desactivar un plugin, el editor limpia sus acciones, suscripciones y pasos, y ejecuta la limpieza que haya devuelto `setup`. La API organiza las aportaciones, pero no aísla el código: los plugins ejecutan código con los permisos de la aplicación. Consulta `bookstack/README.md` para los requisitos específicos de esa integración.

## Catálogo

| Plugin | Finalidad | Guía |
| --- | --- | --- |
| BookStack | Vista previa y publicación de diagramas con posiciones y estilos Mermaid BP | [bookstack/README.md](bookstack/README.md) |

## Desarrollo y compilación

Requiere Node.js 22.18 o posterior.

```sh
npm install
npm run build
```

El comando real `npm run build` construye el workspace BookStack. Genera el paquete completo en `dist/plugins/bookstack/` y los artefactos de compatibilidad `dist/bookstack-header.html`, `dist/bookstack.html` y `dist/bookstack-viewer.js`. La carpeta `dist/plugins/bookstack/` puede copiarse a otra distribución ya compilada; no es necesario reconstruir el editor.

Los comandos disponibles para verificaciones automatizadas son `npm test` y `npm run test:browser`; consulta los scripts de `package.json` antes de usarlos.

## Contribuir

Antes de abrir una propuesta, identifica si el cambio pertenece a una integración concreta o al editor genérico. Sigue [CONTRIBUTING.md](CONTRIBUTING.md) y usa las plantillas de [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE/) o [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md). Las integraciones se proponen en [cayetanobp/mermaid-bp-plugins](https://github.com/cayetanobp/mermaid-bp-plugins); las funciones genéricas del editor, en [cayetanobp/mermaid-bp](https://github.com/cayetanobp/mermaid-bp).

## Licencia

El código original se distribuye bajo GNU AGPL versión 3 únicamente (`AGPL-3.0-only`). Consulta `LICENSE` y `NOTICE.md`. Las dependencias y recursos de terceros conservan sus licencias, indicadas en los avisos del paquete correspondiente.
