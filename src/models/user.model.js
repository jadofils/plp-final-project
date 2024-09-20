const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Your Username Cannot Be Null!!'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email Address Should Not Be Null!!'],
  },
  image: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now, // Set default to current date and time
  },
  updated_at: {
    type: Date,
    default: Date.now, // Set default to current date and time
  },
});

// Pre-save hook to update `updated_at` before saving
UserSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updated_at = Date.now(); // Set updated_at to current date and time
  }
  next();
});

const User = mongoose.model('Users', UserSchema);

module.exports = User;
