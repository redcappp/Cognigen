import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ConductQuizModal = ({ isOpen, onClose, questions, token }) => {
  const [quizTitle, setQuizTitle] = useState('');
  const [shareLink, setShareLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quizTitle || "Untitled Quiz",
          questions: questions
        })
      });
      const data = await response.json();
      
      // Construct the shareable link (pointing to our own frontend)
      const link = `${window.location.origin}/take-quiz/${data.id}`;
      setShareLink(link);
    } catch (err) {
      alert("Failed to create quiz link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>🚀 Conduct Quiz</h2>
        
        {!shareLink ? (
          <>
            <p>Enter a name for this quiz session:</p>
            <input 
              type="text" 
              placeholder="e.g. Class Test 101"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="modal-input"
            />
            <button 
              onClick={handleCreateLink} 
              disabled={isLoading || !quizTitle}
              className="primary-btn"
            >
              {isLoading ? 'Creating...' : 'Generate Link & QR'}
            </button>
          </>
        ) : (
          <div className="share-section">
            <p><strong>Share this link with your students:</strong></p>
            <div className="link-box">
              <a href={shareLink} target="_blank" rel="noreferrer">{shareLink}</a>
              <button onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</button>
            </div>
            
            <div className="qr-box">
              <QRCodeCanvas value={shareLink} size={200} />
            </div>
            <p className="hint">Scan to start immediately!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductQuizModal;