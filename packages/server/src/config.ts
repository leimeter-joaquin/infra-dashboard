import { join } from 'node:path';

export const SERVER_PORT = Number(process.env.SERVER_PORT ?? 4321);
export const CONFIG_PATH = process.env.CONFIG_PATH ?? join(process.cwd(), 'config.json');
// The web frontend origin — update this if moving the UI to a different host/port.
export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';
