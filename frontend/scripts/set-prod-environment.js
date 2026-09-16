/**
 * Writes src/environments/environment.prod.ts using the API_BASE_URL environment variable
 * provided at build time (e.g. by Render). Falls back to the default Render backend URL
 * used by render.yaml if the variable isn't set, so a plain `npm run build` still works.
 */
const fs = require('fs');
const path = require('path');

const apiBaseUrl = process.env.API_BASE_URL || 'https://parasabha-planner-backend.onrender.com/api';

const content = `export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl}'
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`[set-prod-environment] Wrote apiBaseUrl='${apiBaseUrl}' to ${targetPath}`);
