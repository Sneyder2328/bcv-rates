# Mejoras sugeridas para apps/mobile

Documento de análisis comparativo entre la app mobile (Expo/React Native) y la app web (React SPA), con propuestas de mejora priorizadas.

---

## 1. Calculadora mixta de monedas

**Estado:** Existe en web, **no existe en mobile**.

La web tiene un `MixedCurrencyCalculatorDialog` completo que permite sumar y restar montos en VES, USD y EUR usando las tasas BCV, con resultado en la moneda que el usuario elija. La lógica ya está en `@bcv-rates/domain` (`calculateMixedCurrencyTotals`, `toVesAmount`, `fromVesAmount`), así que solo falta la UI.

**Trabajo estimado:**
- Crear hook `useMixedCurrencyCalculator.ts` (se puede portar casi 1:1 desde web: `apps/web/src/hooks/useMixedCurrencyCalculator.ts`)
- Crear pantalla `app/calculator.tsx` o bottom sheet modal
- Agregar botón de acceso desde la pantalla principal (como hace la web)

**Prioridad:** Alta — es una feature completa que ya existe en web y los usuarios móviles no tienen acceso.

---

## 2. ~~Rango de historial de 365 días (1 año)~~ HECHO

**Estado:** ~~Web ofrece 7 / 14 / 30 / 90 / **365** días. Mobile solo ofrece 7 / 14 / 30 / **90** días.~~ Implementado — mobile ahora ofrece 7 / 14 / 30 / 90 / 365 días.

El tipo `HistoryRange` en mobile está definido como `7 | 14 | 30 | 90` y no incluye 365. La API ya soporta `limit: 365`, por lo que es un cambio mínimo.

**Trabajo estimado:**
- Agregar `365` al type `HistoryRange` en `src/hooks/useHistoricalRates.ts`
- Agregar `{ value: 365, label: "1a" }` al array `RANGE_OPTIONS` en `app/history.tsx`

**Prioridad:** Alta — es un cambio de 2 líneas que iguala la funcionalidad.

---

## 3. ~~Cache local de tasas personalizadas (offline resilience)~~ HECHO

**Estado:** ~~La web tiene un sistema de cache por usuario en localStorage. Mobile no tenía esto.~~ Implementado — se creó `src/utils/customRatesCache.ts` con AsyncStorage y se integró en `useCustomRates` para escribir/leer cache por usuario.

**Trabajo estimado:**
- Crear `src/utils/customRatesCache.ts` usando AsyncStorage (equivalente al localStorage de web)
- Crear hook `useCustomRatesCache.ts` que escriba al cache cuando hay datos y lea del cache cuando no hay conexión
- Integrar en las pantallas `index.tsx` y `settings.tsx`

**Prioridad:** Media-alta — mejora significativa para usuarios con conectividad intermitente (contexto Venezuela).

---

## 4. ~~Limpiar código de debug en auth.tsx~~ HECHO

**Estado:** ~~El archivo `app/auth.tsx` contenía bloques `#region agent log` con `console.log` y llamadas `fetch` a localhost.~~ Implementado — se eliminaron los 3 bloques de debug.

Hay al menos 3 bloques que deben eliminarse:
- Línea ~68-70: log en `configure`
- Línea ~108-111: log en `preSignIn`
- Línea ~129-132: log en `catchError`

**Trabajo estimado:** Eliminar los bloques marcados con `#region agent log` / `#endregion`.

**Prioridad:** Alta — es código de debug que no debería llegar a producción. Envía datos a localhost, causa warnings innecesarios y ensucia los logs.

---

## 5. Navegación con tabs en lugar de stack plano

**Estado:** La web tiene un navbar persistente con acceso directo a settings, auth, history. Mobile usa un `Stack` plano sin tab navigator — toda la navegación se hace con botones dentro del scroll de `index.tsx`.

**Propuesta:** Migrar a un `Tabs` navigator de Expo Router con al menos:
- **Inicio** (tasas + conversor)
- **Historial** (gráfica)
- **Configuración** (tasas personalizadas + cuenta)

El auth screen seguiría como modal.

**Trabajo estimado:**
- Reestructurar `app/` a `app/(tabs)/` con `_layout.tsx` tipo tabs
- Mover `auth.tsx` fuera del grupo de tabs como modal
- Actualizar navegación en componentes

**Prioridad:** Media — mejora UX y discoverability de features, pero requiere reestructuración.

---

## 6. ~~Pull-to-refresh en la pantalla principal~~ HECHO

**Estado:** ~~Ni la web ni el mobile tenían pull to refresh.~~ Implementado — se agregó `RefreshControl` al `ScrollView` de `index.tsx` conectado a `refetch` de `useExchangeRates`.

**Propuesta:** Agregar `RefreshControl` al `ScrollView` de `app/index.tsx` que refresque las tasas de cambio (`refetch` de la query).

**Trabajo estimado:**
- Agregar `RefreshControl` al ScrollView existente
- Conectar `isRefreshing` con el estado de `refetch` de `useExchangeRates`

**Prioridad:** Media-alta — patrón nativo que los usuarios esperan en apps móviles.

---

## 7. Haptic feedback en acciones clave

**Estado:** No existe en mobile. La web usa animaciones CSS para feedback visual.

**Propuesta:** Agregar feedback háptico (vibración ligera) en:
- Copiar monto al portapapeles
- Seleccionar tasa personalizada
- Cambiar currency/rango en historial
- Confirmar acciones (guardar tasa, eliminar)

Usar `expo-haptics` (ya incluido en Expo SDK).

**Trabajo estimado:**
- Instalar `expo-haptics`
- Agregar `Haptics.impactAsync(ImpactFeedbackStyle.Light)` en los handlers relevantes

**Prioridad:** Media — mejora la sensación "nativa" de la app.

---

## 8. Widget nativo para tasas (iOS/Android)

**Estado:** No existe. Ni web ni mobile lo tienen.

**Propuesta:** Crear un widget que muestre la tasa USD y EUR actual directamente en la pantalla de inicio del dispositivo, sin necesidad de abrir la app.

Usar `react-native-android-widget` para Android y un approach similar para iOS.

**Trabajo estimado:** Considerable — requiere configuración nativa por plataforma.

**Prioridad:** Baja (por complejidad) — pero sería un diferenciador significativo para la app mobile vs la web.

---

## 9. Push notifications para cambios de tasa

**Estado:** No existe en ninguna plataforma.

**Propuesta:** Notificar al usuario cuando la tasa BCV cambia, usando `expo-notifications` + lógica en el backend para disparar las notificaciones.

Requiere:
- Configurar `expo-notifications` en mobile
- Endpoint en la API para registrar device tokens
- Lógica en el cron del backend para detectar cambios y enviar push

**Trabajo estimado:** Alto — requiere cambios en API + mobile + infraestructura de push.

**Prioridad:** Baja — alto impacto pero alto esfuerzo; evaluar después de las mejoras más inmediatas.

---

## 10. Animaciones y transiciones

**Estado:** La web tiene `animate-in fade-in zoom-in-95` con Tailwind. Mobile no tiene animaciones de transición entre pantallas ni en la carga de datos.

**Propuesta:**
- Transiciones de pantalla con `react-native-reanimated` (layout animations)
- Animación de entrada para las tarjetas de tasas al cargar
- Animated number transitions cuando las tasas cambian

**Trabajo estimado:**
- `react-native-reanimated` ya está disponible con Expo
- `FadeIn`, `SlideInUp` de Reanimated en las cards principales

**Prioridad:** Baja — nice-to-have que mejora el polish visual.

---

## 11. Tests

**Estado:** No hay tests en `apps/mobile`. Solo el paquete `@bcv-rates/domain` tiene tests.

**Propuesta:** Agregar al menos:
- Tests para los hooks de negocio (`useCurrencyConverter`, `useCustomRates`, `useHistoricalRates`)
- Tests de snapshot para componentes clave
- Tests de integración para los flujos de auth

Usar `jest` + `@testing-library/react-native`.

**Prioridad:** Media — importante para mantenibilidad a largo plazo.

---

## 12. Splash screen y app icon

**Estado:** `app.config.ts` referencia `./assets/icon.png` y `./assets/splash-icon.png`, pero no se verificó la calidad visual ni si hay adaptive icon para Android.

**Propuesta:**
- Verificar que los assets existan y sean de alta calidad (1024x1024 para icon, resoluciones adecuadas para splash)
- Configurar `expo-splash-screen` con un splash animado o con la identidad visual de "El Cambio"
- Asegurar adaptive icon para Android 8+

**Prioridad:** Media — primera impresión del usuario.

---

## Resumen de prioridades

| # | Mejora | Prioridad | Esfuerzo | Estado |
|---|--------|-----------|----------|--------|
| 4 | Limpiar debug logs en auth.tsx | Alta | Mínimo | HECHO |
| 2 | Historial 365 días | Alta | Mínimo | HECHO |
| 1 | Calculadora mixta | Alta | Medio | Pendiente |
| 6 | Pull-to-refresh | Media-alta | Bajo | HECHO |
| 3 | Cache offline de custom rates | Media-alta | Medio | HECHO |
| 7 | Haptic feedback | Media | Bajo | Pendiente |
| 5 | Tabs navigator | Media | Medio | Pendiente |
| 11 | Tests | Media | Alto | Pendiente |
| 12 | Splash/icon | Media | Bajo | Pendiente |
| 10 | Animaciones | Baja | Medio | Pendiente |
| 8 | Widget nativo | Baja | Alto | Pendiente |
| 9 | Push notifications | Baja | Alto | Pendiente |
