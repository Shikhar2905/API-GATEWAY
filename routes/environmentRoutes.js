const express = require('express');              // Express router
const pool = require('../dbConfig');             // MySQL pool
const redisClient = require('../redisClient');   // Redis client
const auth = require('../middleware/auth');      // Auth middleware
const router = express.Router();                 // Create router


// GET all environments for a client
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;                                           // Retrieve client ID from JWT
  const cacheKey = `environments:${clientId}`;                                  // Redis key
  console.time(`Fetch:${cacheKey}`);                                            // Start timer

  const cached = await redisClient.get(cacheKey);                               // Try cache
  if (cached) {
    console.timeEnd(`Fetch:${cacheKey}`);                                       // End timer
    console.log(`Returned ${cacheKey} from Redis`);                             // Log source
    return res.json(JSON.parse(cached));                                        // Return cached data
  }

  const [rows] = await pool.query(                                              // Fetch from DB
    'SELECT * FROM environment WHERE client_id=?',
    [clientId]
  );
  await redisClient.setEx(cacheKey, 60, JSON.stringify(rows)); // Cache result

  console.timeEnd(`Fetch:${cacheKey}`);                                         // End timer
  console.log(`Returned ${cacheKey} from DB`);                                  // Log source
  res.json(rows);                                                               // Return DB data
});


// CREATE a new environment
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;                                          
  const { env_type } = req.body;                                                // From request body

  const [r] = await pool.query(                                                 // Insert record
    'INSERT INTO environment (env_type,client_id) VALUES(?,?)',
    [env_type, clientId]
  );

  await redisClient.del(`environments:${clientId}`);                            // Invalidate cache
  res.status(201).json({ envId: r.insertId });                                  // Return new ID
});


// UPDATE an existing environment
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;                                           
  const id = req.params.id;                                                     // Env ID
  const { env_type } = req.body;                                                // New type

  const [r] = await pool.query(                                                 // Update record
    'UPDATE environment SET env_type=? WHERE env_id=? AND client_id=?',
    [env_type, id, clientId]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });     // Not found

  await redisClient.del(`environments:${clientId}`); // Invalidate cache
  res.json({ message: 'Updated' });                                             // Success
});

// DELETE an environment
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;                                           
  const id = req.params.id;                                                     // Env ID

  const [r] = await pool.query(                                                 // Delete record
    'DELETE FROM environment WHERE env_id=? AND client_id=?',
    [id, clientId]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });     // Not found

  await redisClient.del(`environments:${clientId}`);                            // Invalidate cache
  res.json({ message: 'Deleted' });                                             // Success
});

module.exports = router;                                                        // Export router