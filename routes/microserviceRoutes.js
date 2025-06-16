// const express = require('express');
// const pool = require('../dbConfig');
// const redisClient = require('../redisClient');
// const auth = require('../middleware/auth');
// const router = express.Router();

// // GET all microservices for a client
// router.get('/', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const cacheKey = `microservices:${clientId}`;

//   console.time(`Fetch:${cacheKey}`);
//   const cached = await redisClient.get(cacheKey);
//   if (cached) {
//     console.timeEnd(`Fetch:${cacheKey}`);
//     console.log(`Returned ${cacheKey} from Redis`);
//     return res.json(JSON.parse(cached));
//   }
//   const [rows] = await pool.query('SELECT * FROM microservices WHERE client_id=?',[clientId]);
//   await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));
//   console.timeEnd(`Fetch:${cacheKey}`);
//   console.log(`Returned ${cacheKey} from DB`);
//   res.json(rows);
// });

// // CREATE
// router.post('/', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const { name, rate_limit, windowMS } = req.body;
//   const [r] = await pool.query(
//     'INSERT INTO microservices (client_id,name,rate_limit,windowMS) VALUES(?,?,?,?)',
//     [clientId,name,rate_limit,windowMS]
//   );
//   await redisClient.del(`microservices:${clientId}`);
//   res.status(201).json({ micId: r.insertId });
// });

// // UPDATE
// router.put('/:id', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const id = req.params.id;
//   const { name, rate_limit, windowMS } = req.body;
//   const [r] = await pool.query(
//     'UPDATE microservices SET name=?,rate_limit=?,windowMS=? WHERE mic_id=? AND client_id=?',
//     [name,rate_limit,windowMS,id,clientId]
//   );
//   if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
//   await redisClient.del(`microservices:${clientId}`);
//   res.json({ message: 'Updated' });
// });

// // DELETE
// router.delete('/:id', auth, async (req, res) => {
//   const clientId = req.user.clientId;
//   const id = req.params.id;
//   const [r] = await pool.query('DELETE FROM microservices WHERE mic_id=? AND client_id=?',[id,clientId]);
//   if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
//   await redisClient.del(`microservices:${clientId}`);
//   res.json({ message: 'Deleted' });
// });

// module.exports = router;




const express      = require('express');          
const pool         = require('../dbConfig');      
const redisClient  = require('../redisClient');   
const auth         = require('../middleware/auth');
const router       = express.Router();

// GET all microservices for a client
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;                 // From JWT
  const cacheKey = `microservices:${clientId}`;       // Cache key

  console.time(`Fetch:${cacheKey}`);
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.timeEnd(`Fetch:${cacheKey}`);
    console.log(`Returned ${cacheKey} from Redis`);
    return res.json(JSON.parse(cached));
  }

  const [rows] = await pool.query(                     // DB call
    'SELECT * FROM microservices WHERE client_id=?',
    [clientId]
  );

  await redisClient.setEx(cacheKey, 60, JSON.stringify(rows)); // Cache
  console.timeEnd(`Fetch:${cacheKey}`);
  console.log(`Returned ${cacheKey} from DB`);

  res.json(rows);
});

// CREATE a microservice
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { name, rate_limit, windowMS } = req.body;

  const [r] = await pool.query(
    'INSERT INTO microservices (client_id,name,rate_limit,windowMS) VALUES (?,?,?,?)',
    [clientId, name, rate_limit, windowMS]
  );

  await redisClient.del(`microservices:${clientId}`);  // Invalidate cache
  res.status(201).json({ micId: r.insertId });
});

// UPDATE a microservice
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id       = req.params.id;
  const { name, rate_limit, windowMS } = req.body;

  const [r] = await pool.query(
    'UPDATE microservices SET name=?,rate_limit=?,windowMS=? WHERE mic_id=? AND client_id=?',
    [name, rate_limit, windowMS, id, clientId]
  );

  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

  await redisClient.del(`microservices:${clientId}`);
  res.json({ message: 'Updated' });
});

// DELETE a microservice
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id       = req.params.id;

  const [r] = await pool.query(
    'DELETE FROM microservices WHERE mic_id=? AND client_id=?',
    [id, clientId]
  );
  
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

  await redisClient.del(`microservices:${clientId}`);
  res.json({ message: 'Deleted' });
});

module.exports = router;
