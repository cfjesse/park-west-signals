import { Router } from 'express';

export function artworksRouter(artworks) {
  const router = Router();

  // LIST: Used by ArtworkApi.artworkListResource
  router.get('/', async (_req, res) => {
    res.json(await artworks.list());
  });

  return router;
}
