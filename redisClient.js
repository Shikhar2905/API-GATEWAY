const redis = require('redis');

// Create a new Redis client instance
// By default, it connects to localhost on port 6379
const client = redis.createClient();


client.on('error', (err) => {                             // Event listener for error handling
  console.error('Redis Client Error:', err);
});


// Used to connect the client 
(async () => {
  try {
    await client.connect();                             // Establish connection to Redis server
    console.log('Redis connected');
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
})();

// Export the Redis client instance
module.exports = client;

