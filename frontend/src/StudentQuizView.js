import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const StudentQuizView = () => {
  const { id } = useParams(); 
  const [quiz, setQuiz] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState({}); 
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/quizzes/${id}`);
        if (!res.ok) throw new Error("Quiz not found");
        const data = await res.json();
        setQuiz(data);
      } catch (err) {
        alert("Error loading quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // --- ROBUST HELPER: Detect Multi-Select ---
  const isMultiSelect = (q) => {
    if (!q) return false;
    // 1. Clean the type string (remove spaces, hyphens, numbers)
    // "Multiple-Answer" -> "multipleanswer"
    const cleanType = String(q.question_type || "").toLowerCase().replace(/[^a-z]/g, '');
    
    // 2. Check strict keywords
    const typeMatch = cleanType.includes("multipleanswer") || 
                      cleanType.includes("checkbox") || 
                      cleanType.includes("multiselect");

    // 3. Fallback: Check question text for "Select all" (case insensitive)
    const textMatch = q.question && /select all/i.test(q.question);

    return typeMatch || textMatch;
  };

  const handleOptionSelect = (qIndex, key, questionObj) => {
    const isMulti = isMultiSelect(questionObj);

    // 1. Handle Multiple-Answer (Checkboxes)
    if (isMulti) {
      setAnswers(prev => {
        const currentSelection = prev[qIndex] || [];
        // Ensure it's an array
        const currentArray = Array.isArray(currentSelection) ? currentSelection : [currentSelection];
        
        if (currentArray.includes(key)) {
          // Remove
          return { ...prev, [qIndex]: currentArray.filter(k => k !== key) };
        } else {
          // Add
          return { ...prev, [qIndex]: [...currentArray, key] };
        }
      });
    } 
    // 2. Handle Single Answer
    else {
      setAnswers(prev => ({ ...prev, [qIndex]: key }));
    }
  };

  const handleTextChange = (qIndex, text) => {
      setAnswers(prev => ({ ...prev, [qIndex]: text }));
  }

  const handleSubmit = async () => {
    if (!studentName.trim()) return alert("Please enter your name!");
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/quizzes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          answers: answers
        })
      });
      
      const result = await res.json();
      setScore(result.score);
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed.");
    }
  };

  if (loading) return <div className="quiz-container">Loading Quiz...</div>;
  if (!quiz) return <div className="quiz-container">Quiz not found!</div>;

  if (submitted) {
    return (
      <div className="quiz-container" style={{textAlign: 'center', padding: '50px'}}>
        <h1>🎉 Quiz Submitted!</h1>
        <h2>Thank you, {studentName}.</h2>
        <div className="score-card">
          <h3>Your Score:</h3>
          <h1 style={{fontSize: '4rem', color: '#28a745', margin: '10px 0'}}>{score} / {quiz.questions.length}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <h1>{quiz.title}</h1>
        <input 
          type="text" 
          placeholder="Enter Your Full Name" 
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="name-input"
        />
      </header>

      <div className="questions-list">
        {quiz.questions.map((q, index) => {
            const isMulti = isMultiSelect(q);
            const currentAns = answers[index];

            return (
              <div key={index} className="question-card">
                <div className="question-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3>Question {index + 1}</h3>
                    <span className="badge">{isMulti ? 'Select All' : (q.question_type || 'General')}</span>
                </div>
                
                <p className="question-text">{q.question}</p>

                {q.options ? (
                  <div className="options-grid">
                    {Object.entries(q.options).map(([key, val]) => {
                      let isSelected = false;
                      if (isMulti) {
                          isSelected = Array.isArray(currentAns) && currentAns.includes(key);
                      } else {
                          isSelected = currentAns === key;
                      }

                      return (
                        <div 
                          key={key}
                          className={`option-btn ${isSelected ? 'selected' : ''}`}
                          // Pass the entire question object to helper
                          onClick={() => handleOptionSelect(index, key, q)}
                        >
                          <strong>{key})</strong> {val}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <textarea 
                    placeholder="Type your answer here..." 
                    className="text-answer-input"
                    onChange={(e) => handleTextChange(index, e.target.value)}
                  />
                )}
              </div>
            );
        })}
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        Submit Quiz 🚀
      </button>
    </div>
  );
};

export default StudentQuizView;