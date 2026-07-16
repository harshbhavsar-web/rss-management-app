const express = require('express');
const router = express.Router();
const { getShakhas, getShakhaById, createShakha, updateShakha, deleteShakha } = require('../controllers/shakhaController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getShakhas)
  .post(protect, authorize('admin'), createShakha);

router.route('/:id')
  .get(getShakhaById)
  .put(protect, authorize('admin'), updateShakha)
  .delete(protect, authorize('admin'), deleteShakha);

module.exports = router;
