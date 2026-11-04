/** Cookie names. Kept free of server-only imports so middleware can use them. */
export const SESSION_COOKIE = "lumora_session";
export const GUEST_COOKIE = "lumora_gid";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const GUEST_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const GUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
