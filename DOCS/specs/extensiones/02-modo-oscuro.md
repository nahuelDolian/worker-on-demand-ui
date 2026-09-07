# Spec: Modo Oscuro

**Categoría:** 🟦 Extensión · **Gap origen:** nuevo — NativeWind ya soporta `dark:` variants out-of-the-box, simplemente no se usó ninguna

## Contexto
Todos los componentes actuales usan colores fijos (ej. `bg-white`, `text-neutral-900`) sin ninguna variante `dark:`. `app.json` ya tiene `"userInterfaceStyle": "automatic"`, lo que significa que el sistema operativo ya le informa a la app cuándo el dispositivo está en modo oscuro — pero la UI no reacciona a eso.

## Objetivo
Que la app se vea bien tanto en modo claro como oscuro, respetando la preferencia del sistema.

## Historias de usuario
- Como trabajador con su dispositivo en modo oscuro, quiero que la app respete esa preferencia en vez de mostrarse siempre en modo claro.

## Criterios de aceptación
- [ ] Todas las pantallas existentes (onboarding, check-in) se ven correctamente en modo oscuro, sin contrastes rotos ni texto ilegible.
- [ ] El cambio de modo del sistema se refleja en la app sin necesidad de reiniciarla.

## Superficie funcional necesaria
- Revisión y actualización de las clases de NativeWind en cada componente para agregar sus variantes `dark:`.

## Dependencias
- Ninguna — se puede hacer de forma incremental sobre lo que ya existe.

## Decisiones técnicas pendientes (para vos)
- Paleta de colores para modo oscuro (esto es una decisión de diseño más que técnica).
- Si se da soporte también a forzar un modo manualmente desde la app (además de seguir al sistema) — no es lo típico, evaluar si el negocio lo pide.
