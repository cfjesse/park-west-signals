import express from 'express';
import { openDatabase } from './db/client.js';
import { artworksRepo } from './repos/artworks.js';
import { customersRepo } from './repos/customers.js';
import { artistsRepo } from './repos/artists.js';
import { createApiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './errors.js';

/**
 * Builds and configures the Express application.
 *
 * @param {object} [options={}] Optional dependencies (used for tests with in-memory DB)
 * @param {object} [options.db] Custom database instance
 * @param {object} [options.artworks] Custom artworks repository
 * @param {object} [options.customers] Custom customers repository
 * @param {object} [options.artists] Custom artists repository
 */
export function createApp(options = {}) {
  const db = options.db ?? (options.artworks && options.customers && options.artists ? null : openDatabase());
  const artworks = options.artworks ?? artworksRepo(db);
  const customers = options.customers ?? customersRepo(db);
  const artists = options.artists ?? artistsRepo(db);

  const app = express();

  // Core Middleware
  app.use(express.json());

  // Mount API Endpoints
  app.use('/api', createApiRouter({ artworks, customers, artists }));

  // Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
