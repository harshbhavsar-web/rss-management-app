const mongoose = require('mongoose');

const ShakhaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  contact: {
    type: String,
  },
  karyavah: {
    name: String,
    contact: String
  },
  mukhyaShikshak: {
    name: String,
    contact: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Shakha', ShakhaSchema);
