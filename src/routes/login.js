const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const User = require('../models/user.model.js');
const router = express.Router();

router.use(morgan('dev'));

// Session configuration
router.use(session({
    secret: 'secret', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the login page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      const user = await User.findOne({ email });
      if (user && await bcrypt.compare(password, user.password)) {
        // Set session data, including the image URL/path
        req.session.user = {
          _id: user._id,
          username: user.username,
          email: user.email,
          image: user.image || '', // Ensure this is correctly set
          created_at: Date.now() // This may not be necessary; adjust as needed
        };
        console.log('User logged in:', req.session.user); // Debugging line
        return res.status(200).json({ message: 'Logged In!!' });
      } else {
        req.session.message = 'Invalid email or password';
        return res.status(401).json({ message: 'Invalid email or password' }); // Changed to JSON response for consistency
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

module.exports = router;


