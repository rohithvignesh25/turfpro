const express = require('express');
const router = express.Router();
const { protect, protectUser } = require('../../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
  generateBookingUpiQr
} = require('../../controllers/User/userBookingController');

router.use(protect, protectUser);

router.route('/')
  .post(createBooking)
  .get(getMyBookings);

router.post('/generate-upi-qr', generateBookingUpiQr);
router.get('/:id', getBookingDetails);
router.post('/:id/cancel', cancelBooking);

module.exports = router;
