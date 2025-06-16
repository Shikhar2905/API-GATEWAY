const express = require('express');
const pool = require('../dbConfig');
const redisClient = require('../redisClient');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const cacheKey = `environments:${clientId}`;
  console.time(`Fetch:${cacheKey}`);
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.timeEnd(`Fetch:${cacheKey}`);
    console.log(`Returned ${cacheKey} from Redis`);
    return res.json(JSON.parse(cached));
  }
  const [rows] = await pool.query('SELECT * FROM environment WHERE client_id=?',[clientId]);
  await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));
  console.timeEnd(`Fetch:${cacheKey}`);
  console.log(`Returned ${cacheKey} from DB`);
  res.json(rows);
});

// CREATE
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { env_type } = req.body;
  const [r] = await pool.query('INSERT INTO environment (env_type,client_id) VALUES(?,?)',[env_type,clientId]);
  await redisClient.del(`environments:${clientId}`);
  res.status(201).json({ envId: r.insertId });
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;const id = req.params.id;
  const { env_type } = req.body;
  const [r] = await pool.query(
    'UPDATE environment SET env_type=? WHERE env_id=? AND client_id=?',
    [env_type,id,clientId]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
  await redisClient.del(`environments:${clientId}`);
  res.json({ message: 'Updated' });
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;const id = req.params.id;
  const [r] = await pool.query('DELETE FROM environment WHERE env_id=? AND client_id=?',[id,clientId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
  await redisClient.del(`environments:${clientId}`);
  res.json({ message: 'Deleted' });
});

module.exports = router;