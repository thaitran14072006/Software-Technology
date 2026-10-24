import { DataSource, EntityManager } from 'typeorm';

/** All content writers take the same lock BEFORE changing rows. Clock and content commit together. */
export async function contentWrite<T>(ds: DataSource, work: (m: EntityManager) => Promise<{ value: T; ids: string[] }>): Promise<T> {
  return ds.transaction(async m => {
    await m.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
    const { value, ids } = await work(m);
    if (ids.length) {
      const [{ rev }] = await m.query('WITH changed AS (UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev) SELECT rev FROM changed');
      await m.query('UPDATE pois SET rev=$1, updated_at=now() WHERE id=ANY($2::uuid[])', [rev, ids]);
    }
    return value;
  });
}
