import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';

describe('Fastify API Server Health & Base Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logLevel: 'silent' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz returns UP status and uptime', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('UP');
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('GET /readyz returns READY status with dependency health', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/readyz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('READY');
    expect(body.dependencies.database).toBe('HEALTHY');
    expect(body.dependencies.redis).toBe('HEALTHY');
  });

  it('GET /api/v1 returns platform operational metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.platform).toBe('CourseCity 1.0');
    expect(body.status).toBe('OPERATIONAL');
  });
});
