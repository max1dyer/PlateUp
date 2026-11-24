import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Interface tests for the deployed layout: one server answers `/api/...` with the API and every
 * other path with the built frontend (a stand-in `index.html` here).
 */
describe('configureApp (single deployable app)', () => {
  let app: NestExpressApplication;
  let baseUrl: string;
  let frontendDir: string;
  let servesFrontend: boolean;

  beforeAll(async () => {
    frontendDir = mkdtempSync(join(tmpdir(), 'plateup-frontend-'));
    writeFileSync(join(frontendDir, 'index.html'), '<html>PlateUp app</html>');
    writeFileSync(join(frontendDir, 'main.js'), 'console.log("app");');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    servesFrontend = configureApp(app, { frontendDir });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
    rmSync(frontendDir, { recursive: true, force: true });
  });

  it('reports that it serves the frontend', () => {
    expect(servesFrontend).toBe(true);
  });

  it('serves the API under /api', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('no longer serves the API without the prefix', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(await response.text()).toContain('PlateUp app');
  });

  it('serves built files as they are', async () => {
    const response = await fetch(`${baseUrl}/main.js`);
    expect(await response.text()).toContain('console.log');
  });

  it('answers app routes with index.html so deep links and reloads work', async () => {
    for (const path of ['/', '/recipes', '/recipes/abc/edit']) {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('PlateUp app');
    }
  });

  it('returns a JSON 404 for unknown API routes instead of the app page', async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(expect.objectContaining({ statusCode: 404 }));
  });

  it('skips the frontend when no build exists', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const apiOnly = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    expect(configureApp(apiOnly, { frontendDir: join(frontendDir, 'missing') })).toBe(false);
    await apiOnly.close();
  });
});
