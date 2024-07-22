const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // добавьте другие поля, если необходимо
});

module.exports = mongoose.model('User', userSchema);
