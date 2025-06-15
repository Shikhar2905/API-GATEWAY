const express = require('express');
const pool = require('../dbConfig');                                        // MySQL connection pool
const redisClient = require('../redisClient');                              // Redis client instance
const authMiddleware = require('../middleware/auth');                       // Middleware to protect routes
const router = express.Router();


// GET all service configurations (with Redis cache)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.time("FetchConfigs");
    const cached = await redisClient.get('serviceconfigs');                 // Try fetching from Redis cache
    if (cached) {
      console.timeEnd("FetchConfigs");
      console.log("Returned from Redis Cache");
      return res.json(JSON.parse(cached));                        // If cached, return it
    }

    const [rows] = await pool.query('SELECT * FROM serviceconfigs');        // If not in cache, fetch from DB

    await redisClient.setEx('serviceconfigs', 60, JSON.stringify(rows));    // Cache the result for 60 seconds

    console.timeEnd("FetchConfigs");
    console.log("Returned from MySQL");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});


// GET a specific service configuration by ID (with Redis cache)
router.get('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const cached = await redisClient.get(`serviceconfig:${id}`);                            // Try fetching specific config from Redis
    if (cached) return res.json(JSON.parse(cached));                                        // Return if cached

    const [rows] = await pool.query('SELECT * FROM serviceconfigs WHERE id = ?', [id]);     // If not cached, query DB
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    
    await redisClient.setEx(`serviceconfig:${id}`, 60, JSON.stringify(rows[0]));            // Cache the result for 60 seconds
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// POST - Create a new service configuration
router.post('/', authMiddleware, async (req, res) => {
  const { prefix, target, windowMS, maxRequests } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO serviceconfigs (prefix, target, windowMS, maxRequests) VALUES (?, ?, ?, ?)',
      [prefix, target, windowMS, maxRequests]
    );
   
    await redisClient.del('serviceconfigs');                                                // Clear the cache for all service configs

    res.status(201).json({ id: result.insertId, prefix, target, windowMS, maxRequests });
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
});


// PUT - Update a service configuration by ID
router.put('/:id', authMiddleware, async (req, res) => {
  const { prefix, target, windowMS, maxRequests } = req.body;
  const id = req.params.id;

  try {
    const [result] = await pool.query(
      'UPDATE serviceconfigs SET prefix = ?, target = ?, windowMS = ?, maxRequests = ? WHERE id = ?',
      [prefix, target, windowMS, maxRequests, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });

    await redisClient.del('serviceconfigs');                                               // Invalidate the updated cache entries
    await redisClient.del(`serviceconfig:${id}`);

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid update' });
  }
});


// DELETE - Remove a service configuration by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const [result] = await pool.query('DELETE FROM serviceconfigs WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });

    await redisClient.del('serviceconfigs');                                                // Invalidate cache after deletion
    await redisClient.del(`serviceconfig:${id}`);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send('Delete operation failed');
  }
});


module.exports = router;