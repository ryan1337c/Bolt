"use client"

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  CheckCircle2,
  AlignLeft,
  X,
  AlertTriangle,
  FileText,
  CheckSquare,
  LayoutGrid,
  XCircle,
  Check
} from 'lucide-react';
import { create } from '@pdf-lib/fontkit';

export type Choice = {
  question_id?: number;
  choice_text: string;
  is_correct: boolean;
}

export type Question = {
  id: number;
  question_text: string;
  question_type: string;
  correct_answer: string;
  choices: Choice[];
};

type QuizActiveProps = {
  quizId: number;
  quizTitle: string;
  questions: Question[];
  duration: number; 
  onExit: () => void;
}

const formatTime = (seconds: number) => {
  if (seconds < 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const STORAGE_KEY = 'active_quiz_session';

export default function QuizActiveModal({ quizId, quizTitle, questions, duration, onExit }: QuizActiveProps) {

  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isTimeUpOpen, setIsTimeUpOpen] = useState(false);

  // Mount check required for portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- INITIAL LOAD & RESTORE ---
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try{
        const parsed = JSON.parse(savedState);
        if (String(parsed.quizId) === String(quizId)) {
          setHasStarted(parsed.hasStarted);
          setIsFinished(parsed.isFinished);
          setIsSubmitted(parsed.isSubmitted || false);
          setCurrentQuestionIndex(parsed.currentQuestionIndex);
          setSelectedAnswers(parsed.selectedAnswers);
          
          if (parsed.endTime) {
            setEndTime(parsed.endTime);
            const secondsRemaining = Math.floor((parsed.endTime - Date.now()) / 1000);
            setTimeLeft(secondsRemaining > 0 ? secondsRemaining : 0);
          }
        }
      } catch(e) { console.error(e); } 
    }
  }, [quizId]);

  // --- SAVE STATE ---
  useEffect(() => {
    if (hasStarted) {
        const stateToSave = {
            quizId,
            quizTitle,
            hasStarted,
            isFinished,
            isSubmitted,
            currentQuestionIndex,
            selectedAnswers,
            endTime
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [hasStarted, isFinished, isSubmitted, currentQuestionIndex, selectedAnswers, endTime, quizId, quizTitle]);

  // --- TIMER ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        if (endTime) {
           const now = Date.now();
           const diff = Math.floor((endTime - now) / 1000);
           if (diff <= 0) {
               setTimeLeft(0);
               handleAutoSubmit();
           } else {
               setTimeLeft(diff);
           }
        } else {
           setTimeLeft((prev) => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, timeLeft, endTime]);


  // --- HELPERS ---
  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
        const userAns = selectedAnswers[idx];
        if (userAns !== undefined && q.choices[userAns]?.is_correct) {
            correct++;
        }
    });
    const totalPoints = questions.length;
    const earnedPoints = correct;
    const percentage = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    
    return { 
        points: earnedPoints,      
        totalPoints: totalPoints, 
        percentage                           
    };
  };

  // --- HANDLERS ---
  const handleStart = () => {
    setHasStarted(true);
    const target = Date.now() + (duration * 1000);
    setEndTime(target);
    const newState = {
      quizId,
      quizTitle,
      hasStarted: true,
      isFinished: false,
      isSubmitted: false,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      endTime: target
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (isSubmitted) confirmExit();
      else setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsFinished(false);
    setIsMobileNavOpen(false); 
  };

  const handleBackToQuiz = () => {
    setCurrentQuestionIndex(questions.length - 1);
    setIsFinished(false);
  };

  // UPDATED: Triggers the popup and locks the quiz
  const handleAutoSubmit = () => {
    setIsFinished(false);
    setIsSubmitted(true);
    setCurrentQuestionIndex(0);
    setIsExitConfirmOpen(false);
    setIsTimeUpOpen(true); // Open "Time's Up" modal
  };

  const handleSubmit = () => {
    setIsFinished(false);
    setIsSubmitted(true);
    setCurrentQuestionIndex(0);
  };

  const handleExitClick = () => {
    if (isSubmitted) confirmExit();
    else setIsExitConfirmOpen(true);
  };

  const confirmExit = () => {
    setIsExitConfirmOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    onExit(); 
  };

  // --- RENDER COMPONENT: NAVIGATION BUTTON ---
  const renderNavButton = (idx: number) => {
    const isCurrent = currentQuestionIndex === idx;
    const userAns = selectedAnswers[idx];
    
    let borderClass = "border-slate-200 dark:border-slate-600";
    let statusBg = "bg-slate-100 dark:bg-slate-700"; 
    let Icon = null;

    if (isSubmitted) {
       const isCorrect = questions[idx].choices[userAns]?.is_correct;
       
       if (userAns === undefined) {
           statusBg = "bg-slate-400 dark:bg-slate-600"; 
       } else if (isCorrect) {
           statusBg = "bg-green-600";
           Icon = Check;
       } else {
           statusBg = "bg-red-600";
       }
    } else {
       if (userAns !== undefined) {
          statusBg = "bg-violet-600";
       }
    }

    if (isCurrent) {
        borderClass = "border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900 z-10";
    }

    return (
        <button
            key={idx}
            onClick={() => jumpToQuestion(idx)}
            className={`
                flex flex-col items-stretch overflow-hidden rounded-lg border transition-all 
                aspect-[3/4] ${borderClass} hover:border-violet-400
            `}
        >
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm">
                {idx + 1}
            </div>
            <div className={`h-[35%] flex items-center justify-center ${statusBg} transition-colors duration-200`}>
                {Icon && <Icon size={12} strokeWidth={4} className="text-white" />}
            </div>
        </button>
    );
  };


  // --- RENDER 1: START SCREEN ---
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-gray-900 items-center justify-center p-4 md:p-6 animate-fade-in">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="h-32 md:h-40 bg-gradient-to-r from-violet-600 to-indigo-600 relative shrink-0">
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar z-10">
               <div className="min-h-full w-full flex items-center justify-center p-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-white text-center break-words leading-tight">{quizTitle}</h1>
               </div>
            </div>
          </div>
          <div className="p-6 md:p-8 text-center space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Ready to begin?</h2>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-slate-500 dark:text-slate-400 mt-2">
                 <span className="flex items-center gap-2 text-sm md:text-base"><FileText size={18} /> {questions.length} Questions</span>
                 <span className="flex items-center gap-2 text-sm md:text-base"><Clock size={18} /> {formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-center mt-8">
              <button onClick={onExit} className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleStart} className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] text-white font-bold shadow-lg hover:shadow-xl transition-all">Begin Quiz</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: SUMMARY SCREEN ---
  if (isFinished) {
    const answeredCount = Object.keys(selectedAnswers).length;
    return (
      <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-gray-900 animate-fade-in overflow-hidden">
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Quiz Summary</h2>
            <div className={`flex items-center gap-2 ${timeLeft < 60 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700'} px-3 py-1.5 rounded-lg text-sm font-medium font-mono`}>
                <Clock size={16} /><span>{formatTime(timeLeft)}</span>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Are you sure?</h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        You have answered <span className="font-bold text-violet-600 dark:text-blue-500">{answeredCount}</span> out of <span className="font-bold">{questions.length}</span> questions.
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {questions.map((q, idx) => {
                        const isAnswered = selectedAnswers[idx] !== undefined;
                        return (
                            <button key={idx} onClick={() => jumpToQuestion(idx)} className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4 text-left">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">{idx + 1}</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{q.question_text || `Question ${idx + 1}`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAnswered ? (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full"><CheckCircle2 size={14} /> <span className="hidden sm:inline">Answered</span></span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full"><AlertTriangle size={14} /> <span className="hidden sm:inline">Incomplete</span></span>
                                    )}
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
        <div className="h-16 md:h-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-10 flex-shrink-0">
            <button onClick={handleBackToQuiz} className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={20} /> Back</button>
            <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] text-white rounded-lg font-bold shadow-md transition-all">Submit Quiz</button>
        </div>
      </div>
    );
  }

  // --- RENDER 3: ACTIVE & REVIEW INTERFACE ---
  const currentQuestion = questions[currentQuestionIndex];
  const score = calculateScore();

  return (
    <div className={`flex h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden animate-fade-in relative`}>
      
      {/* LEFT: MAIN QUESTION AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileNavOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"><LayoutGrid size={24} /></button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                <span className="hidden sm:inline">Question</span> {currentQuestionIndex + 1} <span className="text-slate-300 dark:text-slate-600">/</span> {questions.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {isSubmitted ? (
                 <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600">
                    <span className="font-bold text-slate-900 dark:text-white mr-1.5">Grade</span>
                    <span className="font-bold text-slate-900 dark:text-white">{score.points}</span>
                    <span className="text-slate-500 dark:text-slate-400 mx-1">out of</span>
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5">{score.totalPoints}</span>
                    <span className="font-bold text-slate-900 dark:text-white">({score.percentage}%)</span>
                 </div>
            ) : (
                <div className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${timeLeft < 60 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700'}`}>
                    <Clock size={16} /><span>{formatTime(timeLeft)}</span>
                </div>
            )}
            <button onClick={handleExitClick} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title="Exit Quiz"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-white leading-relaxed">
              {currentQuestion.question_text}
            </div>

            <div className="space-y-3">
              {currentQuestion.choices.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === index;
                const isCorrect = option.is_correct;
                
                let containerClass = "";
                let circleClass = "";
                let textClass = "";
                let icon = null;

                if (isSubmitted) {
                    // Review mode
                    containerClass = "border-2 cursor-not-allowed ";
                    
                    if (isCorrect) {
                        if (isSelected) {
                            // Correct + Selected (Green Solid)
                            containerClass += "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50";
                            circleClass = "border-green-600 bg-green-600 text-white";
                            textClass = "text-green-900 dark:text-green-100 font-medium";
                            icon = <CheckCircle2 size={16} strokeWidth={3} />;
                        } else {
                            // Correct + Missed (Green Dashed)
                            containerClass += "border-green-500 border-dashed bg-white dark:bg-slate-800 opacity-80";
                            circleClass = "border-green-500 text-green-600";
                            textClass = "text-green-700 dark:text-green-400";
                            icon = <CheckCircle2 size={16} />;
                        }
                    } else if (isSelected) {
                        // Wrong + Selected (Red Solid)
                        containerClass += "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50";
                        circleClass = "border-red-600 bg-red-600 text-white";
                        textClass = "text-red-900 dark:text-red-100 font-medium";
                        icon = <XCircle size={16} strokeWidth={3} />;
                    } else {
                        // Irrelevant (Dimmed)
                        containerClass += "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60";
                        circleClass = "border-slate-300 dark:border-slate-600";
                        textClass = "text-slate-400 dark:text-slate-600";
                    }

                } else {
                    // Active mode
                    containerClass = "border-2 cursor-pointer transition-all ";
                    
                    if (isSelected) {
                        containerClass += "border-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500";
                        circleClass = "border-violet-600 bg-white dark:bg-slate-800";
                        textClass = "text-violet-900 dark:text-violet-100 font-medium";
                    } else {
                        containerClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-slate-600";
                        circleClass = "border-slate-300 dark:border-slate-600 group-hover:border-violet-400";
                        textClass = "text-slate-700 dark:text-slate-300";
                    }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-3 md:p-4 rounded-xl flex items-start gap-4 group ${containerClass}`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${circleClass}`}>
                      {isSubmitted ? (
                          icon || (isSelected && <div className="w-3 h-3 rounded-full bg-slate-400" />)
                      ) : (
                          isSelected ? <div className="w-3 h-3 rounded-full bg-violet-600 dark:bg-violet-500"></div> : <span className="text-transparent text-xs">A</span>
                      )}
                    </div>
                    <span className={`text-sm md:text-base ${textClass}`}>
                        {option.choice_text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-16 md:h-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-10 flex-shrink-0">
          <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base">
            <ChevronLeft size={20} /> Previous
          </button>
          <button onClick={handleNext} className={`flex items-center gap-2 px-5 md:px-6 py-2 md:py-2.5 text-white rounded-lg font-medium shadow-md transition-all text-sm md:text-base ${
              isSubmitted ? 'bg-slate-700 hover:bg-slate-800' : 'bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9]'
          }`}>
            {currentQuestionIndex === questions.length - 1 ? (isSubmitted ? 'Exit' : 'Finish') : 'Next'} 
            {currentQuestionIndex !== questions.length - 1 && <ChevronRight size={20} />}
            {currentQuestionIndex === questions.length - 1 && !isSubmitted && <CheckSquare size={18} />}
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 hidden lg:flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><AlignLeft size={18} /> Quiz Navigator</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, idx) => renderNavButton(idx))}
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
             {isSubmitted ? (
                 <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-600"></div><span>Correct</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-600"></div><span>Wrong</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600"></div><span>Unanswered</span></div>
                 </div>
             ) : (
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-violet-600"></div><span>Answered</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm border-2 border-violet-600"></div><span>Current</span></div>
                </div>
             )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mounted && isMobileNavOpen && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/50  animate-in fade-in" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative w-72 h-[100dvh] bg-white dark:bg-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><AlignLeft size={18} /> Navigator</h3>
                    <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, idx) => renderNavButton(idx))}
                    </div>
                </div>
                <div className="p-4 pb-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                     {isSubmitted ? (
                         <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-600"></div><span>Correct</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-600"></div><span>Wrong</span></div>
                         </div>
                     ) : (
                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-violet-600"></div><span>Answered</span></div>
                        </div>
                     )}
                </div>
            </div>
        </div>, document.body
      )}

      {/* CONFIRM EXIT */}
      {mounted && isExitConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400"><AlertTriangle size={32} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Exit Quiz?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Are you sure you want to leave? Your progress will <span className="font-bold text-red-500">not be saved</span>.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-4">
                        <button onClick={() => setIsExitConfirmOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button onClick={confirmExit} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">Exit</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Time up modal */}
      {mounted && isTimeUpOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-violet-100 dark:bg-blue-900/30 rounded-full text-violet-600 dark:text-blue-400">
                        <Clock size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Time's Up!</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                           Your answers have been automatically submitted. All work has been saved and is ready for review.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full mt-4">
                        <button 
                            onClick={() => setIsTimeUpOpen(false)}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            View Results
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
}