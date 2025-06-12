// CRUD API Routing

const express = require('express');
const router = express.Router();
const serviceconfigs = require('../models/ServiceConfig');
const redisClient = require('../redisClient');


// GET all configs - without Redis
/*
router.get('/', async (req, res) => {
  try {
    const server_configuration = await serviceconfigs.find();
    res.json(server_configuration);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/


// GET all configs using Redis
router.get('/', async (req, res) => {
  try {
    console.time("FetchConfigs");

    const cachedData = await redisClient.get('serviceconfigs');    //Try to get data from Redis cache
    
    if (cachedData) {
      console.timeEnd("FetchConfigs");
      console.log("Returned from Redis Cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    //If not in cache, get from MongoDB
    const server_configuration = await serviceconfigs.find();                   
    await redisClient.setEx('serviceconfigs', 60, JSON.stringify(server_configuration));    //Set cache with 60s expiry
    
    // await redisClient.setEx('serviceconfigs', 60, server_configuration)                  // This line will give error as redis accepts onlu string and buffer values, not objects

    console.timeEnd("FetchConfigs");
    console.log("Returned from MongoDB");
    return res.status(200).json(server_configuration);

  } 
  catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
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
