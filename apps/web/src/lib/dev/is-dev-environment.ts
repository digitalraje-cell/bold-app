/** True in local development and preview builds; false in production. */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production';
}
