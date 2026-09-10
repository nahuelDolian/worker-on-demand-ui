# Spec: Persistencia y Resiliencia del Onboarding

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §5.1/§6 de este repo
**Estado actual:** `useOnboardingStore` (Zustand) mantiene `step`, `workerId`, `personalInfo`, `identityUpload` y `mercadoPagoLinked` **solo en memoria**. Si la app se cierra o crashea a mitad del onboarding, todo eso se pierde.

## Contexto
El onboarding ya crea un `User` real en el backend en el primer paso (`registerWorkerPersonalInfo` → `POST /api/workers`). Si el trabajador cierra la app después de eso pero antes de terminar, hoy: (a) pierde el `workerId` que tenía guardado localmente, y (b) al reabrir la app, vuelve a `PersonalInfoStep` desde cero — lo que probablemente intente registrar de nuevo el mismo email/CUIT y falle (o, peor, si el backend no valida duplicados de forma estricta, cree un segundo usuario huérfano).

## Objetivo
Que el progreso del onboarding sobreviva a que la app se cierre, y que si el trabajador ya tiene un `workerId` de un intento anterior, la app lo detecte y lo lleve a continuar en el paso correcto en vez de arrancar de cero.

## Fuera de alcance
- Cambiar el backend para soportar "reanudar" un registro — si hace falta un endpoint nuevo para esto (ej. "¿ya existe un worker con este email/CUIT, y en qué paso quedó?"), es una decisión a tomar junto con el backend, anotada en decisiones pendientes.

## Historias de usuario
- Como trabajador que cerró la app a mitad del onboarding, quiero que al volver a abrirla me lleve a donde quedé, no que tenga que empezar de nuevo.
- Como trabajador, no quiero terminar con una cuenta duplicada o en un estado inconsistente por haber cerrado la app en el momento equivocado.

## Reglas de negocio a definir
1. ¿Cuánto tiempo se conserva un onboarding a medias antes de considerarlo abandonado (¿indefinido, unos días)?
2. Si el trabajador reabre la app mucho después (ej. un mes), ¿se le vuelve a preguntar si quiere continuar o empezar de nuevo?

## Criterios de aceptación
- [ ] Cerrar la app en cualquier paso del onboarding y volver a abrirla lleva al trabajador al mismo paso donde estaba, con los datos ya ingresados todavía presentes.
- [ ] Si el `workerId` ya fue creado (paso 1 completo), reabrir la app no vuelve a llamar `registerWorkerPersonalInfo` — continúa directo desde el paso 2.
- [ ] Completar el onboarding exitosamente limpia el estado persistido (no queda dando vueltas un onboarding "completo" en el storage local).

## Superficie funcional necesaria
- Middleware de persistencia sobre `useOnboardingStore` (Zustand ya soporta esto de forma nativa).
- Lógica de arranque de la app que, si hay un onboarding persistido incompleto, restaure ese estado en vez de arrancar desde `personal-info`.

## Dependencias
- Ninguna dura, aunque conviene resolverla antes o junto con `esenciales/03-autenticacion-cliente.md` si el onboarding termina dejando al usuario logueado.

## Decisiones técnicas pendientes (para vos)
- Mecanismo de storage: `AsyncStorage` (suficiente para datos no sensibles como `step`/`workerId`; las imágenes en sí no hace falta persistirlas más allá de sus URIs locales) — las fotos de identidad no viajan como base64 en el estado, así que persistir el store no implica persistir las imágenes pesadas.
- Si además de persistir localmente conviene, en algún momento, tener un endpoint de backend que confirme "este email/CUIT ya tiene un registro en curso" para los casos donde el trabajador reinstala la app o cambia de dispositivo (fuera del alcance de esta spec tal como está planteada, pero vale la pena anotarlo).
