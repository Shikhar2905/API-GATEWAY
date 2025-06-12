// redisClient.js
const redis = require('redis');

const client = redis.createClient(); // default 127.0.0.1:6379

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

(async () => {
  try {
    await client.connect(); // Important: connect before using
    console.log('Redis connected');
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
})();

module.exports = client;
