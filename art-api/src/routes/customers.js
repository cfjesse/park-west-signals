import { Router } from 'express';
import { CUSTOMER_RULES, validateUpdate } from '../validation.js';

export function customersRouter(customers) {
  const router = Router();

  // LIST: Used by CustomerApi.customerListResource
  router.get('/', async (_req, res) => {
    res.json(await customers.list());
  });

  // UPDATE: Used by CustomerApi.updateCustomerResource
  router.patch('/:id', async (req, res) => {
    const fields = validateUpdate(req.body, CUSTOMER_RULES);
    res.json(await customers.update(req.params.id, fields));
  });

  return router;
}
