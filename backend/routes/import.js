const express = require('express');
const multer = require('multer');
const { parseCurl } = require('../utils/curlParser');
const authenticateToken = require('../middleware/auth');
const db = require('../database');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Parse cURL command
router.post('/curl', authenticateToken, (req, res) => {
  const { curlCommand } = req.body;

  if (!curlCommand) {
    return res.status(400).json({ error: 'cURL command is required' });
  }

  try {
    const parsed = parseCurl(curlCommand);
    res.json(parsed);
  } catch (error) {
    res.status(400).json({
      error: 'Failed to parse cURL command',
      message: error.message,
    });
  }
});

// Import Postman Collection (v2)
router.post(
  '/postman',
  authenticateToken,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'Postman collection file is required' });
    }

    try {
      const collection = JSON.parse(req.file.buffer.toString());

      if (!collection.info || !collection.item) {
        return res.status(400).json({
          error: 'Invalid Postman collection format',
        });
      }

      const requests = [];

      // Recursive function to extract requests from collection
      const extractRequests = (items, folderName = '') => {
        items.forEach((item) => {
          if (item.request) {
            // It's a request
            const request = {
              name: folderName ? `${folderName} / ${item.name}` : item.name,
              method: item.request.method || 'GET',
              url:
                typeof item.request.url === 'string'
                  ? item.request.url
                  : item.request.url.raw || '',
              headers: {},
              body: '',
            };

            // Extract headers
            if (item.request.header) {
              item.request.header.forEach((header) => {
                if (!header.disabled) {
                  request.headers[header.key] = header.value;
                }
              });
            }

            // Extract body
            if (item.request.body) {
              if (item.request.body.mode === 'raw') {
                request.body = item.request.body.raw || '';
              } else if (item.request.body.mode === 'formdata') {
                // Convert form data to JSON representation
                const formData = {};
                item.request.body.formdata?.forEach((field) => {
                  formData[field.key] = field.value;
                });
                request.body = JSON.stringify(formData);
              }
            }

            requests.push(request);
          } else if (item.item) {
            // It's a folder, recurse
            extractRequests(item.item, item.name);
          }
        });
      };

      extractRequests(collection.item);

      // Save all requests to database
      let savedCount = 0;
      let errorCount = 0;

      requests.forEach((request) => {
        db.run(
          `INSERT INTO api_requests (user_id, name, method, url, headers, body)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            request.name,
            request.method,
            request.url,
            JSON.stringify(request.headers),
            request.body,
          ],
          (err) => {
            if (err) {
              errorCount++;
            } else {
              savedCount++;
            }
          }
        );
      });

      res.json({
        message: 'Collection imported successfully',
        collectionName: collection.info.name,
        totalRequests: requests.length,
        savedRequests: savedCount,
        failedRequests: errorCount,
        requests: requests,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to parse Postman collection',
        message: error.message,
      });
    }
  }
);

module.exports = router;
