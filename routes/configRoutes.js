const express = require('express');
const router = express.Router();
const serviceconfigs = require('../models/ServiceConfig');
const redisClient = require('../redisClient');

// GET all configurations using Redis
router.get('/', async (req, res) => {
  try {
    console.time("FetchConfigs");

    const cachedData = await redisClient.get('serviceconfigs');

    if (cachedData) {
      console.timeEnd("FetchConfigs");
      console.log("Returned from Redis Cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    const server_configuration = await serviceconfigs.find();

    await redisClient.setEx('serviceconfigs', 60, JSON.stringify(server_configuration));

    console.timeEnd("FetchConfigs");
    console.log("Returned from MongoDB");
    return res.status(200).json(server_configuration);

  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET one config by ID 
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const cachedConfig = await redisClient.get(`serviceconfig:${id}`);
    if (cachedConfig) return res.json(JSON.parse(cachedConfig));

    const server_configuration = await serviceconfigs.findById(id);
    if (!server_configuration) return res.status(404).json({ error: 'Not found' });

    await redisClient.setEx(`serviceconfig:${id}`, 60, JSON.stringify(server_configuration));
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

    // Invalidate or update the cache
    await redisClient.del('serviceconfigs');

    res.status(201).json(newConfig);
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// UPDATE config
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await serviceconfigs.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Invalidate global and specific cache
    await redisClient.del('serviceconfigs');
    await redisClient.del(`serviceconfig:${id}`);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Invalid update' });
  }
});

// DELETE config
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await serviceconfigs.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: 'Not found' });

    // Invalidate global and specific cache
    await redisClient.del('serviceconfigs');
    await redisClient.del(`serviceconfig:${id}`);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send('Delete operation failed! Id not found');
  }
});

module.exports = router;