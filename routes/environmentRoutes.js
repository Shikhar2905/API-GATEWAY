const express = require('express');
const pool = require('../dbConfig');
const auth = require('../middleware/auth');
const router = express.Router();

// Create environment
router.post('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { env_type } = req.body;
  const [r] = await pool.query(
    'INSERT INTO environment (env_type, client_id) VALUES (?, ?)',
    [env_type, clientId]
  );
  res.status(201).json({ envId: r.insertId });
});

// Get environments
router.get('/', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const [rows] = await pool.query(
    'SELECT * FROM environment WHERE client_id=?', [clientId]
  );
  res.json(rows);
});

// Update & Delete similar to microservices

// Update microservice
router.put('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const { name, rate_limit, windowMS } = req.body;
  const id = req.params.id;
  const [result] = await pool.query(
    'UPDATE environment SET name=?, rate_limit=?, windowMS=? WHERE mic_id=? AND client_id=?',
    [name, rate_limit, windowMS, id, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Updated' });
});

// Delete microservice
router.delete('/:id', auth, async (req, res) => {
  const clientId = req.user.clientId;
  const id = req.params.id;
  const [result] = await pool.query(
    'DELETE FROM environment WHERE mic_id=? AND client_id=?', [id, clientId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});


module.exports = router;