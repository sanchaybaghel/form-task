const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'select', 'checkbox', 'radio', 'textarea', 'file']
  },
  label: {
    type: String,
    required: true
  },
  placeholder: String,
  required: {
    type: Boolean,
    default: false
  },
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    fileTypes: [String],
    maxFileSize: Number
  },
  options: [{
    label: String,
    value: String
  }],
  order: {
    type: Number,
    required: true
  },
  settings: {
    multiple: {
      type: Boolean,
      default: false
    },
    defaultValue: mongoose.Schema.Types.Mixed
  }
});

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fields: [fieldSchema],
  settings: {
    isPublished: {
      type: Boolean,
      default: false
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: true
    },
    maxSubmissions: Number,
    thankYouMessage: {
      type: String,
      default: 'Thank you for your submission!'
    },
    redirectUrl: String,
    theme: {
      primaryColor: {
        type: String,
        default: '#3b82f6'
      },
      backgroundColor: {
        type: String,
        default: '#ffffff'
      }
    }
  },
  analytics: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    lastSubmission: Date
  },
  createdBy: {
    type: String,
    default: 'anonymous'
  }
}, {
  timestamps: true
});

// Index for better query performance
formSchema.index({ 'settings.isPublished': 1, createdAt: -1 });
formSchema.index({ 'analytics.totalSubmissions': -1 });

module.exports = mongoose.model('Form', formSchema); 