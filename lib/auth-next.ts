const PLATFORM_RESET_COOKIE = "fb_auth_next";

export function markPlatformPasswordReset() {
  document.cookie = `${PLATFORM_RESET_COOKIE}=plataforma; path=/; max-age=3600; samesite=lax`;
}

export function clearAuthNext() {
  document.cookie = `${PLATFORM_RESET_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function isPlatformPasswordReset() {
  return document.cookie.split("; ").includes(`${PLATFORM_RESET_COOKIE}=plataforma`);
}
