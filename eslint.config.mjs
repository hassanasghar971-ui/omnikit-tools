import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Browser-only capability detection & clock sync MUST set state after
      // mount for SSR hydration safety (window/navigator unavailable on the
      // server). This is a deliberate, documented React pattern — the cost
      // is one extra render pass on mount only.
      "react-hooks/set-state-in-effect": "off",
      // Tool previews render client-generated data URLs and user uploads
      // with dynamic dimensions; next/image cannot optimize data-URL
      // imagery, so <img> is the correct primitive here.
      "@next/next/no-img-element": "off",
    },
  },
]);
