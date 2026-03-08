Original prompt: si lo se es un juego mio, quiero que hagas un analisis completo en busca de busg

2026-03-08
- Iniciada revision completa del proyecto WARISK.FUN con enfoque de bugs funcionales y tecnicos.
- Confirmado: npm.cmd run build compila correctamente en entorno sin sandbox.
- Confirmado: npm.cmd run lint reporta problemas reales en src/App.jsx (refs en render, catches vacios, deps de effects, props sin usar).
- Pendiente: levantar la app y validar interacciones clave en navegador.

- Reproducido bug severo: los strikes con impacto diferido (`drone`, `missile`, `nuke`) sobreviven al `ABORT` y pueden mutar una partida nueva iniciada despues.
- Reproducido bug severo: el mapa depende de `https://cdn.jsdelivr.net/.../countries-110m.json`; si falla esa peticion, el juego queda bloqueado indefinidamente en `LOADING WORLD MAP...`.
- Reproducido bug funcional: `goToGame()` limpia `warisk_save` pero no actualiza `hasSave`; el menu puede seguir mostrando `CONTINUE OPERATION` aunque ya no exista save y el boton no hace nada.
- Pruebas en navegador realizadas con Playwright local y capturas guardadas en `output/`.
- Fix aplicado: `goToGame()` y `resumeGame()` ahora sincronizan `hasSave` con `localStorage`, eliminando el boton fantasma de continue.
- Fix aplicado: los impactos diferidos de strikes y las animaciones temporizadas ahora usan un registro de timeouts con cleanup al desmontar `GameScreen`.
- Fix aplicado: el mapa usa `world-atlas/countries-110m.json` desde el bundle local en vez de depender del CDN en runtime.
- Validado: ya no aparece `CONTINUE OPERATION` tras iniciar y abortar una partida nueva sin save.
- Validado: un strike lanzado antes de `ABORT` ya no modifica una partida nueva.
- Validado: el juego sigue mostrando el mapa aunque se bloquee la URL antigua `countries-110m.json`.
- Nota: `npm.cmd run build` pasa. `npm.cmd run lint` sigue fallando por problemas previos en `src/App.jsx` no relacionados directamente con estos tres bugs.
