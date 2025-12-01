// Example runtime config — copy to public/config.js in deployment if you want runtime overrides
window.__RUNTIME_CONFIG__ = {
  VITE_APP_NAME: "opg protocol",
  VITE_APP_DESCRIPTION: "Orderly Trading Application",
  VITE_BASE_URL: "/", // nếu deploy trên subpath -> "/your-repo/"
  VITE_WALLETCONNECT_PROJECT_ID: "",
  VITE_ORDERLY_BROKER_NAME: "opg protocol",
  // add any other VITE_* you want to override at runtime
};
