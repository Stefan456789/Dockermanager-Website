// App constants
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '/';
export const BASE_PATH = rawBasePath === '/' ? '' : rawBasePath;
