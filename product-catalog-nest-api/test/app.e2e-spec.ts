import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

/**
 * End-to-end tests against a fresh in-memory MongoDB (MONGODB_URI=memory is set in
 * vitest.config.e2e.ts), seeded with src/data/api-data.json.
 */
describe('Product Catalog API (e2e)', () => {
  let app: INestApplication<Server>;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    app.enableShutdownHooks();
    await app.init();
    http = request(app.getHttpServer());
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  });

  describe('info', () => {
    it('GET /api returns name, version and the endpoint list', async () => {
      const res = await http.get('/api').expect(200);
      expect(res.body.name).toBe('product-catalog-nest-api');
      expect(res.body.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(res.body.endpoints).toContain('GET /api/products');
      expect(res.body.endpoints).toContain('POST /api/categories');
    });

    it('GET /api/health reports the database as connected', async () => {
      const res = await http.get('/api/health').expect(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        db: 'connected',
        mode: 'memory',
      });
    });

    it('unknown routes return a JSON 404', async () => {
      const res = await http.get('/api/nope').expect(404);
      expect(res.body.errors[0]).toContain('Route not found');
    });
  });

  describe('categories', () => {
    let id: string;

    it('lists the seeded categories', async () => {
      const res = await http.get('/api/categories').expect(200);
      expect(res.body).toHaveLength(7);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).not.toHaveProperty('_id');
    });

    it('creates a category (201)', async () => {
      const res = await http
        .post('/api/categories')
        .send({ category: 'E2E Category' })
        .expect(201);
      expect(res.body).toMatchObject({
        category: 'E2E Category',
        isActive: true,
      });
      id = res.body.id;
    });

    it('rejects a duplicate name (409)', async () => {
      await http
        .post('/api/categories')
        .send({ category: 'E2E Category' })
        .expect(409);
    });

    it('validates the body (422) and rejects unknown fields', async () => {
      const missing = await http.post('/api/categories').send({}).expect(422);
      expect(missing.body.errors).toContain('category should not be empty');
      const extra = await http
        .post('/api/categories')
        .send({ category: 'X', hacker: true })
        .expect(422);
      expect(extra.body.errors).toContain('property hacker should not exist');
    });

    it('rejects malformed JSON (400)', async () => {
      const res = await http
        .post('/api/categories')
        .set('Content-Type', 'application/json')
        .send('{bad json')
        .expect(400);
      expect(res.body.errors).toEqual(['Request body is not valid JSON']);
    });

    it('updates a category and filters inactive ones out of /active', async () => {
      await http
        .patch(`/api/categories/${id}`)
        .send({ isActive: false })
        .expect(200);
      const active = await http.get('/api/categories/active').expect(200);
      expect(active.body.map((c: any) => c.id)).not.toContain(id);
    });

    it('returns 400 for an invalid id and 404 for a missing one', async () => {
      await http.get('/api/categories/123').expect(400);
      await http.get('/api/categories/652f1c2b9d3e4a0012345678').expect(404);
    });

    it('deletes a category', async () => {
      await http.delete(`/api/categories/${id}`).expect(200);
      await http.get(`/api/categories/${id}`).expect(404);
    });
  });

  describe('products', () => {
    let categoryId: string;
    let productId: string;

    beforeAll(async () => {
      const res = await http
        .post('/api/categories')
        .send({ category: 'Gadgets' })
        .expect(201);
      categoryId = res.body.id;
    });

    it('lists the seeded products', async () => {
      const res = await http.get('/api/products').expect(200);
      expect(res.body).toHaveLength(23);
    });

    it('filters by category (query and POST /search)', async () => {
      const query = await http
        .get('/api/products?category=Issuer Solutions,Digital Security')
        .expect(200);
      const search = await http
        .post('/api/products/search')
        .send({ categories: ['Issuer Solutions', 'Digital Security'] })
        .expect(200);
      expect(query.body.length).toBeGreaterThan(0);
      expect(search.body).toHaveLength(query.body.length);
      await http.post('/api/products/search').send({}).expect(200, []);
    });

    it('creates a product (201) only in an existing category', async () => {
      const res = await http
        .post('/api/products')
        .send({ productname: 'Widget', category: 'Gadgets' })
        .expect(201);
      productId = res.body.id;
      await http
        .post('/api/products')
        .send({ productname: 'Ghost', category: 'Does Not Exist' })
        .expect(422);
    });

    it('moves products when their category is renamed', async () => {
      await http
        .put(`/api/categories/${categoryId}`)
        .send({ category: 'Devices' })
        .expect(200);
      const res = await http.get(`/api/products/${productId}`).expect(200);
      expect(res.body.category).toBe('Devices');
    });

    it('will not delete a category that still has products (409)', async () => {
      await http.delete(`/api/categories/${categoryId}`).expect(409);
    });

    it('updates and deletes a product', async () => {
      const res = await http
        .patch(`/api/products/${productId}`)
        .send({ productname: 'Widget Pro' })
        .expect(200);
      expect(res.body.productname).toBe('Widget Pro');
      await http.delete(`/api/products/${productId}`).expect(200);
      await http.delete(`/api/products/${productId}`).expect(404);
      await http.delete(`/api/categories/${categoryId}`).expect(200);
    });
  });
});
