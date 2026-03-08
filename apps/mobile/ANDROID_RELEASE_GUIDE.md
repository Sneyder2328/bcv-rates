# Android Release Build Guide

Esta guía deja los pasos mínimos para generar por línea de comando:

- `APK` de release para pruebas locales
- `AAB` de release para subir a Google Play

Los comandos de abajo ya fueron probados en este proyecto.

## 1. Requisitos

- Tener instalado `OpenJDK 17`
- Tener configurado Android SDK
- Tener presente `apps/mobile/android/keystore.properties`
- Tener el archivo del keystore de release referenciado en `keystore.properties`
- Tener `apps/mobile/.env` con las variables necesarias para Expo/Firebase

## 2. Subir versión antes de publicar

Antes de generar un release nuevo, incrementa:

- `versionCode` y `versionName` en `/Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build.gradle`
- `version` y `android.versionCode` en `/Users/sneyder/Documents/projects/bcv-rates/apps/mobile/app.config.ts`

Ejemplo actual:

```gradle
versionCode 5
versionName "1.0.4"
```

```ts
version: "1.0.4",
android: {
  versionCode: 5,
}
```

## 3. Comandos para generar APK y AAB

Desde la raíz del monorepo:

```bash
cd /Users/sneyder/Documents/projects/bcv-rates
pnpm lint:fix
pnpm lint
pnpm type-check
```

Luego compila Android release con Java 17:

```bash
cd /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
export NODE_ENV=production
./gradlew assembleRelease bundleRelease
```

## 4. Importante

En este proyecto, `./gradlew clean` puede fallar por un problema de limpieza de directorios JNI autogenerados de React Native / Expo.

Por ahora, usa:

```bash
./gradlew assembleRelease bundleRelease
```

y evita:

```bash
./gradlew clean assembleRelease bundleRelease
```

## 5. Dónde quedan los archivos

APK:

```text
/Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

AAB:

```text
/Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

## 6. Comando rápido de verificación

```bash
ls -lh \
  /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/apk/release/app-release.apk \
  /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

Checksums SHA-256:

```bash
shasum -a 256 \
  /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/apk/release/app-release.apk \
  /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

## 7. Resumen corto

```bash
cd /Users/sneyder/Documents/projects/bcv-rates/apps/mobile/android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
export NODE_ENV=production
./gradlew assembleRelease bundleRelease
```
