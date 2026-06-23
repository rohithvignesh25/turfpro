const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Credential = require('./models/Credential');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check if the admin already exists
    const existingAdmin = await Credential.findOne({ username: 'turfpro@gmail.com' });
    if (!existingAdmin) {
      await Credential.create({
        username: 'turfpro@gmail.com',
        password: 'turfpro@turfpro'
      });
      console.log('Admin credentials seeded successfully!');
    } else {
      console.log('Admin already exists. No action taken.');
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
