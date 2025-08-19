const express = require('express');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Form = require('../models/Form');
const router = express.Router();

// Validation middleware
const validateSubmission = [
  body('formId').isMongoId().withMessage('Valid form ID is required'),
  body('data').isArray().withMessage('Submission data must be an array'),
  body('data.*.fieldId').notEmpty().withMessage('Field ID is required')
];

// Submit form
router.post('/', validateSubmission, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId, data } = req.body;

    // Check if form exists and is published
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!form.settings.isPublished) {
      return res.status(400).json({ error: 'Form is not published' });
    }

    // Check submission limits
    if (form.settings.maxSubmissions && form.analytics.totalSubmissions >= form.settings.maxSubmissions) {
      return res.status(429).json({ error: 'Form has reached maximum submission limit' });
    }

    // Validate required fields
    const requiredFields = form.fields.filter(field => field.required);
    const submittedFieldIds = data.map(item => item.fieldId);
    
    for (const field of requiredFields) {
      if (!submittedFieldIds.includes(field.id)) {
        return res.status(400).json({ 
          error: `Required field '${field.label}' is missing` 
        });
      }
    }

    // Create submission
    const submission = new Submission({
      formId,
      data,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await submission.save();

    // Update form analytics
    await Form.findByIdAndUpdate(formId, {
      $inc: { 'analytics.totalSubmissions': 1 },
      $set: { 'analytics.lastSubmission': new Date() }
    });

    res.status(201).json({
      message: 'Form submitted successfully',
      submissionId: submission._id
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get submissions for a form
router.get('/form/:formId', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { formId } = req.params;

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    let query = { formId };
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query)
      .sort({ 'metadata.submittedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('formId', 'title fields');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Update submission status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update submission status' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update form analytics
    await Form.findByIdAndUpdate(submission.formId, {
      $inc: { 'analytics.totalSubmissions': -1 }
    });

    await Submission.findByIdAndDelete(req.params.id);

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Export submissions to CSV
router.get('/form/:formId/export', async (req, res) => {
  try {
    const { formId } = req.params;
    
    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const submissions = await Submission.find({ formId }).sort({ 'metadata.submittedAt': -1 });

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'No submissions found' });
    }

    // Generate CSV headers
    const headers = ['Submission Date', 'IP Address', 'User Agent'];
    form.fields.forEach(field => {
      headers.push(field.label);
    });

    // Generate CSV rows
    const csvRows = [headers.join(',')];
    
    submissions.forEach(submission => {
      const row = [
        submission.metadata.submittedAt.toISOString(),
        submission.metadata.ipAddress || '',
        `"${(submission.metadata.userAgent || '').replace(/"/g, '""')}"`
      ];

      form.fields.forEach(field => {
        const fieldData = submission.data.find(d => d.fieldId === field.id);
        let value = '';
        
        if (fieldData) {
          if (field.type === 'file' && fieldData.files) {
            value = fieldData.files.map(f => f.originalName).join('; ');
          } else {
            value = Array.isArray(fieldData.value) 
              ? fieldData.value.join('; ') 
              : String(fieldData.value || '');
          }
        }
        
        row.push(`"${value.replace(/"/g, '""')}"`);
      });

      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${formId}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export submissions' });
  }
});

module.exports = router; 