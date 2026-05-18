const express = require('express');
const router = express.Router();
const { getGroups, createGroup, updateGroup, deleteGroup } = require('../controllers/groupController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getGroups);
router.post('/', protect, adminOnly, createGroup);
router.put('/:id', protect, adminOnly, updateGroup);
router.delete('/:id', protect, adminOnly, deleteGroup);

module.exports = router;
