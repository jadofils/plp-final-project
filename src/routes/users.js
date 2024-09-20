const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const multer = require('multer');
const User = require('../models/user.model.js');
const Expense = require('../models/user.model.js');
const Category=require('../models/categories.model.js');
const PaymentMethod=require('../models/payment.model.js');
const Budget=require('../models/budget.model.js');
const Product=require('../models/products.model.js');
const mongoose=require('mongoose')
const router = express.Router();

// morgan determines the time HTTP REQUEST will take
router.use(morgan('dev'));

router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve register.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/register.html')); // Adjust the path as needed
});

// Get one user
router.get('/get-user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});

// Get all users
router.get('/get-users', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.status(200).json(users);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});



router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { username, email, password, password2 } = req.body;

    // Validate input
    if (!username || !email || !password || !password2) {
      console.log(req.body);
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== password2) {
      console.log(`Passwords do not match: ${password} != ${password2}`);
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if email already exists
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(401).json({ message: 'Email already exists!' });
    }

    // Log password to debug
    console.log('Password:', password);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save file path
    let imagePath = '';
    if (req.file) {
      imagePath = req.file.path;
    }

    // Create a new user with the hashed password and file path
    const user = await User.create({
      username,
      email,
      image: imagePath,
      password: hashedPassword,
      created_at: Date.now() // Fix: Call Date.now() to get the current timestamp
    });
    console.log('Data inserted successfully', req.body);

    res.status(200).json({ user: user });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});

// Update specific user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password } = req.body;

    // Check if the user exists
    const userExist = await User.findById(userId);
    if (!userExist) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    // Prepare the update data
    const updateData = {
      username: username || userExist.username, // Keep existing username if not provided
      email: email || userExist.email,
      created_at: Date.now() // Fix: Call Date.now() to get the current timestamp
    };

    // Hash the password if it's provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword; // Update password with hashed value
    }

    // Update the user's information
    const updatedUser = await User.findByIdAndUpdate(
      userId, // Find user by ID
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Update Failed. User not found.' });
    }

    return res.status(200).json({ message: `User ${updatedUser.username} updated successfully`, updatedUser });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error!' });
  }
});


// Delete specific users and related documents
router.delete('/:userId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    // Check if user exists
    const userExist = await User.findById(userId).session(session);

    if (!userExist) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User Not Found!!' });
    }

    // Delete related documents in other collections
    await Expense.deleteMany({ user_id: userId }).session(session);
    await Category.deleteMany({ user_id: userId }).session(session);
    await PaymentMethod.deleteMany({ user_id: userId }).session(session);
    await Product.deleteMany({ user_id: userId }).session(session);
    await Budget.deleteMany({ user_id: userId }).session(session);

    // Delete the user
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'User and related documents deleted successfully!' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal Server Error. Failed to Process Data.' });
  }
});

module.exports = router;
