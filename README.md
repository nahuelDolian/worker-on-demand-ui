# worker-on-demand-ui (frontend)

Mobile app (React Native / Expo). Contiene la app que antes estaba en la carpeta `mobile` del repo original.

Quick start
- Node 18+ y npm
- npm install
- npm start    # o `expo start` según scripts
- Ver scripts en package.json para iOS/Android

Branching: main es la rama de release.

## Alcance

Este repositorio contiene la app móvil (React Native / Expo). Alcance detectado:

- Flujos principales: onboarding de worker y check-in.
- APIs consumidas: revisar src/api/checkInApi.ts y src/api/workerOnboardingApi.ts para URIs y contratos.
- UI componetizado en src/components/ui.
- Scripts: usar package.json scripts para iniciar y construir la app.

Notas: Este repo depende del backend en https://github.com/nahuelDolian/worker-on-demand para servicios y APIs.

