# Mermaid BP Plugins

Repositorio de plugins oficiales para Mermaid BP. Cada plugin se mantiene como una carpeta autónoma y se distribuye con JavaScript listo para el navegador, manifiesto, recursos y avisos legales. Los plugins usan la API pública del editor; no dependen de módulos privados del núcleo.

## Instalar un plugin

1. Descarga o compila el plugin y conserva completa su carpeta de paquete, incluidos `plugin.json`, recursos y avisos.
2. Copia la carpeta dentro de `plugins/` de la distribución web de Mermaid BP. Por ejemplo, el paquete BookStack va en `dist/plugins/bookstack/`.
3. Recarga Mermaid BP y abre **Extensiones** para activarlo o desactivarlo.

La release de BookStack para Mermaid BP 1.0.0-beta.1 incluye un ZIP instalable, SHA256 y un manifiesto de compatibilidad. Descarga `bookstack-v1.0.0.zip` desde [Releases](https://github.com/cayetanobp/mermaid-bp-plugins/releases/tag/bookstack-v1.0.0), verifica el archivo `.sha256` y copia la carpeta `bookstack/` extraída a `plugins/`. El paquete declara `apiVersion: 1`; es compatible con la beta del núcleo que también usa API v1. La guía detallada está en [BookStack](plugins/bookstack/README.md).

Para publicar, la release beta enlazada del core ya debe existir y su repositorio debe ser público para que el workflow pueda verificarla mediante la API anónima de GitHub. Si el core sigue privado, la verificación falla y el workflow no publica el plugin.

En una instalación web, la instalación, actualización y retirada de carpetas corresponde al administrador del servidor. La interfaz solo permite gestionar la activación de los plugins ya disponibles. Para retirarlo, el administrador elimina su carpeta y se recarga la aplicación. En escritorio, sigue la función de instalación de **Extensiones** disponible en esa versión.

## Estructura del repositorio

```text
plugins/<nombre>/ Código, manifiesto, recursos, pruebas y guía de cada plugin
scripts/          Herramientas compartidas de empaquetado y avisos
dist/             Salida generada por la compilación (no se versiona)
```

Cada carpeta de `plugins/` incluye su propio `README.md`, `plugin.json`, punto de entrada, pruebas y archivos necesarios para compilarlo. Las contribuciones centradas en plugins añaden o modifican sus carpetas. Los cambios de infraestructura compartida pueden actualizar los archivos de la raíz, `scripts/` y `.github/`. Una propuesta puede incluir varios plugins cuando el cambio abarque más de uno. Los recursos de terceros y sus licencias se documentan junto al paquete.

## API pública y compatibilidad

El contrato público actual es la API v1 del núcleo. El plugin declara `apiVersion: 1` en `plugin.json`; el editor ejecuta plugins cuya versión de API admite y muestra como incompatibles las demás. El identificador debe coincidir con el nombre de carpeta. El punto de entrada predeterminado es `index.js` y exporta un objeto con `setup(context)`. Puede ser asíncrono y devolver una función de limpieza.

El contexto público ofrece:

- `context.apiVersion`: versión del contrato.
- `context.document.read()`: instantánea inmutable del código y nombre del documento.
- `context.document.subscribe(listener)`: observa cambios y devuelve una función para retirar la suscripción.
- `context.ui.addAction(action)`: añade un botón o enlace y devuelve una función para retirarlo.
- `context.ui.addGuideStep(step)`: añade un paso a la guía y devuelve una función para retirarlo.
- `context.ui.notify(message)`: muestra un aviso en el editor.

Al desactivar un plugin, el editor limpia sus acciones, suscripciones y pasos, y ejecuta la limpieza que haya devuelto `setup`. La API organiza las aportaciones, pero no aísla el código: los plugins ejecutan código con los permisos de la aplicación. Consulta `plugins/bookstack/README.md` para los requisitos específicos de esa integración.

## Catálogo

| Plugin | Finalidad | Guía |
| --- | --- | --- |
| BookStack | Vista previa y publicación de diagramas con posiciones y estilos Mermaid BP | [plugins/bookstack/README.md](plugins/bookstack/README.md) |

## Desarrollo y compilación

Requiere Node.js 22.18 o posterior.

```sh
npm ci
npm run build
```

El comando `npm run build` construye cada plugin que declara ese script, incluido BookStack en `plugins/bookstack/`. Genera el paquete completo en `dist/plugins/bookstack/` y los artefactos de compatibilidad `dist/bookstack-header.html`, `dist/bookstack.html` y `dist/bookstack-viewer.js`. La carpeta `dist/plugins/bookstack/` puede copiarse a otra distribución ya compilada; no es necesario reconstruir el editor.

`npm test` ejecuta las pruebas declaradas por cada workspace de plugin. `npm run test:browser` ejecuta los scripts de navegador declarados por los plugins que los necesitan. `npm run build` compila cada workspace que declara un script `build`.

## Contribuir

Antes de abrir una propuesta, identifica si el cambio pertenece a una integración concreta o al editor genérico. Sigue [CONTRIBUTING.md](CONTRIBUTING.md) y usa las plantillas de [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE/) o [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md). Las integraciones se proponen en [cayetanobp/mermaid-bp-plugins](https://github.com/cayetanobp/mermaid-bp-plugins); las funciones genéricas del editor, en [cayetanobp/mermaid-bp](https://github.com/cayetanobp/mermaid-bp).

## CI

Las PR requieren `Plugin CI / Plugin package` y `Plugin CI / Clean core compatibility`. El segundo trabajo usa la acción compartida del núcleo (fijada a un commit), construye una distribución limpia, instala el paquete generado y comprueba su activación, vista previa, retirada y aislamiento de manifiestos inválidos en el navegador. Mientras ambos repositorios sean privados, GitHub Actions del núcleo permite el acceso entre repositorios privados del mismo propietario; al publicar ambos, el flujo puede ejecutarse también desde forks.

## Licencia

El código original se distribuye bajo GNU AGPL versión 3 únicamente (`AGPL-3.0-only`). Consulta `LICENSE` y `NOTICE.md`. Las dependencias y recursos de terceros conservan sus licencias, indicadas en los avisos del paquete correspondiente.
