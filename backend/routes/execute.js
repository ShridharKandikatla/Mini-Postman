const express = require('express');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Execute an API request
router.post('/execute', authenticateToken, async (req, res) => {
  const { method, url, headers, body } = req.body;

  if (!method || !url) {
    return res.status(400).json({ error: 'Method and URL are required' });
  }

  try {
    const config = {
      method: method.toLowerCase(),
      url: url,
      headers: headers || {},
      timeout: 30000,
      validateStatus: () => true, // Accept any status code
    };

    // Add body for POST, PUT, PATCH requests
    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
      config.data = body;
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration: duration,
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to complete',
      });
    }

    if (error.response) {
      return res.json({
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        error: true,
      });
    }

    res.status(500).json({
      error: 'Request failed',
      message: error.message,
    });
  }
});

module.exports = router;
