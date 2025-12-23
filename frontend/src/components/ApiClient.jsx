import React, { useState, useEffect } from 'react';
import { executeAPI, requestsAPI, importAPI } from '../services/api';
import SavedRequests from './SavedRequests';
import './ApiClient.css';

function ApiClient({ user, onLogout }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState(null);

  useEffect(() => {
    loadSavedRequests();
  }, []);

  const loadSavedRequests = async () => {
    try {
      const res = await requestsAPI.getAll();
      setSavedRequests(res.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleSendRequest = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const headersObj = {};
      headers.forEach((h) => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      const res = await executeAPI.execute({
        method,
        url,
        headers: headersObj,
        body: body || undefined,
      });

      setResponse(res.data);
    } catch (error) {
      setResponse({
        error: true,
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequest = async () => {
    if (!requestName) {
      alert('Please enter a name for this request');
      return;
    }

    try {
      const headersObj = {};
      headers.forEach((h) => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      if (currentRequestId) {
        await requestsAPI.update(currentRequestId, {
          name: requestName,
          method,
          url,
          headers: headersObj,
          body,
        });
      } else {
        await requestsAPI.create({
          name: requestName,
          method,
          url,
          headers: headersObj,
          body,
        });
      }

      setShowSaveModal(false);
      setRequestName('');
      setCurrentRequestId(null);
      loadSavedRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving request');
    }
  };

  const handleLoadRequest = (request) => {
    setMethod(request.method);
    setUrl(request.url);
    setBody(request.body || '');
    setCurrentRequestId(request.id);
    setRequestName(request.name);
    setResponse(null);

    const headerArray = Object.entries(request.headers || {}).map(
      ([key, value]) => ({
        key,
        value,
      })
    );
    setHeaders(headerArray.length > 0 ? headerArray : [{ key: '', value: '' }]);
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await requestsAPI.delete(id);
        loadSavedRequests();
        if (currentRequestId === id) {
          handleNewRequest();
        }
      } catch (error) {
        alert('Error deleting request');
      }
    }
  };

  const handleNewRequest = () => {
    setMethod('GET');
    setUrl('');
    setHeaders([{ key: '', value: '' }]);
    setBody('');
    setResponse(null);
    setCurrentRequestId(null);
    setRequestName('');
  };

  const handleParseCurl = async () => {
    if (!curlCommand) {
      alert('Please enter a cURL command');
      return;
    }

    try {
      const res = await importAPI.parseCurl(curlCommand);
      const parsed = res.data;

      if (!parsed.url) {
        alert('Could not extract URL from cURL command');
        return;
      }

      setMethod(parsed.method || 'GET');
      setUrl(parsed.url);
      setBody(parsed.body || '');
      setResponse(null);
      setCurrentRequestId(null);
      setRequestName('');

      const headerArray = Object.entries(parsed.headers || {}).map(
        ([key, value]) => ({
          key,
          value,
        })
      );
      setHeaders(
        headerArray.length > 0 ? headerArray : [{ key: '', value: '' }]
      );

      setShowImportModal(false);
      setCurlCommand('');
      alert('cURL command parsed successfully!');
    } catch (error) {
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error parsing cURL command'
      );
    }
  };

  const handleImportPostman = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importAPI.importPostman(file);
      const { requests, savedRequests, collectionName } = res.data;

      if (requests.length > 0) {
        // Load first request
        const firstRequest = requests[0];
        setMethod(firstRequest.method);
        setUrl(firstRequest.url);
        setBody(firstRequest.body || '');
        setResponse(null);
        setCurrentRequestId(null);
        setRequestName('');

        const headerArray = Object.entries(firstRequest.headers || {}).map(
          ([key, value]) => ({
            key,
            value,
          })
        );
        setHeaders(
          headerArray.length > 0 ? headerArray : [{ key: '', value: '' }]
        );

        // Reload saved requests from database
        loadSavedRequests();

        alert(
          `Successfully imported "${collectionName}" with ${
            savedRequests || requests.length
          } request(s)!\nLoaded the first request in the editor.`
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.error || 'Error importing Postman collection'
      );
    }

    e.target.value = '';
  };

  return (
    <div className="api-client">
      <header className="header">
        <h1>Mini Postman</h1>
        <div className="header-actions">
          <span className="user-email">{user.email}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Saved Requests</h2>
            <button onClick={handleNewRequest} className="new-btn">
              + New
            </button>
          </div>
          <SavedRequests
            requests={savedRequests}
            onLoad={handleLoadRequest}
            onDelete={handleDeleteRequest}
            currentId={currentRequestId}
          />
        </aside>

        <main className="workspace">
          <div className="request-section">
            <div className="request-header">
              <div className="request-line">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="method-select"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter request URL"
                  className="url-input"
                />

                <button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="send-btn"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="action-btn"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="action-btn"
                >
                  📥 Import cURL
                </button>
                <label className="action-btn" style={{ cursor: 'pointer' }}>
                  📁 Import Collection
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPostman}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="request-body">
              <h3>Headers</h3>
              <div className="headers-section">
                {headers.map((header, index) => (
                  <div key={index} className="header-row">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, 'key', e.target.value)
                      }
                      placeholder="Key"
                      className="header-input"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) =>
                        handleHeaderChange(index, 'value', e.target.value)
                      }
                      placeholder="Value"
                      className="header-input"
                    />
                    <button
                      onClick={() => handleRemoveHeader(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={handleAddHeader} className="add-header-btn">
                  + Add Header
                </button>
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <>
                  <h3>Body</h3>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter request body (JSON, text, etc.)"
                    className="body-textarea"
                  />
                </>
              )}
            </div>
          </div>

          <div className="response-section">
            <h3>Response</h3>
            {loading && <div className="loading">Sending request...</div>}
            {response && !loading && (
              <div className="response-content">
                {response.error ? (
                  <div className="response-error">
                    <strong>Error:</strong> {response.message}
                  </div>
                ) : (
                  <>
                    <div className="response-meta">
                      <span
                        className={`status status-${Math.floor(
                          response.status / 100
                        )}`}
                      >
                        Status: {response.status} {response.statusText}
                      </span>
                      {response.duration && (
                        <span className="duration">
                          Time: {response.duration}ms
                        </span>
                      )}
                    </div>
                    <pre className="response-data">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{currentRequestId ? 'Update Request' : 'Save Request'}</h2>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Enter request name"
              className="modal-input"
            />
            <div className="modal-actions">
              <button onClick={handleSaveRequest} className="modal-btn primary">
                {currentRequestId ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="modal-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportModal(false)}
        >
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h2>Import from cURL</h2>
            <textarea
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              placeholder="Paste your cURL command here..."
              className="curl-textarea"
            />
            <div className="modal-actions">
              <button onClick={handleParseCurl} className="modal-btn primary">
                Parse
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="modal-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiClient;
