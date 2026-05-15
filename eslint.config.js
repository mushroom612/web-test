/**
 * ============================================================================
 * ARQUIVO: eslint.config.js
 * DESCRIÇÃO: Configuração do ESLint (ferramenta de análise de código)
 *
 * ESLint é um "revisor automático de código" que:
 * - Encontra erros comuns em JavaScript/React
 * - Ajuda a manter um estilo de código consistente
 * - Avisa quando há variáveis não usadas, código com problemas, etc.
 *
 * Como funciona:
 * 1. Você executa "npm run lint" no terminal
 * 2. ESLint lê este arquivo e verifica todos os .js e .jsx
 * 3. Mostra erros e avisos no console
 *
 * Configurações:
 * - globalIgnores: pasta 'dist' é ignorada (não verificada)
 * - files: verifica todos os arquivos .js e .jsx
 * - extends: usa configurações recomendadas para React e React Hooks
 * - rules: no-unused-vars permite variáveis que começam com maiúscula (constantes)
 * ============================================================================
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

// Exporta a configuração do ESLint
export default defineConfig([
  globalIgnores(["dist"]), // Ignora a pasta 'dist' (build de produção)
  {
    files: ["**/*.{js,jsx}"], // Verifica todos os arquivos .js e .jsx
    extends: [
      js.configs.recommended, // Recomendações padrão de JavaScript
      reactHooks.configs.flat.recommended, // Recomendações para React Hooks
      reactRefresh.configs.vite, // Recomendações para Vite + React Refresh
    ],
    languageOptions: {
      ecmaVersion: 2020, // Versão de JavaScript (ES2020)
      globals: globals.browser, // Variáveis globais do navegador (console, window, etc)
      parserOptions: {
        ecmaVersion: "latest", // Usa sempre a versão mais recente
        ecmaFeatures: { jsx: true }, // Ativa suporte para JSX
        sourceType: "module", // Usa import/export (módulos ES6)
      },
    },
    rules: {
      // Regra: avisa sobre variáveis não usadas, mas ignora variáveis que começam com maiúscula
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
]);
