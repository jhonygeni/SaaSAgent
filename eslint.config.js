import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      
      // 🛡️ REGRAS DE SEGURANÇA PARA LOGS
      "no-console": ["warn", { 
        "allow": ["warn", "error"] 
      }],
      
      // Regra customizada para detectar dados sensíveis
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.object.name='console'][callee.property.name='log'] BinaryExpression[operator='+'][right.property.name='id']",
          "message": "🚨 Não logue user.id diretamente! Use logger.sensitive() ou logger.masked() da lib/safeLog.ts"
        },
        {
          "selector": "CallExpression[callee.object.name='console'][callee.property.name='log'] BinaryExpression[operator='+'][right.property.name='email']", 
          "message": "🚨 Não logue email diretamente! Use logger.sensitive() ou logger.masked() da lib/safeLog.ts"
        },
        {
          "selector": "CallExpression[callee.object.name='console'][callee.property.name='log'] BinaryExpression[operator='+'][right.property.name='user_id']",
          "message": "🚨 Não logue user_id diretamente! Use logger.sensitive() ou logger.masked() da lib/safeLog.ts"
        }
      ]
    },
  }
);
