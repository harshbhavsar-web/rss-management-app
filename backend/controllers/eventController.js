const Event = require('../models/Event');
const { isFutureDateTime, isExpired } = require('../utils/dateValidator');

const User = require('../models/User');
const Group = require('../models/Group');
exports.getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let query = {};
    
    if (user.role !== 'admin') {
      const filters = [{ targetType: 'all' }];
      if (user.nagar) filters.push({ targetType: 'nagar', targetValue: user.nagar });
      if (user.shakha) filters.push({ targetType: 'shakha', targetValue: user.shakha.toString() });
      
      const userGroups = await Group.find({ users: user._id }).select('_id');
      const userGroupIds = userGroups.map(g => g._id.toString());
      
      if (userGroupIds.length > 0) {
        filters.push({ targetType: 'group', targetValue: { $in: userGroupIds } });
      }
      filters.push({ targetType: { $exists: false } });
      
      query = { $or: filters };
    }

    const events = await Event.find(query).populate('shakhas', 'name location').lean();
    
    let finalEvents = events;
    if (user.role !== 'admin') {
      finalEvents = events.filter(e => !isExpired(e));
    }
    
    res.json(finalEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  const { title, date, time, description, shakhas, targetType, targetValue } = req.body;
  if (!isFutureDateTime(date, time)) {
    return res.status(400).json({ message: 'Event date and time must be in the future.' });
  }
  try {
    const newEvent = new Event({ title, date, time, description, shakhas, targetType, targetValue });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (date && time && !isFutureDateTime(date, time)) {
      return res.status(400).json({ message: 'Event date and time must be in the future.' });
    }
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEvent) return res.status(404).json({ message: 'Event not found' });
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
