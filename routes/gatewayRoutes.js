const express = require('express');
const pool = require('../dbConfig');
const redisClient = require('../redisClient');
const auth = require('../middleware/auth');
const router = express.Router();

// Public clients
router.get('/clients', async (req, res) => {
  const key = 'gateway:clients';
  console.time(`Fetch:${key}`);
  const cached = await redisClient.get(key);
  if (cached) {
    console.timeEnd(`Fetch:${key}`);
    console.log(`Returned ${key} from Redis`);
    return res.json(JSON.parse(cached));
  }
  const [rows] = await pool.query('SELECT client_id,name,email,created_at FROM client');
  await redisClient.setEx(key, 60, JSON.stringify(rows));
  console.timeEnd(`Fetch:${key}`);
  console.log(`Returned ${key} from DB`);
  res.json(rows);
});

// Protected full overview
router.get('/full-overview', auth, async (req, res) => {
  const key = 'gateway:full';
  console.time(`Fetch:${key}`);
  const cached = await redisClient.get(key);
  if (cached) {
    console.timeEnd(`Fetch:${key}`);
    console.log(`Returned ${key} from Redis`);
    return res.json(JSON.parse(cached));
  }
  const [data] = await pool.query(`SELECT c.client_id,c.name AS client,m.mic_id,m.name AS service,e.env_id,e.env_type,se.service_env_id,se.base_url,se.target_url,se.port,se.is_active FROM client c LEFT JOIN microservices m ON c.client_id=m.client_id LEFT JOIN service_env se ON m.mic_id=se.mic_id LEFT JOIN environment e ON se.env_id=e.env_id`);
  await redisClient.setEx(key, 60, JSON.stringify(data));
  console.timeEnd(`Fetch:${key}`);
  console.log(`Returned ${key} from DB`);
  res.json(data);
});

module.exports = router;