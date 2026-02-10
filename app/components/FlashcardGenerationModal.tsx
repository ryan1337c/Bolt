"use client"

import React, { useState, useEffect } from 'react';
import { PublicServices } from "@/lib/publicServices";
import { 
  X, 
  Sparkles, 
  PencilRuler, 
  ListChecks, 
  AlignLeft, 
  Plus, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Layers,
  Type,
  Eraser
} from 'lucide-react';
import { createPortal } from 'react-dom';

type FlashcardGenerationModalProps = {
  onClose: () => void;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onDeckCreated: (deck: any) => void;
  onDeckUpdated: (deck: any) => void;
  userId: string | null;
  currFolderId: number | null;
  initialData?: any;
  editMode:boolean;
}

type ManualCard = {
  id: string | number;
  front: string;
  back: string;
};

type FormErrors = {
  title?: string;
  topic?: string;
  manual?: string;
};

export default function FlashcardGenerationModal({ 
  onClose, 
  isProcessing, 
  setIsProcessing, 
  onDeckCreated,
  onDeckUpdated,
  userId,
  currFolderId,
  initialData,
  editMode,
}: FlashcardGenerationModalProps) {
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'manual' | 'ai'>('ai'); 

  const publicServices = new PublicServices();
  const cardLimit = 50;

  // Edit 
  const[modifiedCardIds, setModifiedCardIds] = useState(new Set());
  const[deletedCardIds, setDeletedCardIds] = useState<number[]>([]);
  
  // AI State
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState<number | string>(10);

  // Manual State 
  const [cards, setCards] = useState<ManualCard[]>([]);
  
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Auto-dismiss server error after 4 seconds
  useEffect(() => {
    if (serverError) {
        const timer = setTimeout(() => setServerError(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [serverError]);

  // Retrieve data of current deck while in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      setMode('manual'); 
      setTitle(initialData.title);
      setDescription(initialData.description);
      
      const formattedCards = initialData.flashcards.map((card: any) => ({
        id: card.id,
        front: card.prompt,
        back: card.answer
      }));
      setCards(formattedCards);
    }
  }, [editMode])

  const handleClose = () => {
    onClose();
  }

  // --- HANDLERS ---

  const handleGenerate = async () => {
    // Server errors
    setFormErrors({});
    setServerError(null);
    
    // Form errors
    const newErrors: FormErrors = {};
    let hasError = false;

    if (!title.trim()) {
        newErrors.title = "Please enter a deck title.";
        hasError = true;
    }

    if (mode === 'ai') {
        if (!topic.trim()) {
            newErrors.topic = "Please enter a topic.";
            hasError = true;
        }
    } else {
        if (cards.length > 0) {
           const invalidCards = cards.some(c => !c.front.trim() || !c.back.trim());
          if (invalidCards) {
              newErrors.manual = "Please fill out both Front and Back for all cards.";
              hasError = true;
          }
        }
    }

    if (hasError) {
        setFormErrors(newErrors);
        return;
    }

    // Handle edit mode
    if (editMode) {
      try {
        setIsProcessing(true);
        // Get only the cards that were modified or added
        const cardsToUpdate = cards.filter(card => modifiedCardIds.has(card.id));

        // Service will determine what needs updating
        const updatedDeck = await publicServices.updateFlashcards(
          userId, 
          initialData.id, 
          title, 
          description, 
          cardsToUpdate,
          deletedCardIds
        );

        onDeckUpdated(updatedDeck);
        handleClose();
      }
      catch (error: any) {
        console.error(error);
        setServerError("An unexpected error occurred. Please try again.");
      }
      finally{
        setIsProcessing(false);
        return;
      }
    }

    // Handle ai and manual mode
    const formatDeck = (response: any) => ({
      id: response.deck.id,
      type: "deck",
      title: response.deck.title,
      description: response.deck.description,
      mode: response.deck.mode,
      parent_id: response.deck.parent_id,
      created_at: response.deck.created_at,
      last_updated: response.deck.last_updated,
      isStarred: response.deck.isStarred,
      count: response.flashcards ? response.flashcards.length : 0
    });
    setIsProcessing(true);

    try {
      let cardsToCreate;
      if (mode === 'ai') {
        const result = await fetch(`/api/generateDeck`, {
            method: "POST",
            headers: { 'Content-type' : 'application/json' },
            body: JSON.stringify({
              title,
              description,
              topic,
              count: Number(cardCount),
            })
          });
          
          const data = await result.json();

          if (!result.ok) {
            throw new Error(data.error || "Something went wrong generating your deck.");
          }

          cardsToCreate = data.cards;
      }
      else {
        cardsToCreate = cards;
      }

      // Create db (same for both modes)
      const response = await publicServices.createDeck(
          userId, currFolderId, title, description, mode, cardsToCreate
      );

      if (!response) {
        throw new Error("Failed to create deck");
      }

      const formattedDeck = formatDeck(response);
      console.log("Card count is: ", formattedDeck.count);
      onDeckCreated(formattedDeck);
      handleClose();
    }
    catch (error: any) {
      console.error(error);
      setServerError(error.message || "An unexpected error occurred. Please try again.");
    }
    finally {
      setIsProcessing(false);
    }
  };

  const handleCardCountBlur = () => {
    let val = Number(cardCount);
    if (val < 5) val = 5;
    if (val > 50) val = 50;
    setCardCount(val);
  };

  // --- MANUAL MODE HANDLERS ---
  const addCard = () => {
    if (cards.length === cardLimit) return;
    const newCardId = Date.now().toString();
    setCards([...cards, { id: newCardId, front: '', back: '' }]);
    // Mark new card as modified
    setModifiedCardIds(prev => new Set(prev).add(newCardId));
  };

  const deleteCard = (id: string | number) => {
      const remainingCards = cards.filter(c => c.id !== id);
      setCards(cards.filter(c => c.id !== id));

      // If ID is a number, it came from the DB. We must tell DB to delete it.
      if (typeof id === 'number') {
          setDeletedCardIds(prev => [...prev, id]);
      }

      // Remove from modified set
      setModifiedCardIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // ✅ Clear manual error if no cards OR all valid
      const allValid = remainingCards.length === 0 || 
                      remainingCards.every(c => c.front.trim() && c.back.trim());
      if (allValid) {
        setFormErrors(prev => ({ ...prev, manual: undefined }));
      }
  };

  const updateCard = (id: string | number, field: 'front' | 'back', value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    // Mark card as modified
    setModifiedCardIds(prev => new Set(prev).add(id));
    if (value.trim()) setFormErrors(prev => ({ ...prev, manual: undefined }));
  };

  const handleClearAllClick = () => {
      setIsClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    // Mark all DB cards for deletion (cards with numeric IDs)
    const dbCardIds = cards
      .filter(card => typeof card.id === 'number')
      .map(card => card.id as number);
    setDeletedCardIds(prev => [...prev, ...dbCardIds]);
    
    setCards([]);
    setIsClearConfirmOpen(false);
    setModifiedCardIds(new Set());
    setFormErrors(prev => ({ ...prev, manual: undefined }));
  };

  // Add a mounting check for Next.js SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // 3. LOCK SCROLL: Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  // Styles
  const inputBaseClasses = "w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const getBorderClasses = (hasError: boolean) => {
    return hasError 
        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
        : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500";
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-sm">
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
        
        {/* LOADING OVERLAY */}
        {isProcessing && (
          <div className="absolute inset-0 z-[60] bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center animate-fade-in">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Processing Deck...</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editMode ? "Edit Deck" : "Create New Deck"}</h2>
          <button 
            disabled={isProcessing}
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 overflow-y-auto custom-scrollbar space-y-6 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Deck Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Deck Title <span className="text-red-500">*</span>
            </label>
            <input
              disabled={isProcessing}
              type="text"
              placeholder="e.g., Biochemistry Midterm"
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              Description 
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Optional</span>
            </label>
            <textarea
              disabled={isProcessing}
              placeholder="What is this deck about?"
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
                  <span className="text-xs text-slate-500">Auto-generated cards</span>
                </div>
              </button>
            </div>
          )}

          {/* --- MANUAL MODE --- */}
          {mode === 'manual' ? (
             <div className="space-y-6 animate-fade-in-sm">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Cards ({cards.length})
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
                  {cards.map((card, index) => (
                    <div key={card.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                      <div className="flex justify-between items-start mb-3">
                         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {index + 1}
                         </span>
                         <button
                          onClick={() => deleteCard(card.id)}
                          disabled={isProcessing}
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Front */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <Layers size={12} /> Front
                            </label>
                            <textarea
                                disabled={isProcessing}
                                placeholder="Term or Question..."
                                value={card.front}
                                onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                                rows={2}
                                className={`${inputBaseClasses} bg-white dark:bg-slate-800 outline-none resize-none ${getBorderClasses(!!formErrors.manual && !card.front.trim())}`}
                            />
                        </div>

                        {/* Back */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <Type size={12} /> Back
                            </label>
                            <textarea
                                disabled={isProcessing}
                                placeholder="Definition or Answer..."
                                value={card.back}
                                onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                                rows={2}
                                className={`${inputBaseClasses} bg-white dark:bg-slate-800 outline-none resize-none ${getBorderClasses(!!formErrors.manual && !card.back.trim())}`}
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCard}
                  disabled={isProcessing}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium hover:border-violet-300 dark:hover:border-slate-500 hover:text-violet-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Add Card
                </button>
             </div>

          ) : (
            
            // --- AI MODE ---
            <div className="space-y-6 animate-fade-in-sm">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <AlignLeft size={16} />
                  Topic or Text <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs font-medium ${topic.length >= 10000 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {topic.length}/10000
                </span>
                <textarea
                  disabled={isProcessing}
                  placeholder="Enter a topic, paste notes, or describe what you want to study..."
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (e.target.value.trim()) setFormErrors(prev => ({...prev, topic: undefined}));
                  }}
                  rows={6}
                  maxLength={10000}
                  className={`${inputBaseClasses} outline-none ${getBorderClasses(!!formErrors.topic)}`}
                />
                {formErrors.topic && (
                    <p className="text-xs text-red-500 font-medium animate-fade-in-sm flex items-center gap-1">
                        <AlertTriangle size={12} /> {formErrors.topic}
                    </p>
                )}
              </div>

              <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ListChecks size={16} />
                    Number of Cards
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-normal ml-auto">(5-50)</span>
                  </label>
                  
                  <input
                    disabled={isProcessing}
                    type="number"
                    min="5"
                    max="50"
                    value={cardCount}
                    onChange={(e) => setCardCount(e.target.value)}
                    onBlur={handleCardCountBlur}
                    className={`${inputBaseClasses} border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
            {isProcessing ? (editMode ? 'Saving...' : 'Processing...') : (editMode ? 'Save Changes' : 'Generate Deck')}
          </button>
        </div>

        {/* Confirm clear overlay */}
        {isClearConfirmOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col items-center text-center gap-4">
                   <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                      <AlertTriangle size={32} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Clear all cards?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        This will delete all card content you&apos;ve entered. This action cannot be undone.
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
    </div>,
    document.body
  );
}