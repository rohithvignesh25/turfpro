const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/Super_admin/authRoutes');
const turfRoutes = require('./routes/Super_admin/turfRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const turfAdminRoutes = require('./routes/Super_admin/turfAdminRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/turf-admins', turfAdminRoutes);

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
