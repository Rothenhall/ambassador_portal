import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptPreset from "eslint-config-next/typescript";

// eslint-config-next publishes flat configs directly, so they are imported rather than wrapped
// in FlatCompat — the compat shim trips over the plugin objects these days.
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts", "prisma/prisma/**", ".scratch/**"],
  },
  ...coreWebVitals,
  ...typescriptPreset,
  {
    rules: {
      // Uploads are rendered from data URLs the browser cannot preoptimise, and the image sits
      // beside a text caption that carries the meaning.
      "@next/next/no-img-element": "off",
      // Everything below is accessibility. `npm run verify:a11y` checks the same ground at
      // runtime with axe; these catch it at commit time instead.
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
  {
    files: ["scripts/**/*.ts", "prisma/**/*.ts"],
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
