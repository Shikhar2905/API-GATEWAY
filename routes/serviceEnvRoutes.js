// const express = require('express');
// const pool = require('../dbConfig');
// const redisClient = require('../redisClient');
// const auth = require('../middleware/auth');
// const router = express.Router();

// // GET all
// router.get('/', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const cacheKey = `serviceEnv:${clientId}`;
//   console.time(`Fetch:${cacheKey}`);
//   const cached = await redisClient.get(cacheKey);
//   if (cached) {
//     console.timeEnd(`Fetch:${cacheKey}`);
//     console.log(`Returned ${cacheKey} from Redis`);
//     return res.json(JSON.parse(cached));
//   }
//   const [rows] = await pool.query(
//     `SELECT se.* FROM service_env se JOIN microservices m ON se.mic_id=m.mic_id
//      WHERE m.client_id=?`,[clientId]
//   );
//   await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));
//   console.timeEnd(`Fetch:${cacheKey}`);
//   console.log(`Returned ${cacheKey} from DB`);
//   res.json(rows);
// });

// // CREATE
// router.post('/', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const { mic_id, env_id, base_url, target_url, port, is_active, rate_limit, window_ms } = req.body;
//   const [r] = await pool.query(
//     `INSERT INTO service_env (mic_id,env_id,base_url,target_url,port,is_active,rate_limit,window_ms)
//      SELECT m.mic_id,e.env_id,?,?,?,?,?,?
//      FROM microservices m JOIN environment e ON m.client_id=e.client_id
//      WHERE m.mic_id=? AND e.env_id=? AND m.client_id=?`,
//     [base_url,target_url,port,is_active,rate_limit,window_ms,mic_id,env_id,clientId]
//   );
//   await redisClient.del(`serviceEnv:${clientId}`);
//   res.status(201).json({ serviceEnvId: r.insertId });
// });

// // UPDATE
// router.put('/:id', auth, async (req, res) => {
//   const clientId = req.user.clientId;const id = req.params.id;
//   const { base_url,target_url,port,is_active,rate_limit,window_ms } = req.body;
//   const [r] = await pool.query(
//     `UPDATE service_env se JOIN microservices m ON se.mic_id=m.mic_id
//      JOIN environment e ON se.env_id=e.env_id
//      SET se.base_url=?,se.target_url=?,se.port=?,se.is_active=?,se.rate_limit=?,se.window_ms=?
//      WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
//     [base_url,target_url,port,is_active,rate_limit,window_ms,id,clientId,clientId]
//   );
//   if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
//   await redisClient.del(`serviceEnv:${clientId}`);
//   res.json({ message: 'Updated' });
// });

// // DELETE
// router.delete('/:id', auth, async (req, res) => {
//   const clientId = req.user.clientId;const id = req.params.id;
//   const [r] = await pool.query(
//     `DELETE se FROM service_env se JOIN microservices m ON se.mic_id=m.mic_id
//      JOIN environment e ON se.env_id=e.env_id
//      WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
//     [id,clientId,clientId]
//   );
//   if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
//   await redisClient.del(`serviceEnv:${clientId}`);
//   res.json({ message: 'Deleted' });
// });

// module.exports = router;






const express      = require('express');
const pool         = require('../dbConfig');
const redisClient  = require('../redisClient');
const auth         = require('../middleware/auth');
const router       = express.Router();

// GET all service→environment mappings
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const cacheKey = `serviceEnv:${clientId}`;

  console.time(`Fetch:${cacheKey}`);
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.timeEnd(`Fetch:${cacheKey}`);
    console.log(`Returned ${cacheKey} from Redis`);
    return res.json(JSON.parse(cached));
  }

  const [rows] = await pool.query(
    `SELECT se.* FROM service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     WHERE m.client_id=?`,
    [clientId]
  );

  await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));
  console.timeEnd(`Fetch:${cacheKey}`);
  console.log(`Returned ${cacheKey} from DB`);

  res.json(rows);
});

// CREATE a mapping
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const {
    mic_id, env_id, base_url, target_url,
    port, is_active, rate_limit, window_ms
  } = req.body;

  const [r] = await pool.query(
    `INSERT INTO service_env 
     (mic_id, env_id, base_url, target_url, port, is_active, rate_limit, window_ms)
     SELECT m.mic_id, e.env_id, ?,?,?,?,?,?,?
     FROM microservices m JOIN environment e
       ON m.client_id=e.client_id
     WHERE m.mic_id=? AND e.env_id=? AND m.client_id=?`,
    [base_url, target_url, port, is_active, rate_limit, window_ms, mic_id, env_id, clientId]
  );

  await redisClient.del(`serviceEnv:${clientId}`);
  res.status(201).json({ serviceEnvId: r.insertId });
});

// UPDATE a mapping
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;

  const {
    base_url, target_url, port, is_active,
    rate_limit, window_ms
  } = req.body;

  const [r] = await pool.query(
    `UPDATE service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     JOIN environment e  ON se.env_id=e.env_id
     SET se.base_url=?, se.target_url=?, se.port=?, se.is_active=?,
         se.rate_limit=?, se.window_ms=?
     WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
    [base_url, target_url, port, is_active, rate_limit, window_ms, id, clientId, clientId]
  );

  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

  await redisClient.del(`serviceEnv:${clientId}`);

  res.json({ message: 'Updated' });
});

// DELETE a mapping
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;

  const [r] = await pool.query(
    `DELETE se FROM service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     JOIN environment e  ON se.env_id=e.env_id
     WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
    [id, clientId, clientId]
  );

  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

  await redisClient.del(`serviceEnv:${clientId}`);
  
  res.json({ message: 'Deleted' });
});

module.exports = router;
