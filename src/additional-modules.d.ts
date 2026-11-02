// This allows TypeScript to recognize CSS imports as side-effects
declare module '*.css' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export default content;
}
