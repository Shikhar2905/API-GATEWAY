// CRUD API Routing

const express = require('express');
const router = express.Router();
const serviceconfigs = require('../models/ServiceConfig');


// GET all configs - without Redis
router.get('/', async (req, res) => {
  try {
    const server_configuration = await serviceconfigs.find();
    res.json(server_configuration);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET one config by ID
router.get('/:id', async (req, res) => {
  try {
    const server_configuration = await serviceconfigs.findById(req.params.id);
    if (!server_configuration) return res.status(404).json({ error: 'Not found' });
    res.json(server_configuration);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// CREATE new config
router.post('/', async (req, res) => {
  try {
    const newConfig = new serviceconfigs(req.body);
    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
});


// UPDATE config
router.put('/:id', async (req, res) => {
  try {
    const updated = await serviceconfigs.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Invalid update' });
  }
});


// DELETE config
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await serviceconfigs.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
