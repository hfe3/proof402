export function createPostgresStore(config) {
  let pool;

  async function activePool() {
    if (pool) return pool;
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.postgresSsl ? { rejectUnauthorized: false } : undefined
    });
    return pool;
  }

  return {
    async init() {
      const db = await activePool();
      await db.query(`
        create table if not exists proof402_proofs (
          id text primary key,
          idempotency_key text unique not null,
          proof jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query("create index if not exists proof402_proofs_created_at_idx on proof402_proofs (created_at desc)");
    },

    async createProof(proof) {
      const db = await activePool();
      await db.query(
        `
          insert into proof402_proofs (id, idempotency_key, proof, created_at)
          values ($1, $2, $3, $4)
          on conflict (idempotency_key) do nothing
        `,
        [proof.id, proof.idempotencyKey, proof, proof.createdAt || proof.timestamp]
      );
      return proof;
    },

    async getProof(id) {
      const db = await activePool();
      const result = await db.query("select proof from proof402_proofs where id = $1", [id]);
      return result.rows[0]?.proof;
    },

    async getProofByIdempotencyKey(key) {
      const db = await activePool();
      const result = await db.query("select proof from proof402_proofs where idempotency_key = $1", [key]);
      return result.rows[0]?.proof;
    },

    async listRecentProofs(limit = 20) {
      const db = await activePool();
      const parsedLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 20, 100));
      const result = await db.query(
        "select proof from proof402_proofs order by created_at desc limit $1",
        [parsedLimit]
      );
      return result.rows.map((row) => row.proof);
    },

    async resetForTests() {
      const db = await activePool();
      await db.query("delete from proof402_proofs");
    },

    async stats() {
      const db = await activePool();
      const result = await db.query("select count(*)::int as proofs from proof402_proofs");
      return {
        driver: "postgres",
        durable: true,
        proofs: result.rows[0]?.proofs || 0
      };
    },

    async close() {
      if (pool) {
        await pool.end();
        pool = undefined;
      }
    }
  };
}
