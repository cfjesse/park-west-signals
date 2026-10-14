import { Router } from 'express';
import { ARTIST_RULES, validateUpdate } from '../validation.js';

export function artistsRouter(artists) {
  const router = Router();

  // UPDATE: Used by ArtworkApi.updateArtistResource
  router.patch('/:id', async (req, res) => {
    const fields = validateUpdate(req.body, ARTIST_RULES);
    res.json(await artists.update(req.params.id, fields));
  });

  return router;
}
