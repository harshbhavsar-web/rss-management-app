const express = require('express');
const router = express.Router();
const { getShakhas, getShakhaById, createShakha, updateShakha, deleteShakha } = require('../controllers/shakhaController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getShakhas)
  .post(protect, adminOnly, createShakha);

router.route('/:id')
  .get(getShakhaById)
  .put(protect, adminOnly, updateShakha)
  .delete(protect, adminOnly, deleteShakha);

module.exports = router;
