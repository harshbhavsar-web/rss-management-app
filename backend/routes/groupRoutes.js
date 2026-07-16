const express = require('express');
const router = express.Router();
const { getGroups, createGroup, updateGroup, deleteGroup } = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getGroups);
router.post('/', protect, authorize('admin'), createGroup);
router.put('/:id', protect, authorize('admin'), updateGroup);
router.delete('/:id', protect, authorize('admin'), deleteGroup);

module.exports = router;
