const mongoose = require('mongoose');
const User = require('./models/user');

module.exports.addUser = async (userHandle, refreshToken) => {
  return await User.create({ userHandle, refreshToken });
};

module.exports.getUser = async (userHandle) => {
  return await User.findOne({ userHandle });
};

module.exports.deleteUser = async (userHandle) => {
  await User.findOneAndDelete({ userHandle });
};
