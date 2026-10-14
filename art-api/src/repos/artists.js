import { notFound } from '../errors.js';

export const artistsRepo = (db) => {
  const get = async (id) => {
    const rows = await db.query('SELECT * FROM artists WHERE id = ?', [id]);
    return rows[0] ?? null;
  };

  return {
    get,

    /** Update an artist record with validated fields. */
    async update(id, fields) {
      if (!(await get(id))) throw notFound('Artist');

      const allowed = ['name', 'avatar', 'bio'];
      const cols = Object.keys(fields).filter((k) => allowed.includes(k) && typeof fields[k] === 'string');
      if (cols.length === 0) return get(id);

      const assignments = cols.map((c) => `${c} = ?`).join(', ');
      await db.run(`UPDATE artists SET ${assignments} WHERE id = ?`, [...cols.map((c) => fields[c]), id]);

      if (fields.name) {
        await db.run('UPDATE artworks SET artist_name = ? WHERE artist_id = ?', [fields.name, id]);
      }
      return get(id);
    },
  };
};
