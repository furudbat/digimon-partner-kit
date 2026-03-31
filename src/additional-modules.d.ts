// This allows TypeScript to recognize CSS imports as side-effects
declare module '*.css' {
  const content: any;
  export default content;
}
