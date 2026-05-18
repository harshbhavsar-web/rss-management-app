const Notification = require('../models/Notification');
const { isFutureDateTime, isExpired } = require('../utils/dateValidator');
const User = require('../models/User');
const Group = require('../models/Group');

exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let query = {};
    
    // Admins see all notifications. Users see targeted notifications.
    if (user.role === 'admin') {
      query = {}; // all
    } else {
      const fetchFilters = [{ type: 'nagar-level' }]; // Fallback for legacy notifications
      
      const targetFilters = [{ targetType: 'all' }];
      if (user.nagar) targetFilters.push({ targetType: 'nagar', targetValue: user.nagar });
      if (user.shakha) targetFilters.push({ targetType: 'shakha', targetValue: user.shakha });
      
      const userGroups = await Group.find({ users: user._id }).select('_id');
      const userGroupIds = userGroups.map(g => g._id);
      
      if (userGroupIds.length > 0) {
        targetFilters.push({ targetType: 'group', targetValue: { $in: userGroupIds } });
      }
      targetFilters.push({ targetType: { $exists: false } });
      
      if (user.shakha) {
        fetchFilters.push({ shakhas: user.shakha });
      }
      
      query = { $or: [{ $and: [{ targetType: { $exists: false } }, { $or: fetchFilters }] }, ...targetFilters] };
    }
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).populate('shakhas', 'name');
    
    // Map isRead status from user.readNotifications safely
    const mappedNotifications = notifications.map(notif => {
      return {
        ...notif.toObject(),
        isRead: (user.readNotifications || []).includes(notif._id)
      };
    });
    
    // Filter out expired notifications for non-admins
    let finalNotifications = mappedNotifications;
    if (user.role !== 'admin') {
      finalNotifications = mappedNotifications.filter(n => !isExpired(n));
    }
    
    res.json(finalNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  const { title, message, date, time, shakhas, type, targetType, targetValue } = req.body;
  if (!isFutureDateTime(date, time)) {
    return res.status(400).json({ message: 'Notification date and time must be in the future.' });
  }
  try {
    const newNotif = new Notification({ title, message, date, time, shakhas, type, targetType, targetValue });
    await newNotif.save();
    res.status(201).json(newNotif);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.readNotifications) user.readNotifications = [];
    
    if (!user.readNotifications.includes(req.params.id)) {
      user.readNotifications.push(req.params.id);
      await user.save();
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    
    // Optionally clean up users' read lists, but dangling references aren't breaking Mongoose
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
