import React, { useState } from 'react';

const ChatTutor = ({ token, selectedBooks }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || selectedBooks.length === 0) return;

    // Add user message to UI immediately
    const userMsg = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMsg]);
    setIsLoading(true);
    setMessage(''); // Clear input

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg.content,
          book_ids: selectedBooks
        })
      });

      const data = await response.json();
      
      // Add AI response to UI
      setChatHistory(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Error: Could not connect to the tutor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <h3>🤖 AI Tutor</h3>
      {selectedBooks.length === 0 ? (
        <p style={{color: '#666', fontStyle: 'italic'}}>Select books above to start chatting.</p>
      ) : (
        <>
          <div className="chat-window">
            {chatHistory.length === 0 && <p className="placeholder">Ask a question about your selected books...</p>}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                <strong>{msg.role === 'user' ? 'You' : 'Tutor'}:</strong>
                <div style={{whiteSpace: 'pre-wrap'}}>{msg.content}</div>
              </div>
            ))}
            {isLoading && <div className="chat-bubble ai"><em>Thinking...</em></div>}
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Explain the main concept of Chapter 1..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()}>Send</button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatTutor;