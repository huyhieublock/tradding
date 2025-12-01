import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { withBasePath } from "./utils/base-path";
import { getRuntimeConfig } from "./utils/runtime-config";

import "./styles/index.css";

const IndexPage = lazy(() => import("./pages/Index"));
const PerpLayout = lazy(() => import("./pages/perp/Layout"));
const PerpIndex = lazy(() => import("./pages/perp/Index"));
const PerpSymbol = lazy(() => import("./pages/perp/Symbol"));

async function loadRuntimeConfig() {
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = withBasePath("/config.js");
    script.onload = () => {
      console.log("Runtime config loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.log("Runtime config not found, using build-time env vars");
      resolve();
    };
    document.head.appendChild(script);
  });
}

function loadAnalytics() {
  const analyticsScript = getRuntimeConfig("VITE_ANALYTICS_SCRIPT");

  if (analyticsScript) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(analyticsScript, "text/html");
    const scripts = doc.querySelectorAll("script");

    scripts.forEach((originalScript) => {
      const newScript = document.createElement("script");

      Array.from(originalScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (originalScript.textContent) {
        newScript.textContent = originalScript.textContent;
      }

      document.head.appendChild(newScript);
    });
  }
}

const basePath = import.meta.env.BASE_URL || "/";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorBoundary />,
      children: [
        { index: true, element: <IndexPage /> },
        {
          path: "perp",
          element: <PerpLayout />,
          children: [
            { index: true, element: <PerpIndex /> },
            { path: ":symbol", element: <PerpSymbol /> },
          ],
        },
      ],
    },
  ],
  { basename: basePath }
);

loadRuntimeConfig().then(() => {
  loadAnalytics();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HelmetProvider>
        <RouterProvider router={router} />
      </HelmetProvider>
    </React.StrictMode>
  );
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(withBasePath("/sw.js"))
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}
