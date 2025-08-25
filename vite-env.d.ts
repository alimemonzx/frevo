/// <reference types="vite/client" />

// 🎯 Add CSS import types for Vite
declare module "*.css?inline" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}
