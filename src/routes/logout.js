const express = require('express');
const session = require('express-session');
const router=express.Router()

// Session configuration
router.use(session({
      secret: 'your-secret-key', // Replace with a strong secret
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
  }));
// Logout route
router.get('/', (req, res) => {
      req.session.destroy((err) => {
          if (err) {
              console.error('Error during logout:', err);
              return res.status(500).json({ message: 'Logout failed.' });
          }
          // Redirect the user to the login page after successful logout
          res.redirect('/api/login');
      });
  });
  module.exports=router