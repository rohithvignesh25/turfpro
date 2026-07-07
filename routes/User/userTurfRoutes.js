const express = require('express');
const router = express.Router();
const {
  browseTurfs,
  getTurfDetails,
  getAvailableSlots
} = require('../../controllers/User/userTurfController');

router.get('/', browseTurfs);
router.get('/:id', getTurfDetails);
router.get('/:id/slots', getAvailableSlots);

module.exports = router;
