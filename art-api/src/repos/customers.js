import { CUSTOMER_RULES } from '../validation.js';
import { notFound } from '../errors.js';

export const customersRepo = (db) => {
  const get = async (id) => (await db.query('SELECT * FROM customers WHERE id = ?', [id]))[0] ?? null;

  return {
    get,

    list: () => db.query('SELECT * FROM customers ORDER BY name'),

    /** `fields` must already be validated; column names are limited to the CUSTOMER_RULES whitelist. */
    async update(id, fields) {
      if (!(await get(id))) throw notFound('Customer');

      const columns = Object.keys(fields).filter((c) => c in CUSTOMER_RULES);
      const assignments = columns.map((c) => `${c} = ?`).join(', ');
      await db.run(`UPDATE customers SET ${assignments} WHERE id = ?`, [...columns.map((c) => fields[c]), id]);
      return get(id);
    },
  };
};
