const express = require('express');
const router = express.Router();
const { protect, protectUser } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  updateProfilePicture
} = require('../../controllers/User/userProfileController');

router.use(protect, protectUser);

router.route('/')
  .get(getProfile)
  .put(updateProfile)
  .post(updateProfile);

// Explicit named routes (supporting both GET/PUT and POST)
router.get('/getprofile', getProfile);
router.post('/getprofile', getProfile);

router.put('/updateprofile', updateProfile);
router.post('/updateprofile', updateProfile);

router.put('/changepassword', changePassword);
router.post('/changepassword', changePassword);
router.put('/password', changePassword);
router.post('/password', changePassword);

router.put('/updatepicture', upload.single('image'), updateProfilePicture);
router.post('/updatepicture', upload.single('image'), updateProfilePicture);
router.put('/picture', upload.single('image'), updateProfilePicture);
router.post('/picture', upload.single('image'), updateProfilePicture);

module.exports = router;
