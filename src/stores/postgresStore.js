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
          account_id text,
          api_key_id text,
          content_hash text,
          label text,
          metadata_hash text,
          proof jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query("alter table proof402_proofs add column if not exists account_id text");
      await db.query("alter table proof402_proofs add column if not exists api_key_id text");
      await db.query("alter table proof402_proofs add column if not exists content_hash text");
      await db.query("alter table proof402_proofs add column if not exists label text");
      await db.query("alter table proof402_proofs add column if not exists metadata_hash text");
      await db.query("create index if not exists proof402_proofs_created_at_idx on proof402_proofs (created_at desc)");
      await db.query("create index if not exists proof402_proofs_content_hash_idx on proof402_proofs (content_hash)");
      await db.query("create index if not exists proof402_proofs_metadata_hash_idx on proof402_proofs (metadata_hash)");
      await db.query("create index if not exists proof402_proofs_account_id_idx on proof402_proofs (account_id)");
      await db.query(`
        create table if not exists proof402_accounts (
          id text primary key,
          account jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query(`
        create table if not exists proof402_api_keys (
          id text primary key,
          account_id text not null,
          key_hash text unique not null,
          api_key jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query("create index if not exists proof402_api_keys_account_id_idx on proof402_api_keys (account_id)");
      await db.query(`
        create table if not exists proof402_webhooks (
          id text primary key,
          account_id text not null,
          webhook jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query("create index if not exists proof402_webhooks_account_id_idx on proof402_webhooks (account_id)");
      await db.query(`
        create table if not exists proof402_webhook_deliveries (
          id text primary key,
          account_id text not null,
          webhook_id text not null,
          delivery jsonb not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.query(
        "create index if not exists proof402_webhook_deliveries_account_id_idx on proof402_webhook_deliveries (account_id, created_at desc)"
      );
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
      await db.query(
        `
          update proof402_proofs
          set account_id = $2, api_key_id = $3, content_hash = $4, label = $5, metadata_hash = $6
          where id = $1
        `,
        [proof.id, proof.accountId || null, proof.apiKeyId || null, proof.contentHash, proof.label, proof.metadataHash]
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

    async searchProofs(filters = {}) {
      const db = await activePool();
      const values = [];
      const clauses = [];
      const add = (value) => {
        values.push(value);
        return `$${values.length}`;
      };

      if (filters.contentHash) clauses.push(`content_hash = ${add(String(filters.contentHash).toLowerCase())}`);
      if (filters.metadataHash) clauses.push(`metadata_hash = ${add(String(filters.metadataHash).toLowerCase())}`);
      if (filters.accountId) clauses.push(`account_id = ${add(filters.accountId)}`);
      if (filters.apiKeyId) clauses.push(`api_key_id = ${add(filters.apiKeyId)}`);
      if (filters.idempotencyKey) clauses.push(`idempotency_key = ${add(filters.idempotencyKey)}`);
      if (filters.q) {
        const term = `%${String(filters.q).toLowerCase()}%`;
        clauses.push(
          `(lower(id) like ${add(term)} or lower(content_hash) like ${add(term)} or lower(label) like ${add(
            term
          )} or lower(metadata_hash) like ${add(term)} or lower(idempotency_key) like ${add(term)} or lower(account_id) like ${add(
            term
          )})`
        );
      }

      const limit = Math.max(1, Math.min(Number.parseInt(filters.limit, 10) || 20, 100));
      const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
      const result = await db.query(`select proof from proof402_proofs ${where} order by created_at desc limit ${add(limit)}`, values);
      return result.rows.map((row) => row.proof);
    },

    async resetForTests() {
      const db = await activePool();
      await db.query("delete from proof402_proofs");
      await db.query("delete from proof402_webhook_deliveries");
      await db.query("delete from proof402_webhooks");
      await db.query("delete from proof402_api_keys");
      await db.query("delete from proof402_accounts");
    },

    async stats() {
      const db = await activePool();
      const result = await db.query("select count(*)::int as proofs from proof402_proofs");
      const accounts = await db.query("select count(*)::int as count from proof402_accounts");
      const apiKeys = await db.query("select count(*)::int as count from proof402_api_keys");
      const webhooks = await db.query("select count(*)::int as count from proof402_webhooks");
      const webhookDeliveries = await db.query("select count(*)::int as count from proof402_webhook_deliveries");
      return {
        driver: "postgres",
        durable: true,
        proofs: result.rows[0]?.proofs || 0,
        proofCount: result.rows[0]?.proofs || 0,
        accounts: accounts.rows[0]?.count || 0,
        apiKeys: apiKeys.rows[0]?.count || 0,
        webhooks: webhooks.rows[0]?.count || 0,
        webhookDeliveries: webhookDeliveries.rows[0]?.count || 0
      };
    },

    async createAccount(account) {
      const db = await activePool();
      await db.query("insert into proof402_accounts (id, account, created_at) values ($1, $2, $3)", [
        account.id,
        account,
        account.createdAt
      ]);
      return account;
    },

    async listAccounts() {
      const db = await activePool();
      const result = await db.query("select account from proof402_accounts order by created_at desc");
      return result.rows.map((row) => row.account);
    },

    async getAccount(id) {
      const db = await activePool();
      const result = await db.query("select account from proof402_accounts where id = $1", [id]);
      return result.rows[0]?.account;
    },

    async createApiKey(apiKey) {
      const db = await activePool();
      await db.query(
        "insert into proof402_api_keys (id, account_id, key_hash, api_key, created_at) values ($1, $2, $3, $4, $5)",
        [apiKey.id, apiKey.accountId, apiKey.keyHash, apiKey, apiKey.createdAt]
      );
      return apiKey;
    },

    async listApiKeys(accountId) {
      const db = await activePool();
      const result = await db.query("select api_key from proof402_api_keys where account_id = $1 order by created_at desc", [
        accountId
      ]);
      return result.rows.map((row) => row.api_key);
    },

    async getApiKey(id) {
      const db = await activePool();
      const result = await db.query("select api_key from proof402_api_keys where id = $1", [id]);
      return result.rows[0]?.api_key;
    },

    async getApiKeyByHash(keyHash) {
      const db = await activePool();
      const result = await db.query("select api_key from proof402_api_keys where key_hash = $1", [keyHash]);
      return result.rows[0]?.api_key;
    },

    async touchApiKey(id, usedAt) {
      const apiKey = await this.getApiKey(id);
      if (!apiKey) return undefined;
      const updated = { ...apiKey, lastUsedAt: usedAt };
      const db = await activePool();
      await db.query("update proof402_api_keys set api_key = $2 where id = $1", [id, updated]);
      return updated;
    },

    async revokeApiKey(id, revokedAt) {
      const apiKey = await this.getApiKey(id);
      if (!apiKey) return undefined;
      const updated = { ...apiKey, revokedAt, status: "revoked" };
      const db = await activePool();
      await db.query("update proof402_api_keys set api_key = $2 where id = $1", [id, updated]);
      return updated;
    },

    async createWebhook(webhook) {
      const db = await activePool();
      await db.query("insert into proof402_webhooks (id, account_id, webhook, created_at) values ($1, $2, $3, $4)", [
        webhook.id,
        webhook.accountId,
        webhook,
        webhook.createdAt
      ]);
      return webhook;
    },

    async listWebhooks(accountId) {
      const db = await activePool();
      const result = await db.query("select webhook from proof402_webhooks where account_id = $1 order by created_at desc", [
        accountId
      ]);
      return result.rows.map((row) => row.webhook);
    },

    async getWebhook(id) {
      const db = await activePool();
      const result = await db.query("select webhook from proof402_webhooks where id = $1", [id]);
      return result.rows[0]?.webhook;
    },

    async recordWebhookDelivery(delivery) {
      const db = await activePool();
      await db.query(
        "insert into proof402_webhook_deliveries (id, account_id, webhook_id, delivery, created_at) values ($1, $2, $3, $4, $5)",
        [delivery.id, delivery.accountId, delivery.webhookId, delivery, delivery.createdAt]
      );
      return delivery;
    },

    async updateWebhookDelivery(id, patch) {
      const db = await activePool();
      const result = await db.query("select delivery from proof402_webhook_deliveries where id = $1", [id]);
      const delivery = result.rows[0]?.delivery;
      if (!delivery) return undefined;
      const updated = { ...delivery, ...patch, updatedAt: new Date().toISOString() };
      await db.query("update proof402_webhook_deliveries set delivery = $2 where id = $1", [id, updated]);
      return updated;
    },

    async listWebhookDeliveries(filters = {}) {
      const db = await activePool();
      const limit = Math.max(1, Math.min(Number.parseInt(filters.limit, 10) || 20, 100));
      const values = [];
      const clauses = [];
      if (filters.accountId) {
        values.push(filters.accountId);
        clauses.push(`account_id = $${values.length}`);
      }
      if (filters.webhookId) {
        values.push(filters.webhookId);
        clauses.push(`webhook_id = $${values.length}`);
      }
      values.push(limit);
      const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
      const result = await db.query(
        `select delivery from proof402_webhook_deliveries ${where} order by created_at desc limit $${values.length}`,
        values
      );
      return result.rows.map((row) => row.delivery);
    },

    async close() {
      if (pool) {
        await pool.end();
        pool = undefined;
      }
    }
  };
}
