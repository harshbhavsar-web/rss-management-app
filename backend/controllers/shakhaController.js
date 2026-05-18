const Shakha = require('../models/Shakha');

exports.getShakhas = async (req, res) => {
  try {
    const shakhas = await Shakha.find();
    res.json(shakhas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShakhaById = async (req, res) => {
  try {
    const shakha = await Shakha.findById(req.params.id);
    if (!shakha) return res.status(404).json({ message: 'Shakha not found' });
    res.json(shakha);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createShakha = async (req, res) => {
  const { name, location, description, contact, karyavah, mukhyaShikshak } = req.body;
  try {
    const newShakha = new Shakha({ name, location, description, contact, karyavah, mukhyaShikshak });
    await newShakha.save();
    res.status(201).json(newShakha);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateShakha = async (req, res) => {
  try {
    const updatedShakha = await Shakha.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedShakha) return res.status(404).json({ message: 'Shakha not found' });
    res.json(updatedShakha);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteShakha = async (req, res) => {
  try {
    const deletedShakha = await Shakha.findByIdAndDelete(req.params.id);
    if (!deletedShakha) return res.status(404).json({ message: 'Shakha not found' });
    res.json({ message: 'Shakha deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
