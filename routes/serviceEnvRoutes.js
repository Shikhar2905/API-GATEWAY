const express = require('express');
const pool = require('../dbConfig');
const auth = require('../middleware/auth');
const router = express.Router();

// Create service_env mapping with rate limits
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { mic_id, env_id, base_url, target_url, port, is_active, rate_limit, window_ms } = req.body;
  const [r] = await pool.query(
    `INSERT INTO service_env
       (mic_id, env_id, base_url, target_url, port, is_active, rate_limit, window_ms)
     SELECT m.mic_id, e.env_id, ?, ?, ?, ?, ?, ?
     FROM microservices m
     JOIN environment e ON m.client_id=e.client_id
     WHERE m.mic_id=? AND e.env_id=? AND m.client_id=?`,
    [base_url, target_url, port, is_active, rate_limit, window_ms, mic_id, env_id, clientId]
  );
  res.status(201).json({ serviceEnvId: r.insertId });
});

// Get mappings
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const [rows] = await pool.query(
    `SELECT se.* FROM service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     WHERE m.client_id=?`, [clientId]
  );
  res.json(rows);
});

// Update service_env mapping including rate limits
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;
  const { base_url, target_url, port, is_active, rate_limit, window_ms } = req.body;
  const [result] = await pool.query(
    `UPDATE service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     JOIN environment e ON se.env_id=e.env_id
     SET se.base_url=?, se.target_url=?, se.port=?, se.is_active=?,
         se.rate_limit=?, se.window_ms=?
     WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
    [base_url, target_url, port, is_active, rate_limit, window_ms, id, clientId, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found or unauthorized' });
  res.json({ message: 'Service mapping updated' });
});

// Delete service_env mapping
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;
  const [result] = await pool.query(
    `DELETE se FROM service_env se
     JOIN microservices m ON se.mic_id=m.mic_id
     JOIN environment e ON se.env_id=e.env_id
     WHERE se.service_env_id=? AND m.client_id=? AND e.client_id=?`,
    [id, clientId, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found or unauthorized' });
  res.json({ message: 'Service mapping deleted' });
});

module.exports = router;