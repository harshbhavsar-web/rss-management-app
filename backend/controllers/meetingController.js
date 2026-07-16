const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const { isFutureDateTime, isExpired } = require('../utils/dateValidator');

const User = require('../models/User');
const Group = require('../models/Group');
exports.getMeetings = async (req, res) => {
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
      // Legacy meetings without targetType:
      filters.push({ targetType: { $exists: false } });
      
      query = { $or: filters };
    }

    const meetings = await Meeting.find(query).populate('shakhas', 'name location').lean();
    
    const Shakha = require('../models/Shakha');
    
    for (let m of meetings) {
      if (m.targetType === 'all') m.displayTitle = 'General Meeting';
      else if (m.targetType === 'nagar') m.displayTitle = `${m.targetValue} Baithak`;
      else if (m.targetType === 'shakha') {
        let shakha = null;
        if (m.targetValue && mongoose.Types.ObjectId.isValid(m.targetValue)) {
          shakha = await Shakha.findById(m.targetValue);
        }
        m.displayTitle = shakha ? `${shakha.name} Baithak` : 'Shakha Baithak';
      } else if (m.targetType === 'group') {
        let group = null;
        if (m.targetValue && mongoose.Types.ObjectId.isValid(m.targetValue)) {
          group = await Group.findById(m.targetValue);
        }
        m.displayTitle = group ? `${group.name} Meeting` : 'Group Meeting';
      } else {
        m.displayTitle = m.title || 'Nagar Baithak';
      }
    }
    
    // Fetch all attendance records for these meetings
    const Attendance = require('../models/Attendance');
    const meetingIds = meetings.map(m => m._id);
    const attendances = await Attendance.find({ meeting: { $in: meetingIds } }).lean();
    
    const attendanceMap = {};
    attendances.forEach(att => {
      const records = att.records || [];
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      attendanceMap[att.meeting.toString()] = total > 0 ? Math.round((present / total) * 100) : 0;
    });

    for (let m of meetings) {
       m.attendancePercentage = attendanceMap[m._id.toString()] || 0;
    }
    
    // Filter out expired meetings for non-admins
    let finalMeetings = meetings;
    if (user.role !== 'admin') {
      finalMeetings = meetings.filter(m => !isExpired(m));
    }
    
    res.json(finalMeetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  const { shakhas, date, time, location, targetType, targetValue } = req.body;
  if (!isFutureDateTime(date, time)) {
    return res.status(400).json({ message: 'Meeting date and time must be in the future.' });
  }

  let finalShakhas = shakhas;
  let finalTargetType = targetType;
  let finalTargetValue = targetValue;

  if (req.user.role !== 'admin') {
    if (!req.user.shakha) {
      return res.status(403).json({ message: 'Access denied: You must be assigned to a Shakha to create meetings.' });
    }
    finalShakhas = [req.user.shakha];
    finalTargetType = 'shakha';
    finalTargetValue = req.user.shakha.toString();
  }

  try {
    const newMeeting = new Meeting({ 
      shakhas: finalShakhas, 
      date, 
      time, 
      location, 
      targetType: finalTargetType, 
      targetValue: finalTargetValue 
    });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (date && time && !isFutureDateTime(date, time)) {
      return res.status(400).json({ message: 'Meeting date and time must be in the future.' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const isOwnShakha = (meeting.targetType === 'shakha' && meeting.targetValue === req.user.shakha.toString()) ||
                          (meeting.shakhas && meeting.shakhas.some(s => s.toString() === req.user.shakha.toString()));

      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only update meetings for your assigned Shakha.' });
      }

      req.body.shakhas = [req.user.shakha];
      req.body.targetType = 'shakha';
      req.body.targetValue = req.user.shakha.toString();
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMeeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const isOwnShakha = (meeting.targetType === 'shakha' && meeting.targetValue === req.user.shakha.toString()) ||
                          (meeting.shakhas && meeting.shakhas.some(s => s.toString() === req.user.shakha.toString()));

      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only delete meetings for your assigned Shakha.' });
      }
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
