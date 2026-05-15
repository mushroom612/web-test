/**
 * ============================================================================
 * ARQUIVO: vite.config.js
 * DESCRIÇÃO: Configuração do Vite (ferramenta de build/desenvolvimento)
 *
 * Vite é um bundler moderno que:
 * - Inicia o servidor de desenvolvimento muito rápido
 * - Atualiza a página automaticamente quando você muda o código (Hot Module Reload)
 * - Cria versões otimizadas para produção
 *
 * Configuração:
 * - plugins: [react()] - ativa o plugin React para Vite entender arquivos .jsx
 *
 * Como funciona:
 * 1. Vite lê este arquivo quando você executa "npm run dev" ou "npm run build"
 * 2. O plugin React permite que Vite compile componentes React
 * 3. Arquivo ativa o recurso de "Hot Module Replacement" (HMR)
 * ============================================================================
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração padrão do Vite com suporte a React
export default defineConfig({
  plugins: [react()],
});
