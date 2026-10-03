import dotenv from 'dotenv';
dotenv.config();

import { buildServer } from './server.js';

async function main() {
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';

  const app = await buildServer({
    logLevel: process.env.LOG_LEVEL || 'info',
  });

  try {
    await app.listen({ port, host });
    app.log.info(`CourseCity API server listening on http://${host}:${port}`);
    app.log.info(`API Documentation available at http://${host}:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
