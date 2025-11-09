const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  parsed: {
    skills: {
      type: [String],
      default: []
    },
    projects: {
      type: [String],
      default: []
    },
    education: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    keywords: {
      type: [String],
      default: []
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
resumeSchema.index({ userId: 1 });
resumeSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);

