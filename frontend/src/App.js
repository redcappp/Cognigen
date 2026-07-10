import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, LogOut, FileText, CheckCircle, 
  Plus, Trash2, Cpu 
} from 'lucide-react';

import Library from './Library';
import ChatTutor from './ChatTutor';
import ConductQuizModal from './ConductQuizModal';
import { generateQuestionPaper, generateAnswerKey } from './pdfGenerator';
import './App.css';

// --- DEPLOYMENT CONFIGURATION ---
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// --- WELCOME ANIMATION ---
const WelcomeScreen = ({ onComplete }) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, ease: "easeOut" }
        },
        exit: { opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.8, ease: "easeInOut" } }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <motion.div 
            variants={container} initial="hidden" animate="show" exit="exit"
            className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200]"
            onAnimationComplete={() => setTimeout(onComplete, 2200)}
        >
            <div className="flex flex-col items-center">
                <motion.div variants={item} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/50 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                    <Cpu size={32} className="text-purple-400" />
                </motion.div>
                <motion.h1 variants={item} className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
                    Cogni<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Gen</span>
                </motion.h1>
                <motion.div variants={item} className="h-1 w-24 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-6 shadow-[0_0_15px_rgba(168,85,247,0.6)]"></motion.div>
                <motion.p variants={item} className="text-gray-400 tracking-[0.25em] uppercase text-xs font-semibold">Welcome</motion.p>
            </div>
        </motion.div>
    );
};

// --- INTERACTIVE BACKGROUND ---
const InteractiveBackground = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];
        const mouse = { x: 0, y: 0 };
        const resize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        const createParticles = () => {
            particles = Array.from({ length: 60 }, () => ({
                x: Math.random() * width, y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4
            }));
        };
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
                const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
                if (dist < 220) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${0.25 - dist/1000})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
            });
            requestAnimationFrame(draw);
        };
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        resize(); createParticles(); draw();
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] bg-[#050505] pointer-events-none" />;
};

// --- QUESTION CARD ---
const QuestionDisplay = ({ question, index }) => {
    const [selectedOptions, setSelectedOptions] = useState([]); 
    const [showAnswer, setShowAnswer] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);

    useEffect(() => {
        setSelectedOptions([]);
        setShowAnswer(false);
        setIsCorrect(null);
    }, [question]);

    const rawType = String(question.question_type || "").toLowerCase().replace(/[^a-z]/g, '');
    const isMultipleAnswer = rawType.includes("multipleanswer") || 
                             rawType.includes("checkbox") || 
                             (question.question && /select all/i.test(question.question));

    const handleOptionClick = (key) => {
        if (showAnswer) return;
        if (isMultipleAnswer) {
            setSelectedOptions(prev => 
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
        } else {
            setSelectedOptions([key]);
        }
    };

    const checkAnswer = () => {
        const clean = (str) => String(str).replace(/\s/g, '').toUpperCase();
        const correctKeys = String(question.answer).split(',').map(s => s.trim().charAt(0).toUpperCase());
        const selectedSet = new Set(selectedOptions.map(o => clean(o)));
        const correctSet = new Set(correctKeys);
        const isMatch = selectedSet.size === correctSet.size && [...selectedSet].every(x => correctSet.has(x));

        setIsCorrect(isMatch);
        setShowAnswer(true);
    };

    let cardBorder = "border-white/10";
    if (showAnswer) {
        cardBorder = isCorrect ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "border-rose-500/50 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            className={`p-6 rounded-2xl border ${cardBorder} mb-6 transition-all duration-300 bg-white/5 backdrop-blur-md`}
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="font-mono text-xs text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Question {index + 1}
                </span>
                <div className="flex gap-2">
                    <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-gray-300 border border-white/10 backdrop-blur-sm">{question.hardness}</span>
                    <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full backdrop-blur-sm">{question.question_type || 'General'}</span>
                </div>
            </div>
            
            <p className="text-gray-100 font-medium leading-relaxed mb-6 text-lg">{question.question}</p>
            
            {question.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(question.options).map(([key, value]) => {
                        const isSelected = selectedOptions.includes(key);
                        const isActualCorrect = String(question.answer).includes(key);
                        
                        let stateClass = "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5";
                        if (showAnswer) {
                            if (isActualCorrect) stateClass = "border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                            else if (isSelected) stateClass = "border-rose-500 bg-rose-500/20 text-rose-100";
                        } else if (isSelected) {
                            stateClass = "border-purple-500 bg-purple-500/20 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]";
                        }

                        return (
                            <motion.div 
                                whileTap={{ scale: 0.98 }}
                                key={key} 
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex gap-3 ${stateClass}`}
                                onClick={() => handleOptionClick(key)}
                            >
                                <span className="font-mono font-bold text-purple-400">{key})</span>
                                <span className="text-sm">{value}</span>
                            </motion.div>
                        );
                    })}
                    
                    {!showAnswer && (
                        <motion.button 
                            whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(168,85,247,0.4)" }} 
                            whileTap={{ scale: 0.98 }}
                            onClick={checkAnswer} 
                            className="md:col-span-2 mt-4 w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
                            disabled={selectedOptions.length === 0}
                        >
                            Verify Choice
                        </motion.button>
                    )}
                </div>
            ) : (
                <div className="mt-4">
                    {!showAnswer ? (
                        <motion.button 
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }} 
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium transition-all text-gray-200 flex items-center gap-2" 
                            onClick={() => setShowAnswer(true)}
                        >
                            Reveal Answer
                        </motion.button>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-5 bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm">
                            <p className="text-sm text-emerald-400 font-bold mb-3 flex items-center gap-2">Correct Answer</p>
                            <p className="text-sm text-gray-200 leading-relaxed mb-4">{question.model_answer || question.answer}</p>
                            <div className="text-xs text-gray-400 font-mono border-t border-white/10 pt-3 flex items-center gap-2">
                                <BookOpen size={12} className="text-purple-400" /> Source: <span className="text-gray-300">{question.source_book_name}</span> (Page {question.source_book_page})
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

// --- MAIN DASHBOARD ---
const TeacherDashboard = ({ token, onLogout }) => {
  const [context, setContext] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [configs, setConfigs] = useState([{ question_type: 'Multiple-Choice', hardness: 'Medium', num_questions: 3 }]);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserBooks = async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/books`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUserBooks(data.filter(book => book.status === 'ready'));
          }
      } catch (e) { console.error(e); }
    };
    fetchUserBooks();
  }, [token]);
  
  const handleBookSelection = (bookId) => {
    setSelectedBooks(prev => prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]);
  };
  
  const addConfig = () => setConfigs([...configs, { question_type: 'Multiple-Choice', hardness: 'Medium', num_questions: 3 }]);
  const removeConfig = (index) => setConfigs(configs.filter((_, i) => i !== index));
  
  const updateConfig = (index, field, value) => {
      const newConfigs = [...configs];
      newConfigs[index][field] = value;
      setConfigs(newConfigs);
  };
  
  const handleGenerate = async () => {
      setIsLoading(true); setGeneratedQuestions([]);
      if (configs.length === 0) { setIsLoading(false); return; }
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/generate-questions-from-book`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ context, book_ids: selectedBooks, configs })
          });
          const data = await response.json();
          setGeneratedQuestions(data.questions);
          setIsEngineInitialized(true);
      } catch (err) { console.error("Generation failed."); } finally { setIsLoading(false); }
  };

  return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-transparent text-white relative">
          <AnimatePresence>
              {isLoading && (
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center"
                  >
                      <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                          className="flex flex-col items-center gap-6 bg-black/70 p-10 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)]"
                      >
                          <div className="relative w-20 h-20">
                              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center"><Cpu size={24} className="text-purple-400 animate-pulse" /></div>
                          </div>
                          <p className="font-mono text-sm text-purple-300 uppercase tracking-widest animate-pulse font-bold">Generating Questions...</p>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>

          <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      <Cpu size={22} className="text-purple-400" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      CogniGen
                  </h1>
              </div>
              <div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 text-rose-400 transition-all text-sm font-bold shadow-sm">
                  <LogOut size={16} /> Sign Out
                </motion.button>
              </div>
          </header>

          <main className="max-w-[1600px] mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              <div className="lg:col-span-7 space-y-6">
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }} className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-2xl space-y-8">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                          <div className="p-2.5 bg-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]"><Sparkles size={22} className="text-purple-400" /></div>
                          <h2 className="text-xl font-bold tracking-wide text-white">Generate Practice Questions</h2>
                      </div>
                      
                      <div className="space-y-3">
                           <label className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold ml-1">Topic of Study</label>
                           <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., Photosynthesis" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600 shadow-inner" />
                      </div>

                      <div className="space-y-3">
                           <label className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold ml-1">Select Study Materials</label>
                           <div className="bg-black/50 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-56 overflow-y-auto custom-scrollbar shadow-inner">
                               {userBooks.map(book => {
                                   const isSelected = selectedBooks.includes(book.id);
                                   return (
                                       <motion.label 
                                           whileHover={{ scale: 1.02 }}
                                           whileTap={{ scale: 0.98 }}
                                           key={book.id} 
                                           className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-purple-500/20 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'} text-sm`}
                                       >
                                           <input type="checkbox" className="hidden" onChange={() => handleBookSelection(book.id)}/>
                                           <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all duration-300 ${isSelected ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-gray-500 bg-black/40'}`}>
                                               <AnimatePresence>
                                                   {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}><CheckCircle size={14} className="text-white" /></motion.div>}
                                               </AnimatePresence>
                                           </div>
                                           <div className="flex flex-col overflow-hidden">
                                               <span className={`truncate font-bold ${isSelected ? 'text-purple-200' : 'text-gray-300'}`}>{book.book_name}</span>
                                               <span className="text-[10px] font-mono text-gray-500">ID: {String(book.id).substring(0,8)}</span>
                                           </div>
                                       </motion.label>
                                   );
                               })}
                           </div>
                      </div>
                      
                      <div className="space-y-4">
                           <label className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold ml-1 block">Question Settings</label>
                           <div className="space-y-3">
                               <AnimatePresence>
                                   {configs.map((config, index) => (
                                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                                           <div className="flex-1 min-w-[120px]">
                                               <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer appearance-none" value={config.question_type} onChange={(e) => updateConfig(index, 'question_type', e.target.value)}>
                                                   <option className="bg-gray-900" value="Multiple-Choice">Multiple Choice</option>
                                                   <option className="bg-gray-900" value="Multiple-Answer">Multiple Answer</option>
                                                   <option className="bg-gray-900" value="Assertion-Reason">Assertion-Reason</option>
                                                   <option className="bg-gray-900" value="Short Answer">Short Answer</option>
                                                   <option className="bg-gray-900" value="Long Answer">Long Answer</option>
                                               </select>
                                           </div>
                                           <div className="flex-1 min-w-[100px]">
                                               <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer appearance-none" value={config.hardness} onChange={(e) => updateConfig(index, 'hardness', e.target.value)}>
                                                   <option className="bg-gray-900" value="Easy">Easy</option>
                                                   <option className="bg-gray-900" value="Medium">Medium</option>
                                                   <option className="bg-gray-900" value="Hard">Hard</option>
                                               </select>
                                           </div>
                                           <div className="w-20">
                                               <input type="number" value={config.num_questions} min="1" max="50" onChange={(e) => updateConfig(index, 'num_questions', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-200"/>
                                           </div>
                                           {configs.length > 1 && (
                                               <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => removeConfig(index)} className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/30 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                                   <Trash2 size={18} />
                                               </motion.button>
                                           )}
                                       </motion.div>
                                   ))}
                               </AnimatePresence>
                               <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addConfig} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/30 text-xs font-mono transition-all text-gray-300 hover:text-white flex items-center justify-center gap-2 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                   <Plus size={16} /> Add Question Type
                               </motion.button>
                           </div>
                      </div>

                      <motion.button 
                          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(168,85,247,0.6)" }} 
                          whileTap={{ scale: 0.97 }} 
                          onClick={handleGenerate} 
                          disabled={isLoading || selectedBooks.length === 0} 
                          className="w-full py-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-40 disabled:grayscale mt-6 tracking-wide text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-500/50"
                      >
                          Generate Questions
                      </motion.button>
                      
                      <AnimatePresence>
                          {generatedQuestions.length > 0 && (
                              <motion.div initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} className="pt-8 mt-4 border-t border-white/10 flex gap-4 flex-wrap">
                                  <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59,130,246,0.4)" }} whileTap={{ scale: 0.95 }} onClick={() => generateQuestionPaper(generatedQuestions)} className="flex-1 min-w-[140px] py-4 bg-blue-600/20 hover:bg-blue-600/40 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md border border-blue-500/50 text-blue-200"><FileText size={18}/> Export Paper</motion.button>
                                  <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.4)" }} whileTap={{ scale: 0.95 }} onClick={() => generateAnswerKey(generatedQuestions)} className="flex-1 min-w-[140px] py-4 bg-emerald-600/20 hover:bg-emerald-600/40 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md border border-emerald-500/50 text-emerald-200"><CheckCircle size={18}/> Export Key</motion.button>
                              </motion.div>
                          )}
                      </AnimatePresence>
                      
                      <ConductQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} questions={generatedQuestions} token={token}/>
                  </motion.div>
                  
                  <div className="space-y-6 mt-8 relative z-10">
                      <AnimatePresence>
                          {generatedQuestions.map((q, index) => <QuestionDisplay key={`q-${index}`} question={q} index={index} />)}
                      </AnimatePresence>
                  </div>
              </div>
              
              <div className="lg:col-span-5 space-y-6">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                      <Library token={token} onSelect={handleBookSelection} selectedBooks={selectedBooks} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                      <ChatTutor token={token} selectedBooks={selectedBooks} enabled={isEngineInitialized} />
                  </motion.div>
              </div>
          </main>
      </motion.div>
  );
};

// --- LOGIN GATEWAY ---
const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isRegistering ? `${API_BASE_URL}/api/v1/signup` : `${API_BASE_URL}/token`;
    const formData = new FormData(); 
    formData.append('username', email); 
    formData.append('password', password);
    
    try {
        const response = await fetch(endpoint, {
             method: 'POST',
             body: isRegistering ? JSON.stringify({email, password}) : formData,
             headers: isRegistering ? {'Content-Type': 'application/json'} : {}
        });
        const data = await response.json();
        if (response.ok) {
            if (isRegistering) { setIsRegistering(false); alert("Account created successfully. Please sign in."); }
            else { setToken(data.access_token); localStorage.setItem('token', data.access_token); }
        } else alert(data.detail || "Authentication failed.");
    } catch (err) { alert("Connection error."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 15 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md border border-white/10 rounded-[2.5rem] p-10 bg-black/40 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden z-10"
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 animate-spin-slow pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex justify-center mb-8">
                <motion.div 
                    whileHover={{ rotate: 180, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                    <Cpu size={32} className="text-purple-300" />
                </motion.div>
            </div>
            <h2 className="text-3xl font-bold text-white text-center tracking-tight mb-8">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1 relative group">
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-5 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-500 shadow-inner group-hover:border-white/20" />
                </div>
                <div className="space-y-1 relative group">
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-5 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-500 shadow-inner group-hover:border-white/20" />
                </div>
                <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(168,85,247,0.5)" }} 
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold tracking-widest shadow-lg shadow-purple-600/20 mt-6 transition-all duration-300 border border-purple-500/50"
                >
                    {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
                </motion.button>
            </form>
            <p onClick={() => setIsRegistering(!isRegistering)} className="text-center text-sm text-gray-400 hover:text-purple-300 cursor-pointer transition-colors mt-8 font-medium tracking-wide">
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- APP WRAPPER ---
const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <Router>
      <InteractiveBackground />
      <AnimatePresence mode="wait">
        {showWelcome && <WelcomeScreen key="welcome" onComplete={() => setShowWelcome(false)} />}
      </AnimatePresence>
      
      {!showWelcome && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10">
            <Routes>
              <Route path="/" element={
                !token ? <Login setToken={setToken} /> : <TeacherDashboard token={token} onLogout={() => {setToken(null); localStorage.removeItem('token');}} />
              } />
            </Routes>
        </motion.div>
      )}
    </Router>
  );
};

export default App;