const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  data: [{
    fieldId: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed,
    files: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String
    }]
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for better query performance
submissionSchema.index({ formId: 1, 'metadata.submittedAt': -1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema); 