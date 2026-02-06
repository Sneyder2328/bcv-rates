/**
 * Maps Firebase Auth error codes to user-friendly Spanish messages.
 */

const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Este email ya está registrado",
  "auth/invalid-email": "Email inválido",
  "auth/user-not-found": "No se encontró cuenta con este email",
  "auth/wrong-password": "Contraseña incorrecta",
  "auth/invalid-credential": "Credenciales inválidas",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet",
  "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
  "auth/operation-not-allowed":
    "Este método de autenticación no está habilitado",
};

const FALLBACK_MESSAGE = "No se pudo completar la autenticación";

export function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    return errorMessages[code] ?? FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}
