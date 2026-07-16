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

  let finalShakhas = shakhas;
  let finalTargetType = targetType;
  let finalTargetValue = targetValue;

  if (req.user.role !== 'admin') {
    if (!req.user.shakha) {
      return res.status(403).json({ message: 'Access denied: You must be assigned to a Shakha to create events.' });
    }
    finalShakhas = [req.user.shakha];
    finalTargetType = 'shakha';
    finalTargetValue = req.user.shakha.toString();
  }

  try {
    const newEvent = new Event({ 
      title, 
      date, 
      time, 
      description, 
      shakhas: finalShakhas, 
      targetType: finalTargetType, 
      targetValue: finalTargetValue 
    });
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

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const isOwnShakha = (event.targetType === 'shakha' && event.targetValue === req.user.shakha.toString()) ||
                          (event.shakhas && event.shakhas.some(s => s.toString() === req.user.shakha.toString()));

      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only update events for your assigned Shakha.' });
      }

      req.body.shakhas = [req.user.shakha];
      req.body.targetType = 'shakha';
      req.body.targetValue = req.user.shakha.toString();
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const isOwnShakha = (event.targetType === 'shakha' && event.targetValue === req.user.shakha.toString()) ||
                          (event.shakhas && event.shakhas.some(s => s.toString() === req.user.shakha.toString()));

      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only delete events for your assigned Shakha.' });
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
