const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  airtableUserId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    default: function() {
      return `${this.airtableUserId}@airtable.user`;
    }
  },
  airtableProfile: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date
  },
  loginTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

