// Used for the Capacitor-packaged Android app (npm run build:mobile).
// Unlike the browser dev/prod builds, the app has no origin of its own, so
// apiBaseUrl must always be an absolute URL to the deployed backend.
export const environment = {
  production: true,
  apiBaseUrl: 'https://parasabha-planner-backend.onrender.com/api'
};
