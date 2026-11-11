/** `import text from './file.txt?raw'` gives the file's text: Turbopack (next.config.ts) and Vite (Vitest) both support it. */
declare module '*?raw' {
  const text: string;
  export default text;
}
