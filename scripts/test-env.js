process.env.NODE_ENV = "test";
process.env.PROOF402_PROFILE = "test";
process.env.PORT = process.env.PORT || "4022";
process.env.HOST = "127.0.0.1";
process.env.PUBLIC_BASE_URL = "http://127.0.0.1:4022";
process.env.X402_ENABLED = process.env.X402_ENABLED || "false";
process.env.X402_PRICE = process.env.X402_PRICE || "$0.003";
process.env.X402_NETWORK = process.env.X402_NETWORK || "eip155:84532";
process.env.STORE_DRIVER = process.env.STORE_DRIVER || "memory";
process.env.STORE_FILE = process.env.STORE_FILE || ":memory:";
process.env.RECEIPT_KEY_ID = process.env.RECEIPT_KEY_ID || "test-key";
process.env.RECEIPT_SECRET =
  process.env.RECEIPT_SECRET || "test-proof402-receipt-secret-with-enough-length";
process.env.LOG_LEVEL = "silent";
process.env.REQUEST_LOG_ENABLED = "false";
process.env.PROOF402_ADMIN_KEY = process.env.PROOF402_ADMIN_KEY || "test-proof402-admin-key-with-enough-length";
