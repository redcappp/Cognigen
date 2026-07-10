import React, { useState, useEffect } from 'react';

function Library({ token, onSelect, selectedBooks }) {
  const [books, setBooks] = useState([]);
  const [bookName, setBookName] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchBooks = async () => {
    const response = await fetch('http://127.0.0.1:8000/api/v1/books', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setBooks(data);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !bookName) {
      setMessage('Please provide a book name and a .zip file.');
      return;
    }

    const formData = new FormData();
    formData.append('book_name', bookName);
    formData.append('file', file);

    setMessage('Uploading and processing... This may take a few minutes.');
    const response = await fetch('http://127.0.0.1:8000/api/v1/books/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(`Book "${data.filename}" uploaded successfully with status: ${data.status}`);
      setBookName(''); // Clear input
      setFile(null);
      fetchBooks(); 
    } else {
      setMessage(`Upload failed: ${data.detail}`);
    }
  };

  return (
    <div className="library-container">
      <h2 className="text-xl font-bold mb-4">My Library</h2>
      
      <form onSubmit={handleUpload} className="upload-form space-y-3 mb-6">
        <h3 className="text-sm font-mono text-gray-400 uppercase">Upload a New Book</h3>
        <input
          className="w-full bg-[#161616] border border-white/10 rounded p-2 text-sm"
          type="text"
          placeholder="Enter book name"
          value={bookName}
          onChange={(e) => setBookName(e.target.value)}
          required
        />
        <input
          className="w-full text-sm"
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold">Upload Book</button>
        {message && <p className="text-xs text-gray-400 mt-2">{message}</p>}
      </form>

      <div className="book-list">
        <h3 className="text-sm font-mono text-gray-400 uppercase mb-3">Uploaded Books</h3>
        {books.length > 0 ? (
          books.map(book => {
            const isSelected = selectedBooks && selectedBooks.includes(book.id);
            return (
              <div 
                key={book.id} 
                onClick={() => onSelect && onSelect(book.id)}
                className={`book-item p-3 mb-2 rounded cursor-pointer border transition-all ${
                  isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">{book.book_name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${book.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {book.status}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-gray-500">You haven't uploaded any books yet.</p>
        )}
      </div>
    </div>
  );
}

export default Library;