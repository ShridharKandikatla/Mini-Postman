import React from 'react';
import './SavedRequests.css';

function SavedRequests({ requests, onLoad, onDelete, currentId }) {
  if (requests.length === 0) {
    return (
      <div className="saved-requests empty">
        <p>No saved requests yet</p>
      </div>
    );
  }

  return (
    <div className="saved-requests">
      {requests.map((request) => (
        <div
          key={request.id}
          className={`request-item ${currentId === request.id ? 'active' : ''}`}
        >
          <div onClick={() => onLoad(request)} className="request-info">
            <span className={`method method-${request.method.toLowerCase()}`}>
              {request.method}
            </span>
            <span className="request-name">{request.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(request.id);
            }}
            className="delete-btn"
            title="Delete request"
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  );
}

export default SavedRequests;
