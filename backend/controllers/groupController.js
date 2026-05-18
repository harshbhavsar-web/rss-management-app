const Group = require('../models/Group');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('users', 'name email phone role nagar shakha').sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, users } = req.body;
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group with this name already exists' });
    }
    const newGroup = new Group({ name, description, users: users || [] });
    await newGroup.save();
    
    const populatedGroup = await Group.findById(newGroup._id).populate('users', 'name email phone role nagar shakha');
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, description, users } = req.body;
    if (name) {
      const existingGroup = await Group.findOne({ name, _id: { $ne: req.params.id } });
      if (existingGroup) {
        return res.status(400).json({ message: 'Group with this name already exists' });
      }
    }
    
    // We update all fields including users
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id, 
      { name, description, users: users || [] }, 
      { new: true }
    ).populate('users', 'name email phone role nagar shakha');
    
    if (!updatedGroup) return res.status(404).json({ message: 'Group not found' });
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const deletedGroup = await Group.findByIdAndDelete(req.params.id);
    if (!deletedGroup) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
