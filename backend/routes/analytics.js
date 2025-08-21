const express = require('express');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const router = express.Router();

// Get form analytics
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { period = '30d' } = req.query;

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get submissions in date range
    const submissions = await Submission.find({
      formId,
      'metadata.submittedAt': { $gte: startDate }
    }).sort({ 'metadata.submittedAt': 1 });

    // Calculate daily submission counts
    const dailyStats = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyStats[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    submissions.forEach(submission => {
      const dateKey = submission.metadata.submittedAt.toISOString().split('T')[0];
      if (dailyStats[dateKey] !== undefined) {
        dailyStats[dateKey]++;
      }
    });

    // Calculate field response statistics
    const fieldStats = {};
    form.fields.forEach(field => {
      fieldStats[field.id] = {
        label: field.label,
        type: field.type,
        totalResponses: 0,
        responses: []
      };
    });

    submissions.forEach(submission => {
      submission.data.forEach(dataItem => {
        if (fieldStats[dataItem.fieldId]) {
          fieldStats[dataItem.fieldId].totalResponses++;
          
          if (dataItem.value !== undefined && dataItem.value !== null && dataItem.value !== '') {
            fieldStats[dataItem.fieldId].responses.push(dataItem.value);
          }
        }
      });
    });

    // Calculate response rates for each field
    Object.keys(fieldStats).forEach(fieldId => {
      const field = fieldStats[fieldId];
      field.responseRate = submissions.length > 0 ? (field.totalResponses / submissions.length * 100).toFixed(1) : 0;
      
      // For select/radio fields, calculate option distribution
      if (field.type === 'select' || field.type === 'radio') {
        const optionCounts = {};
        field.responses.forEach(response => {
          optionCounts[response] = (optionCounts[response] || 0) + 1;
        });
        field.optionDistribution = optionCounts;
      }
    });

    // Get recent submissions
    const recentSubmissions = await Submission.find({ formId })
      .sort({ 'metadata.submittedAt': -1 })
      .limit(10)
      .select('metadata.submittedAt data');

    const analytics = {
      formId,
      period,
      totalSubmissions: form.analytics.totalSubmissions,
      periodSubmissions: submissions.length,
      dailyStats: Object.entries(dailyStats).map(([date, count]) => ({ date, count })),
      fieldStats,
      recentSubmissions: recentSubmissions.map(sub => ({
        date: sub.metadata.submittedAt,
        fieldCount: sub.data.length
      })),
      averageFieldsPerSubmission: submissions.length > 0 
        ? (submissions.reduce((sum, sub) => sum + sub.data.length, 0) / submissions.length).toFixed(1)
        : 0
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get dashboard analytics (overview of all forms)
router.get('/dashboard', async (req, res) => {
  try {
    // Get total forms count and other data in parallel
    const [
      totalForms, 
      publishedForms, 
      draftForms, 
      totalSubmissions, 
      topForms, 
      recentSubmissions, 
      recentSubmissionsCount
    ] = await Promise.all([
      Form.countDocuments(),
      Form.countDocuments({ 'settings.isPublished': true }),
      Form.countDocuments({ 'settings.isPublished': false }),
      Submission.countDocuments(),
      Form.find()
        .select('title analytics.totalSubmissions')
        .sort({ 'analytics.totalSubmissions': -1 })
        .limit(5)
        .lean(),
      Submission.find()
        .populate('formId', 'title')
        .sort({ 'metadata.submittedAt': -1 })
        .limit(10)
        .select('formId metadata.submittedAt')
        .lean(),
      // Get submission count for last 7 days
      Submission.countDocuments({
        'metadata.submittedAt': { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      })
    ]);

    const dashboard = {
      overview: {
        totalForms,
        publishedForms,
        draftForms,
        totalSubmissions,
        recentSubmissionsCount
      },
      topForms,
      recentActivity: recentSubmissions.map(sub => ({
        formTitle: sub.formId?.title || 'Deleted Form',
        submittedAt: sub.metadata?.submittedAt || new Date()
      }))
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get field-specific analytics
router.get('/form/:formId/field/:fieldId', async (req, res) => {
  try {
    const { formId, fieldId } = req.params;

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const field = form.fields.find(f => f.id === fieldId);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Get all submissions for this form
    const submissions = await Submission.find({ formId });

    // Analyze field responses
    const responses = [];
    const fieldData = submissions.map(sub => {
      const dataItem = sub.data.find(d => d.fieldId === fieldId);
      if (dataItem) {
        responses.push(dataItem.value);
        return {
          submissionId: sub._id,
          value: dataItem.value,
          submittedAt: sub.metadata.submittedAt
        };
      }
      return null;
    }).filter(Boolean);

    // Calculate statistics based on field type
    let fieldStats = {
      totalResponses: fieldData.length,
      responseRate: submissions.length > 0 ? (fieldData.length / submissions.length * 100).toFixed(1) : 0
    };

    if (field.type === 'text' || field.type === 'textarea' || field.type === 'email') {
      // Text-based fields
      const nonEmptyResponses = responses.filter(r => r && r.trim() !== '');
      fieldStats.averageLength = nonEmptyResponses.length > 0 
        ? (nonEmptyResponses.reduce((sum, r) => sum + r.length, 0) / nonEmptyResponses.length).toFixed(1)
        : 0;
      fieldStats.minLength = nonEmptyResponses.length > 0 
        ? Math.min(...nonEmptyResponses.map(r => r.length))
        : 0;
      fieldStats.maxLength = nonEmptyResponses.length > 0 
        ? Math.max(...nonEmptyResponses.map(r => r.length))
        : 0;
    } else if (field.type === 'select' || field.type === 'radio') {
      // Choice-based fields
      const optionCounts = {};
      responses.forEach(response => {
        if (response) {
          optionCounts[response] = (optionCounts[response] || 0) + 1;
        }
      });
      fieldStats.optionDistribution = optionCounts;
      fieldStats.mostPopularOption = Object.entries(optionCounts)
        .sort(([,a], [,b]) => b - a)[0] || null;
    } else if (field.type === 'checkbox') {
      // Checkbox fields
      const checkedCount = responses.filter(r => r === true || r === 'true').length;
      fieldStats.checkedRate = (checkedCount / fieldData.length * 100).toFixed(1);
    }

    res.json({
      fieldId,
      fieldType: field.type,
      fieldLabel: field.label,
      stats: fieldStats,
      recentResponses: fieldData.slice(0, 20) // Last 20 responses
    });
  } catch (error) {
    console.error('Field analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch field analytics' });
  }
});

module.exports = router;