import path from 'node:path';

export function authStorage(role: string): string {
  return path.join(__dirname, '..', '.auth', `${role}.json`);
}
