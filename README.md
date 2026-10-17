# Mermaid BP Plugins

Repositorio de extensiones propias de Mermaid BP. Cada carpeta de plugin contiene su código fuente, manifiesto, build, pruebas y avisos legales. La salida compilada se puede copiar a `dist/plugins/` de una distribución de Mermaid BP ya construida.

## BookStack

BookStack es compatible con el contrato de plugins v1 y se compila de manera autónoma desde [`bookstack/`](bookstack/README.md). `npm run build` genera la carpeta completa en `dist/plugins/bookstack/`, la vista de prueba y el encabezado HTML. No hace falta recompilar el editor para instalar o retirar la carpeta.

## Desarrollo

Necesita Node.js 22.18 o posterior.

```sh
npm install
npm test
npm run build
npm run test:browser
```

## Licencia

El código original se distribuye bajo GNU AGPL versión 3 únicamente (`AGPL-3.0-only`). El texto completo está en `LICENSE`. Consulta `NOTICE.md`; las dependencias y recursos de terceros conservan sus propias licencias, reproducidas en los avisos de cada paquete.
