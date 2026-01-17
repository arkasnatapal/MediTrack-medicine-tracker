const Redis = require('ioredis');

// Setup Redis connection
let connection;
let redisOptions;

if (process.env.REDIS_URL) {
  console.log('🔗 Using REDIS_URL from environment');
  connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: { rejectUnauthorized: false } // Frequently needed for cloud redis (Upstash) over TLS
  });
} else {
  redisOptions = {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, 
    enableReadyCheck: false,
  };
  connection = new Redis(redisOptions);
}

connection.on('connect', () => {
  console.log('✅ Connected to Redis for Living Health OS');
});

connection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

module.exports = {
  connection,
  redisOptions
};

