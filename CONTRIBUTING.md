# Contribuir

Gracias por ayudar a Mermaid BP. Antes de implementar un cambio, elige el repositorio según el alcance:

- **Integración con una aplicación o servicio**, como BookStack: contribuye en [cayetanobp/mermaid-bp-plugins](https://github.com/cayetanobp/mermaid-bp-plugins).
- **Función genérica del editor**, contrato de plugins o comportamiento compartido del núcleo: contribuye en [cayetanobp/mermaid-bp](https://github.com/cayetanobp/mermaid-bp).

Si una propuesta toca ambos repositorios, describe primero el contrato o cambio necesario en el núcleo y enlaza las propuestas relacionadas. En este repositorio, cada plugin vive en `plugins/<nombre>/` y mantiene allí su código, guía y pruebas en `tests/`. El `package.json` del plugin declara su script `test`; si requiere compilación o pruebas de navegador, declara también `build` o `test:browser`. Los comandos de la raíz ejecutan los scripts de los workspaces descubiertos en `plugins/`. Una propuesta puede modificar varios plugins cuando el cambio los abarque; los cambios de infraestructura compartida pueden modificar los archivos de la raíz, `scripts/` o `.github/`.

## Flujo de trabajo

1. Abre un issue en el repositorio adecuado usando la plantilla correspondiente. Incluye el problema, resultado esperado, pasos para reproducir si aplica y entorno relevante.
2. Haz fork de ese repositorio en GitHub y clónalo localmente.
3. Actualiza la rama principal de tu fork y crea una rama descriptiva, por ejemplo `docs/bookstack-header` o `fix/plugin-cleanup`.
4. Realiza el cambio en el repositorio correcto. Para este repositorio, revisa los scripts disponibles en `package.json`; ejecuta las comprobaciones pertinentes y describe sus resultados. No incluyas `dist/` generado salvo que la propuesta lo requiera expresamente.
5. Crea commits con mensajes claros y envía la rama a tu fork.
6. Abre una Pull Request desde tu rama del fork hacia `main` del repositorio original correspondiente. Completa la plantilla, enlaza el issue y explica verificaciones y capturas relevantes.

Las PR de integraciones se dirigen a `cayetanobp/mermaid-bp-plugins`; las de funciones del editor se dirigen a `cayetanobp/mermaid-bp`. No envíes cambios de integración al repositorio del núcleo solo porque el plugin use su API.

## Calidad y licencias

Actualiza la documentación del plugin junto con cambios visibles en instalación, uso o compatibilidad. No incorpores módulos privados del núcleo en un paquete de plugin. Al redistribuir, conserva los avisos de licencia y documenta las dependencias o recursos de terceros conforme a `NOTICE.md` y los avisos del paquete.
