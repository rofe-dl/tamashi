const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userHandle: {
    type: String,
    required: true,
    unique: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
