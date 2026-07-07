const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/Super_admin/authRoutes');
const turfRoutes = require('./routes/Super_admin/turfRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const turfAdminRoutes = require('./routes/Super_admin/turfAdminRoutes');

// Turf Admin Portal Routes
const turfAdminTurfRoutes = require('./routes/Turf_admin/turfRoutes');
const turfAdminSlotRoutes = require('./routes/Turf_admin/slotRoutes');

// Unified Auth Routes
const unifiedAuthRoutes = require('./routes/authRoutes');

// User End Portal Routes
const userAuthRoutes = require('./routes/User/userAuthRoutes');
const userProfileRoutes = require('./routes/User/userProfileRoutes');
const userDashboardRoutes = require('./routes/User/userDashboardRoutes');
const userTurfRoutes = require('./routes/User/userTurfRoutes');
const userBookingRoutes = require('./routes/User/userBookingRoutes');
const userNotificationRoutes = require('./routes/User/userNotificationRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Super Admin Routes
app.use('/api/admin', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/turf-admins', turfAdminRoutes);

// Unified Auth Route (Centralized Admin Login)
app.use('/api/auth', unifiedAuthRoutes);

// Turf Admin Portal Routes
app.use('/api/turf-admin/turf', turfAdminTurfRoutes);
app.use('/api/turf-admin/slots', turfAdminSlotRoutes);

// User End Portal Routes
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/user/profile', userProfileRoutes);
app.use('/api/user/dashboard', userDashboardRoutes);
app.use('/api/user/turfs', userTurfRoutes);
app.use('/api/user/bookings', userBookingRoutes);
app.use('/api/user/notifications', userNotificationRoutes);

// Make the uploads folder static so images can be accessed directly via URL
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Basic health check route
app.get('/', (req, res) => {
  res.send('TurfPro API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
