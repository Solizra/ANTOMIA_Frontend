export const apiURL = 'https://antomia-backend.onrender.com';
//export const apiURL = 'http://localhost:3000';

// Opcional: configuración para disparar GitHub Actions desde el frontend
export const githubActions = {
  // Usa un endpoint del backend si existe (recomendado para ocultar el token)
  // Implementa en backend: POST /api/github/trigger-backend
  backendTriggerEndpoint: `${apiURL}/api/github/trigger-backend`,

  // Fallback: disparo directo a GitHub Actions (requiere token en build)
  owner: import.meta?.env?.VITE_GH_OWNER || '',
  repo: import.meta?.env?.VITE_GH_REPO || '',
  workflowFile: import.meta?.env?.VITE_GH_WORKFLOW || 'auto-update.yml',
  ref: import.meta?.env?.VITE_GH_REF || 'main',
  token: import.meta?.env?.VITE_GH_ACTIONS_TOKEN || ''
};