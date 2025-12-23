const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get all saved requests for the authenticated user
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM api_requests WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching requests' });
      }

      const requests = rows.map((row) => ({
        ...row,
        headers: row.headers ? JSON.parse(row.headers) : {},
        body: row.body || '',
      }));

      res.json(requests);
    }
  );
});

// Get a single saved request
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM api_requests WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching request' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const request = {
        ...row,
        headers: row.headers ? JSON.parse(row.headers) : {},
        body: row.body || '',
      };

      res.json(request);
    }
  );
});

// Save a new request
router.post('/', authenticateToken, (req, res) => {
  const { name, method, url, headers, body } = req.body;

  if (!name || !method || !url) {
    return res
      .status(400)
      .json({ error: 'Name, method, and URL are required' });
  }

  const headersJson = JSON.stringify(headers || {});
  const bodyText = body || '';

  db.run(
    `INSERT INTO api_requests (user_id, name, method, url, headers, body) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, method.toUpperCase(), url, headersJson, bodyText],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error saving request' });
      }

      res.status(201).json({
        message: 'Request saved successfully',
        id: this.lastID,
      });
    }
  );
});

// Update an existing request
router.put('/:id', authenticateToken, (req, res) => {
  const { name, method, url, headers, body } = req.body;

  if (!name || !method || !url) {
    return res
      .status(400)
      .json({ error: 'Name, method, and URL are required' });
  }

  const headersJson = JSON.stringify(headers || {});
  const bodyText = body || '';

  db.run(
    `UPDATE api_requests 
     SET name = ?, method = ?, url = ?, headers = ?, body = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [
      name,
      method.toUpperCase(),
      url,
      headersJson,
      bodyText,
      req.params.id,
      req.user.id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating request' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.json({ message: 'Request updated successfully' });
    }
  );
});

// Delete a request
router.delete('/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM api_requests WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting request' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.json({ message: 'Request deleted successfully' });
    }
  );
});

module.exports = router;
