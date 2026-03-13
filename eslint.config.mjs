import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

import reactPlugin from "eslint-plugin-react";
import reactRecommendedConfig from "eslint-plugin-react/configs/recommended.js";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier"; // This is the config object from eslint-config-prettier

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "node_modules/", 
      "dist/", 
      "**/dist/", 
      "**/*.d.ts",
      "cdk.out/",
      "**/cdk.out/",
      "coverage/",
      "**/coverage/",
      // Browser Print SDK files (minified vendor code)
      "frontend/public/js/*.min.js",
      "**/BrowserPrint*.js"
    ],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript specific configurations
  // This includes the TypeScript parser and @typescript-eslint/eslint-plugin
  ...tseslint.configs.recommended, // Use 'recommendedTypeChecked' or 'strictTypeChecked' for rules requiring type info

  // Configuration for React frontend files
  {
    files: ["frontend/src/**/*.{js,jsx,ts,tsx}"],
    ...reactRecommendedConfig, // Spread React recommended config (includes parser, plugins, rules)
    plugins: {
      ...reactRecommendedConfig.plugins, // Ensure React plugin is included if not already by spread
      react: reactPlugin, // Explicitly ensure react plugin
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      ...reactRecommendedConfig.languageOptions, // Spread languageOptions from react config
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactRecommendedConfig.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // Useful in TypeScript projects
      // Add other React specific rule overrides here
    },
  },

  // Configuration for Node.js/backend files (infra, root .js files)
  {
    files: ["infra/**/*.ts", "*.js", "*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Add any Node.js specific rule overrides here
      // e.g., if 'react/display-name' was relevant from old config for non-React files
    },
  },

  // Project-wide rules (applied after specific configs)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      // Add other global rule overrides here
    },
  },

  // Prettier configuration - MUST BE LAST
  // This turns off all ESLint rules that are unnecessary or might conflict with Prettier.
  // It then enables eslint-plugin-prettier to run Prettier as an ESLint rule.
  {
    ...prettierConfig, // Applies eslint-config-prettier
    plugins: {
      ...prettierConfig.plugins, // Spread any plugins from prettierConfig (usually none)
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules, // Spread rules from prettierConfig (disables conflicting ones)
      "prettier/prettier": "warn", // Runs Prettier as a rule
    },
  },
);
