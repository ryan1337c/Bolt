"use client"

import React, { useState, useEffect } from 'react';
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import { 
  X, 
  Sparkles, 
  PencilRuler, 
  Clock, 
  ListChecks, 
  AlignLeft,
  Plus,
  Trash2,
  Circle,
  MessageSquare,
  CheckCircle2,
  Eraser,
  AlertTriangle,
  Loader2,
  FileText 
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type QuizGenerationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onQuizCreated: (quiz: any) => void;
  editMode?: boolean;
  initialData?: any;
  onQuizUpdated: (quiz: any) => void;
}

const DURATION_OPTIONS = [
    { value: "300", label: "5 Minutes" },   
    { value: "600", label: "10 Minutes" },  
    { value: "900", label: "15 Minutes" },  
    { value: "1800", label: "30 Minutes" }, 
    { value: "2700", label: "45 Minutes" }, 
    { value: "3600", label: "1 Hour" },     
    { value: "5400", label: "1.5 Hours" },  
    { value: "7200", label: "2 Hours" },    
];

type ManualQuestion = {
  id: string;
  question_text: string; 
  type: 'multiple_choice' | 'short_answer';
  choices: string[];    
  correct_index: number; 
};

// Form Error State Interface
type FormErrors = {
  title?: string;
  topic?: string;
  manual?: string;
};

export default function QuizGenerationModal({ isOpen, onClose, isProcessing, setIsProcessing, onQuizCreated, editMode = false, initialData, onQuizUpdated}: QuizGenerationModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'manual' | 'ai'>('ai'); 
  const [userId, setUserId] = useState<string | null>(null);

  const authServices = new AuthServices();
  const publicServices = new PublicServices();
  const questionLimit = 50;
  const topicLimit = 40000;
  
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<ManualQuestion[]>([
    { id: '1', question_text: '', type: 'multiple_choice', choices: ['', ''], correct_index: 0 }
  ]);
  
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | string>(10);
  const [duration, setDuration] = useState('600'); 
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async() => {
      try {
        const session = await authServices.getSession();
        if (session?.user) {
            setUserId(session.user.id);
        }
      }
      catch (error: any) {
        console.error("Error fetching session", error)
      }
    }
    fetchSession();
  }, []);

  // Auto-dismiss server error after 4 seconds
  useEffect(() => {
    if (serverError) {
        const timer = setTimeout(() => setServerError(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [serverError]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setMode('ai'); 
    setTopic('');
    setQuestionCount(10);
    setDuration('600');
    setQuestions([
      { id: '1', question_text: '', type: 'multiple_choice', choices: ['', ''], correct_index: 0 }
    ]);
    setFormErrors({});
    setIsClearConfirmOpen(false);
    onClose();
  }

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMode('ai'); 
    setTopic('');
    setQuestionCount(10);
    setDuration('600');
    setQuestions([
      { id: '1', question_text: '', type: 'multiple_choice', choices: ['', ''], correct_index: 0 }
    ]);
    setFormErrors({});
    setIsClearConfirmOpen(false);
  }

    useEffect(() => {
    if (isOpen && editMode && initialData) {
        // We force 'manual' mode because editing an AI quiz is effectively a manual task
        setMode('manual'); 
        
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setDuration(String(initialData.duration));
        setQuestionCount(initialData.count); 
        
        // Map database questions to the UI ManualQuestion format
        if (initialData.questions) {
            const formattedQuestions = initialData.questions.map((q: any) => ({
                id: String(q.id),
                question_text: q.question_text,
                type: q.question_type || 'multiple_choice',
                choices: q.choices.map((c: any) => c.choice_text),
                // Find index of the choice where is_correct is true
                correct_index: q.choices.findIndex((c: any) => c.is_correct)
            }));
            setQuestions(formattedQuestions);
        }
    } else if (isOpen && !editMode) {
        // Reset if opening in Create mode
        resetForm();
    }
  }, [isOpen, editMode, initialData]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setFormErrors({});
    setServerError(null);

    // Validation
    const newErrors: FormErrors = {};
    let hasError = false;

    if (!title.trim()) {
        newErrors.title = "Please enter a quiz title.";
        hasError = true;
    }

    if (mode === 'ai') {
        if (!topic.trim()) {
            newErrors.topic = "Please enter a topic.";
            hasError = true;
        }
    } else {
        const invalidQuestions = questions.some(q => !q.question_text.trim());
        const invalidOptions = questions.some(q => q.type === 'multiple_choice' && q.choices.some(opt => !opt.trim()));
        
        if (invalidQuestions || invalidOptions) {
            newErrors.manual = "Please fill out all question text and choice fields.";
            hasError = true;
        }
    }

    if (hasError) {
        setFormErrors(newErrors);
        return;
    }

    if (editMode) {
        try {
            setIsProcessing(true);
            
            // Call Update API 
            const updatedQuiz = await publicServices.updateQuiz(
                initialData.id, 
                title, 
                description, 
                Number(duration), 
                questions
            );
            
            onQuizUpdated(updatedQuiz); 
            
            handleClose();
        } catch(e) { 
            console.error(e); 
            setServerError("An unexpected error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }
    else {
      // Submission
      if (mode === 'ai') {
          setIsProcessing(true);
          try {
            const session = await authServices.getSession();
            const result = await fetch(`/api/generateQuiz`, {
              method: "POST",
              headers: {
                'Content-type' : 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                title: title,
                topic: topic,
                questionCount: Number(questionCount),
              })
            });
            
            const data = await result.json();

            if (!result.ok) {
              throw new Error(data.error || "Something went wrong!")
            }

            const quiz = await publicServices.createQuiz(title, userId, mode, Number(duration), Number(questionCount), description, data.quiz);
            
            onQuizCreated(quiz);
            handleClose(); 
          }
          catch(error: any) {
            console.log(`generate quiz error ${error}` );
            setServerError(error.message || "An unexpected error occurred. Please try again.");
          }
          finally {
            setIsProcessing(false);
          }

      } else {
          try {
              setIsProcessing(true);
              const quiz = await publicServices.createQuiz(title, userId, mode, Number(duration), questions.length, description, questions);
              
              onQuizCreated(quiz);
              handleClose();
          } catch (error) {
              console.error(error);
              setServerError("An unexpected error occurred. Please try again.");
          } finally {
              setIsProcessing(false);
          }
      }
    }
  };

  const handleQuestionCountBlur = () => {
    let val = Number(questionCount);
    if (val < 1) val = 1;
    if (val > 50) val = 50;
    setQuestionCount(val);
  };

  // --- Manual Mode Handlers ---
  const addQuestion = () => {
    if (questions.length === questionLimit) return;
    setQuestions([
      ...questions, 
      { id: Date.now().toString(), question_text: '', type: 'multiple_choice', choices: ['', ''], correct_index: 0 }
    ]);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length > 1) setQuestions(questions.filter(q => q.id !== id));
  };

  const handleClearAllClick = () => {
    if (questions.length > 1 || questions[0].question_text.trim() !== '' || questions[0].choices.length > 2) {
        setIsClearConfirmOpen(true);
    }
  };

  const confirmClearAll = () => {
    setQuestions([{ id: Date.now().toString(), question_text: '', type: 'multiple_choice', choices: ['', ''], correct_index: 0 }]);
    setIsClearConfirmOpen(false);
    setFormErrors(prev => ({ ...prev, manual: undefined }));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, question_text: text } : q));
    if (text.trim()) setFormErrors(prev => ({ ...prev, manual: undefined }));
  };

  const updateQuestionType = (id: string, type: 'multiple_choice' | 'short_answer') => {
    setQuestions(questions.map(q => q.id === id ? { ...q, type } : q));
  };

  const setCorrectAnswer = (qId: string, index: number) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correct_index: index } : q));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.choices.length < 5) return { ...q, choices: [...q.choices, ''] };
      return q;
    }));
  };

  const removeOption = (qId: string, idx: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.choices.length > 2) {
        const newOpts = [...q.choices];
        newOpts.splice(idx, 1);
        let newAnswerIdx = q.correct_index;
        if (q.correct_index === idx) newAnswerIdx = 0;
        else if (q.correct_index > idx) newAnswerIdx = q.correct_index - 1;
        return { ...q, choices: newOpts, correct_index: newAnswerIdx };
      }
      return q;
    }));
  };

  const updateOptionText = (qId: string, idx: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.choices];
        newOpts[idx] = text;
        return { ...q, choices: newOpts };
      }
      return q;
    }));
    if (text.trim()) setFormErrors(prev => ({ ...prev, manual: undefined }));
  };

  // Styles
  const inputBaseClasses = "w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const getBorderClasses = (hasError: boolean) => {
    return hasError 
        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
        : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500";
  };

  const durationTriggerClasses = `${inputBaseClasses} h-auto outline-none border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-sm ">
      {/* SLIDE-DOWN ERROR TOAST */}
      {serverError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300 fade-in">
            <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                <AlertTriangle size={20} className="shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium">{serverError}</p>
                <button 
                    onClick={() => setServerError(null)}
                    className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
      )}
      <div 
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
        role="dialog"
      >
        
        {isProcessing && (
          <div className="absolute inset-0 z-[60] bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center animate-fade-in">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Generating Quiz...</p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editMode ? "Edit Quiz" : "Create New Quiz"}</h2>
          <button 
            disabled={isProcessing}
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`p-6 overflow-y-auto custom-scrollbar space-y-6 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              disabled={isProcessing}
              type="text"
              placeholder="e.g., Advanced Biology Finals"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setFormErrors(prev => ({...prev, title: undefined}));
              }}
              className={`${inputBaseClasses} outline-none ${getBorderClasses(!!formErrors.title)}`}
            />
            {formErrors.title && (
                <p className="text-xs text-red-500 font-medium animate-fade-in-sm flex items-center gap-1">
                    <AlertTriangle size={12} /> {formErrors.title}
                </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              Description 
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Optional</span>
            </label>
            <textarea
              disabled={isProcessing}
              placeholder="Briefly describe what this quiz is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputBaseClasses} outline-none border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 resize-none`}
            />
          </div>
          
          {/* Mode Selection */}
          {!editMode && (
                      <div className="grid grid-cols-2 gap-4">
            <button
              disabled={isProcessing}
              onClick={() => { setMode('manual'); setFormErrors({}); }}
              className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'manual' 
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-slate-500'
              }`}
            >
              <PencilRuler size={24} className={mode === 'manual' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'} />
              <div className="text-center">
                <span className={`block font-semibold ${mode === 'manual' ? 'text-violet-900 dark:text-violet-100' : 'text-slate-600 dark:text-slate-300'}`}>Manual</span>
                <span className="text-xs text-slate-500">Create from scratch</span>
              </div>
            </button>

            <button
              disabled={isProcessing}
              onClick={() => { setMode('ai'); setFormErrors({}); }}
              className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'ai' 
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-slate-500'
              }`}
            >
              <Sparkles size={24} className={mode === 'ai' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'} />
              <div className="text-center">
                <span className={`block font-semibold ${mode === 'ai' ? 'text-violet-900 dark:text-violet-100' : 'text-slate-600 dark:text-slate-300'}`}>Generate with AI</span>
                <span className="text-xs text-slate-500">Auto-generated questions</span>
              </div>
            </button>
          </div>
          )}


          {mode === 'manual' ? (
             <div className="space-y-6 animate-fade-in-sm">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Questions ({questions.length})
                    </h3>
                    <button 
                        onClick={handleClearAllClick}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Eraser size={14} /> Clear All
                    </button>
                </div>

                {formErrors.manual && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-300 text-sm animate-fade-in-sm">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <p>{formErrors.manual}</p>
                    </div>
                )}

                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                      
                      <div className="flex gap-3 mb-4">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {qIndex + 1}
                        </span>
                        <div className="flex-grow space-y-3">
                          <input
                            type="text"
                            disabled={isProcessing}
                            placeholder="Type your question here..."
                            value={q.question_text}
                            onChange={(e) => updateQuestionText(q.id, e.target.value)}
                            className={`${inputBaseClasses} placeholder-slate-400 bg-white dark:bg-slate-800 outline-none ${getBorderClasses(!!formErrors.manual && !q.question_text.trim())}`}
                          />
                          
                          <div className="flex gap-2">
                             <button
                               onClick={() => updateQuestionType(q.id, 'multiple_choice')}
                               disabled={isProcessing}
                               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                                 q.type === 'multiple_choice' 
                                  ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                               }`}
                             >
                               <ListChecks size={14} /> Multiple Choice
                             </button>
                             <button
                               onClick={() => updateQuestionType(q.id, 'short_answer')}
                               disabled={isProcessing}
                               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                                 q.type === 'short_answer' 
                                  ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                               }`}
                             >
                               <AlignLeft size={14} /> Short/Long Answer
                             </button>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteQuestion(q.id)}
                          disabled={questions.length === 1 || isProcessing}
                          className="relative group flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="pl-11">
                        {q.type === 'short_answer' ? (
                          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-sm">
                            <MessageSquare size={20} className="mb-2 opacity-50" />
                            <span>Short/Long Answer mode coming soon...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             {q.choices.map((opt, optIndex) => (
                               <div key={optIndex} className="flex items-center gap-3 group">
                                  <button 
                                    onClick={() => setCorrectAnswer(q.id, optIndex)}
                                    disabled={isProcessing}
                                    className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                  >
                                    {q.correct_index === optIndex ? (
                                        <CheckCircle2 size={20} className="text-green-500 fill-green-100 dark:fill-green-900" />
                                    ) : (
                                        <Circle size={20} className="text-slate-300 dark:text-slate-600 hover:text-green-400 transition-colors" />
                                    )}
                                  </button>

                                  <input 
                                    type="text"
                                    disabled={isProcessing}
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOptionText(q.id, optIndex, e.target.value)}
                                    className={`placeholder-slate-400 flex-grow px-3 py-2 rounded-lg text-sm text-black dark:text-slate-100 border bg-white dark:bg-slate-800 disabled:opacity-50 outline-none ${getBorderClasses(!!formErrors.manual && !opt.trim())}`}
                                  />
                                  {q.choices.length > 2 && (
                                    <button 
                                      onClick={() => removeOption(q.id, optIndex)}
                                      disabled={isProcessing}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-opacity disabled:opacity-0"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                             ))}
                             
                             {q.choices.length < 5 && (
                               <button
                                 onClick={() => addOption(q.id)}
                                 disabled={isProcessing}
                                 className="ml-7 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mt-2 disabled:opacity-50 disabled:no-underline"
                               >
                                 <Plus size={12} /> Add Option
                               </button>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestion}
                  disabled={isProcessing}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium hover:border-violet-300 dark:hover:border-slate-500 hover:text-violet-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Add Question
                </button>

                {/* --- ADDED DURATION FOR MANUAL MODE --- */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Clock size={16} />
                    Duration
                  </label>
                  
                  <Select value={duration} onValueChange={setDuration} disabled={isProcessing}>
                    <SelectTrigger className={durationTriggerClasses}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 max-h-[12rem] overflow-y-auto z-[60]">
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

             </div>
          ) : (
            <div className="space-y-6 animate-fade-in-sm">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <AlignLeft size={16} />
                  Topic & Style <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs font-medium ${topic.length >= topicLimit ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {topic.length}/{topicLimit}
                </span>
                <textarea
                  disabled={isProcessing}
                  placeholder="Enter topic, difficulty, or style here (e.g., 'Calculus integrals, hard difficulty, focus on real-world applications')"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (e.target.value.trim()) setFormErrors(prev => ({...prev, topic: undefined}));
                  }}
                  rows={3}
                  maxLength={topicLimit}
                  className={`${inputBaseClasses} outline-none ${getBorderClasses(!!formErrors.topic)}`}
                />
                {formErrors.topic && (
                    <p className="text-xs text-red-500 font-medium animate-fade-in-sm flex items-center gap-1">
                        <AlertTriangle size={12} /> {formErrors.topic}
                    </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ListChecks size={16} />
                    Number of Questions
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-auto">(1-50)</span>
                  </label>
                  
                  <input
                    disabled={isProcessing}
                    type="number"
                    min="1"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    onBlur={handleQuestionCountBlur}
                    className={`${inputBaseClasses} border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Clock size={16} />
                    Duration
                  </label>
                  
                  <Select value={duration} onValueChange={setDuration} disabled={isProcessing}>
                    <SelectTrigger className={durationTriggerClasses}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 max-h-[12rem] overflow-y-auto z-[60]">
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button
            disabled={isProcessing}
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {isProcessing ? (editMode ? 'Saving...' : 'Processing...') : (editMode ? 'Save Changes' : 'Generate Quiz')}
          </button>
        </div>

        {isClearConfirmOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col items-center text-center gap-4">
                   <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                      <AlertTriangle size={32} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Clear all questions?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        This will permanently delete all your questions. This action cannot be undone.
                      </p>
                   </div>
                   <div className="flex gap-3 w-full mt-2">
                      <button 
                        onClick={() => setIsClearConfirmOpen(false)} 
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmClearAll} 
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Yes, Clear All
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}