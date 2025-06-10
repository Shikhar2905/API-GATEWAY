const mongoose = require('mongoose');

const serviceConfigSchema = new mongoose.Schema({
  prefix: String,
  target: String,
  windowMs: Number,
  maxRequests: Number
});

module.exports = mongoose.model("serviceconfigs", serviceConfigSchema);


