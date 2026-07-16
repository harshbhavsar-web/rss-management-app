const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Group = require('../models/Group');

// Helper to find eligible users for a meeting
const getEligibleUsersForMeeting = async (meeting) => {
  if (meeting.targetType === 'all') {
    return await User.find().select('_id');
  } else if (meeting.targetType === 'nagar') {
    return await User.find({ nagar: meeting.targetValue }).select('_id');
  } else if (meeting.targetType === 'shakha') {
    return await User.find({ shakha: meeting.targetValue }).select('_id');
  } else if (meeting.targetType === 'group') {
    let group = null;
    if (meeting.targetValue && mongoose.Types.ObjectId.isValid(meeting.targetValue)) {
      group = await Group.findById(meeting.targetValue);
    }
    if (!group) return [];
    return group.users.map(id => ({ _id: id }));
  }
  // Legacy or default
  return await User.find().select('_id');
};

exports.getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const isOwnShakha = (meeting.targetType === 'shakha' && meeting.targetValue === req.user.shakha.toString()) ||
                          (meeting.shakhas && meeting.shakhas.some(s => s.toString() === req.user.shakha.toString()));
      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only manage attendance for your assigned Shakha.' });
      }
    }

    // Check if attendance already exists
    let attendance = await Attendance.findOne({ meeting: meetingId }).populate('records.user', 'name email phone');
    
    // If not, generate dynamically
    if (!attendance) {
      const eligibleUsers = await getEligibleUsersForMeeting(meeting);
      
      const records = eligibleUsers.map(user => ({
        user: user._id,
        status: 'absent'
      }));
      
      attendance = new Attendance({
        meeting: meetingId,
        records
      });
      
      await attendance.save();
      // Populate user data before returning
      await attendance.populate('records.user', 'name email phone');
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { records } = req.body; // Array of { user, status }
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const isOwnShakha = (meeting.targetType === 'shakha' && meeting.targetValue === req.user.shakha.toString()) ||
                          (meeting.shakhas && meeting.shakhas.some(s => s.toString() === req.user.shakha.toString()));
      if (!isOwnShakha) {
        return res.status(403).json({ message: 'Access denied: You can only manage attendance for your assigned Shakha.' });
      }
    }

    let attendance = await Attendance.findOne({ meeting: meetingId });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Extract ObjectId safely if the frontend sends the fully populated user object
    const processedRecords = records.map(r => ({
      user: typeof r.user === 'object' && r.user !== null ? r.user._id : r.user,
      status: r.status
    }));
    
    attendance.records = processedRecords;
    await attendance.save();
    
    // Mark the meeting as completed since attendance has been saved
    await Meeting.findByIdAndUpdate(meetingId, { status: 'completed' });
    
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find all attendance sheets where the user is listed in records
    const attendances = await Attendance.find({ 'records.user': userId })
      .populate('meeting')
      .sort({ createdAt: -1 });

    // Filter out orphan attendance records where meeting is null/deleted
    const validAttendances = attendances.filter(att => att.meeting);
      
    const Shakha = require('../models/Shakha');
    const Group = require('../models/Group');
    
    // Resolve dynamic titles for each meeting
    for (let att of validAttendances) {
      const m = att.meeting;
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
      
    // Map to extract just this user's status for each meeting
    const userAttendanceHistory = validAttendances.map(att => {
      const userRecord = att.records.find(r => r.user && r.user.toString() === userId.toString());
      return {
        meetingId: att.meeting._id,
        meetingTitle: att.meeting.displayTitle || att.meeting.title || 'Nagar Baithak',
        date: att.meeting.date,
        time: att.meeting.time,
        meetingStatus: att.meeting.status || 'pending',
        status: userRecord ? userRecord.status : 'absent'
      };
    });
    
    res.json(userAttendanceHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
