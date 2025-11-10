export const apiURL = 'https://antomia-backend.onrender.com';
//export const apiURL = 'http://localhost:3000';

// Configurable candidate paths for Users API (backend may expose different routes)
export const usersApiPaths = [
  // Prefer known existing endpoints first to avoid noisy 404s
  '/api/usuarios_registrados',
  '/api/usuarios',
  '/api/admin/users',
  '/api/Users',
  '/api/users'
];

// Primary path used for user operations (listing/deletion). Keep in sync with backend.
export const USERS_PRIMARY_PATH = '/api/usuarios_registrados';
