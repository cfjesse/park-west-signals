import { Router } from 'express';
import { artworksRouter } from './artworks.js';
import { customersRouter } from './customers.js';
import { artistsRouter } from './artists.js';

/**
 * Creates the aggregated /api router and mounts resource routers.
 */
export function createApiRouter({ artworks, customers, artists }) {
  const router = Router();

  router.use('/artworks', artworksRouter(artworks));
  router.use('/customers', customersRouter(customers));
  router.use('/artists', artistsRouter(artists));

  return router;
}
