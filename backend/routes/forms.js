const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const router = express.Router();

// Validation middleware
const validateForm = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('fields').isArray().withMessage('Fields must be an array'),
  body('fields.*.id').notEmpty().withMessage('Field ID is required'),
  body('fields.*.type').isIn(['text', 'email', 'select', 'checkbox', 'radio', 'textarea', 'file']).withMessage('Invalid field type'),
  body('fields.*.label').trim().isLength({ min: 1, max: 100 }).withMessage('Field label must be between 1 and 100 characters')
];

// Get all forms
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = {};
    
    if (status) {
      query['settings.isPublished'] = status === 'published';
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const forms = await Form.find(query)
      .select('title description settings analytics createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Form.countDocuments(query);
    
    res.json({
      forms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Get public form (for submissions)
router.get('/:id/public', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (!form.settings.isPublished) {
      return res.status(404).json({ error: 'Form is not published' });
    }
    
    // Return only necessary fields for public view
    const publicForm = {
      id: form._id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      settings: {
        theme: form.settings.theme
      }
    };
    
    res.json(publicForm);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create new form
router.post('/', validateForm, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const form = new Form(req.body);
    await form.save();
    
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
router.put('/:id', validateForm, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Duplicate form
router.post('/:id/duplicate', async (req, res) => {
  try {
    const originalForm = await Form.findById(req.params.id);
    if (!originalForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const duplicatedForm = new Form({
      ...originalForm.toObject(),
      _id: undefined,
      title: `${originalForm.title} (Copy)`,
      'settings.isPublished': false,
      analytics: {
        totalSubmissions: 0,
        lastSubmission: null
      }
    });
    
    await duplicatedForm.save();
    res.status(201).json(duplicatedForm);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate form' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Publish/Unpublish form
router.patch('/:id/publish', async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { 'settings.isPublished': isPublished },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update form status' });
  }
});

module.exports = router; 