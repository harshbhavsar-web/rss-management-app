const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');

exports.getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createJoinRequest = async (req, res) => {
  const { name, phone, email, address } = req.body;
  try {
    const newRequest = new JoinRequest({ name, phone, email, address });
    await newRequest.save();

    // If user is logged in, mark them as having completed the join request
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { hasJoinRequest: true });
    }

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
