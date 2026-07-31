// The portal lives on a separate ECS-backed subdomain; this site is a static
// export with no server, so these are plain constants rather than env vars.
export const APP_URL = 'https://app.opsagenda.com';
export const SIGNUP_URL = `${APP_URL}/auth/signup`;
export const SIGNIN_URL = `${APP_URL}/auth/signin`;
