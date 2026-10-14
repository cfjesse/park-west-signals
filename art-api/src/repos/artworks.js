const SELECT_ARTWORKS = `
  SELECT
    a.*,
    COALESCE(ar.name, a.artist_name) AS artist_name,
    ar.avatar AS artist_avatar,
    ar.bio AS artist_bio
  FROM artworks a
  LEFT JOIN artists ar ON ar.id = a.artist_id
  ORDER BY COALESCE(ar.name, a.artist_name), a.title
`;

export const artworksRepo = (db) => ({
  list: () => db.query(SELECT_ARTWORKS),
});
