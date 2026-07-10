import React, { useState, useEffect } from 'react';

const ResultsDashboard = ({ token, onClose }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Grading State
  const [reviewItem, setReviewItem] = useState(null); 
  const [manualScore, setManualScore] = useState(0);

  // 1. Fetch Teacher's Quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/my-quizzes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) setQuizzes(await res.json());
      } catch (err) { console.error("Failed to load quizzes"); }
    };
    fetchQuizzes();
  }, [token]);

  // 2. View Results for a Quiz
  const handleViewResults = async (quiz) => {
    setLoading(true);
    setSelectedQuiz(quiz); 
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/quizzes/${quiz.id}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setResults(await res.json());
    } catch (err) { alert("Failed to load results"); } 
    finally { setLoading(false); }
  };

  // 3. Open Review Modal
  const openReview = (submission) => {
    setReviewItem(submission);
    setManualScore(submission.score);
  };

  // 4. Save New Score
  const handleUpdateScore = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/quiz-responses/${reviewItem.id}/score`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_score: parseInt(manualScore) })
      });
      
      if (res.ok) {
        alert("Score Updated!");
        setReviewItem(null);
        handleViewResults(selectedQuiz); // Refresh list
      }
    } catch (err) { alert("Failed to update."); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content results-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>📊 Teacher Gradebook</h2>

        <div className="dashboard-layout">
          {/* LEFT: Quiz List */}
          <div className="quiz-list-sidebar">
            <h3>My Quizzes</h3>
            <ul>
              {quizzes.map(q => (
                <li key={q.id} onClick={() => handleViewResults(q)} className={selectedQuiz?.id === q.id ? 'active' : ''}>
                  {q.title}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: Results Table */}
          <div className="results-view">
            {!selectedQuiz ? <p className="placeholder-text">Select a quiz to view scores.</p> : (
              <>
                <h3>Results for: {selectedQuiz.title}</h3>
                <table className="results-table">
                  <thead>
                    <tr><th>Student</th><th>Score</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.student_name}</td>
                        <td>
                           <span className={`score-badge ${r.score >= r.total_questions * 0.8 ? 'perfect' : ''}`}>
                             {r.score} / {r.total_questions}
                           </span>
                        </td>
                        <td>
                          <button onClick={() => openReview(r)} className="review-btn">📝 Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- NESTED MODAL: Review Specific Student --- */}
      {reviewItem && selectedQuiz && (
        <div className="modal-overlay" style={{zIndex: 1100}}>
          <div className="modal-content review-modal">
            <h3>Grading: {reviewItem.student_name}</h3>
            
            <div className="review-scroll">
               {selectedQuiz?.questions_data?.map((q, idx) => {
                 // --- DATA EXTRACTION LOGIC ---
                 const idxStr = String(idx);
                 const answers = reviewItem.answers_data || {};
                 const studentData = answers[idxStr] || {};
                 
                 // Fallback to "No Answer" only if completely missing
                 const studentAns = studentData.answer !== undefined ? studentData.answer : "No Answer";
                 const points = studentData.points || 0;

                 return (
                   <div key={idx} className="review-item">
                     <p className="q-title"><strong>Q{idx+1}:</strong> {q.question}</p>
                     
                     <div className="comparison-box">
                       <div className="student-ans">
                         <small>Student Answer:</small><br/>
                         {/* Display text in Red if wrong, Green if correct */}
                         <span style={{color: points > 0 ? 'green' : 'red', fontWeight: 'bold'}}>
                            {studentAns}
                         </span>
                       </div>
                       <div className="model-ans">
                         <small>Model Answer:</small><br/>
                         {q.answer}
                       </div>
                     </div>
                     
                     <div className="auto-grade-badge">
                       AI Grade: <strong>{points} / 1</strong>
                     </div>
                   </div>
                 );
               })}
            </div>

            <div className="grading-footer">
               <label>Adjust Total Score:</label>
               <input 
                 type="number" 
                 value={manualScore} 
                 onChange={(e) => setManualScore(e.target.value)} 
               />
               <span> / {reviewItem.total_questions}</span>
               
               <button onClick={handleUpdateScore} className="save-btn">💾 Save New Score</button>
               <button onClick={() => setReviewItem(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;