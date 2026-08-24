"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Folder, Files, X, MoreVertical, Search, Clock, Star, Trash2, Pencil, Check, AlertTriangle, Calendar,
  Filter, ArrowUpAZ, ArrowDownAZ, ChevronDown, LayoutList, ChevronLeft
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { AuthServices } from '@/lib/authServices';
import { PublicServices } from '@/lib/publicServices';
import { timeAgo } from '@/lib/utils';
import FlashcardGenerationModal from './FlashcardGenerationModal';
import DeckView from './DeckView';

// --- TYPES ---
type Flashcard = {
    id: number;
    parent_id: number;
    prompt: string;
    answer: string;
}

interface FlashcardItem {
  id?: number;
  lastStudied?: string;
  created_at?: string;
  last_updated?: string; 
  parent_id?: number | null;
  mode?: string | null;
  description?: string;
  flashcards?: Flashcard[];
  depth: number;
  title: string;
  count: number; 
  isStarred: boolean;
  type: 'folder' | 'deck';
}

type FlashcardsViewProps = {
    isProcessing: boolean,
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

type FlashcardEditorState = {
  data?: FlashcardItem;
  isOpen: boolean;
  mode: 'create' | 'edit';
}


type FilterType = 'all' | 'folder' | 'deck';
type SortOption = 'last_updated' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function FlashcardsView({ isProcessing, setIsProcessing }: FlashcardsViewProps) {
  const [items, setItems] = useState<FlashcardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const authServices = new AuthServices();
  const publicServices = new PublicServices();
  const [userId, setUserId] = useState<string | null>(null);
  const maxDepth = 4;
  
  // --- UI STATES ---
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FlashcardItem | null>(null);
  const [itemToRename, setItemToRename] = useState<FlashcardItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [flashcardEditor, setFlashcardEditorState] = useState<FlashcardEditorState>({
    isOpen: false,
    mode: 'create'
  });
  const [activeDeck, setActiveDeck] = useState<{ title: string, cards: Flashcard[]} | null>(null);

  // --- FILTER & SORT STATES ---
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('last_updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Dropdown visibility states
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Refs for click outside
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Flashcard Logic
  const openCreateModal = () => {
    setFlashcardEditorState({ isOpen: true, mode: 'create'});
  }

  const closeEditorModal = () => {
    setFlashcardEditorState({ isOpen: false, mode: 'create'});
  }

  const openEditorModal = async (deck: any) => {
    setActiveMenuId(null); 
    setIsProcessing(true);
    try {
        // Fetch full questions details before opening modal
        const flashcards = await publicServices.getFlashcards(deck.id);
        
        setFlashcardEditorState({ 
            isOpen: true, 
            mode: 'edit', 
            data: { ...deck, flashcards } 
        });
    } catch (e) {
        console.error(e);
        alert("Could not load deck for editing.");
    } finally {
        setIsProcessing(false);
    }
  }

  const handleDeckClick = async (deck: FlashcardItem) => {
    setIsProcessing(true);
    try {
        const cardsData = await publicServices.getFlashcards(deck.id);
        
        // Map DB response to Flashcard type expected by DeckView
        const mappedCards: Flashcard[] = cardsData.map((c: any) => ({
            id: c.id,
            prompt: c.prompt,
            answer: c.answer,
            parent_id: c.parent_id
        }));

        setActiveDeck({
            title: deck.title,
            cards: mappedCards
        });
    } catch (e) {
        console.error("Failed to open deck", e);
        // Optional: Add error toast here
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeckCreated = (deck: FlashcardItem) => {
    // Append new deck to current items
    setItems(prev => [...prev, deck])
  }

  const handleDeckUpdated = (deck: FlashcardItem) => {
    // Update flashcards table
    setItems((prevItems) => 
      prevItems.map((item) => (item.id === deck.id ? deck : item))
    );
  }

  // Folder Logic
  const [newFolderName, setNewFolderName] = useState('');
  const [path, setPath] = useState<FlashcardItem[]>([]);
  const currFolder = path[path.length - 1] || null;
  const parentFolder = path.length > 1 ? path[path.length - 2] : null;
  const backTargetName = parentFolder ? parentFolder.title : "Documents";
  const isAtMaxDepth = currFolder && currFolder.depth >= maxDepth;

  // --- FILTER & SORT LOGIC ---
  const processedItems = useMemo(() => {
    return items
    .filter(item => {
        // 1. Search Filter
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        // 2. Type Filter
        const matchesType = filterType === 'all' ? true : item.type === filterType;
        // Folder navigation logic
        const matchFolder = item.parent_id === (currFolder ? currFolder.id : null);
        return matchesSearch && matchesType && matchFolder;
    })
    .sort((a, b) => {
        // 3. Sorting
        const dateA = new Date(a[sortOption] || 0).getTime();
        const dateB = new Date(b[sortOption] || 0).getTime();
        
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [items, searchTerm, filterType, sortOption, sortOrder])

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fetchItems = async (id: string, folderId: number | null = null) => {
    // setLoading(true); // Add a loading state if you haven't already
    try {
      const data = await publicServices.getFlashcardFolder(id, folderId);
      setItems(data as FlashcardItem[]);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      // setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await authServices.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          // Load root items (folderId is null)
          fetchItems(session.user.id, null);
        }
      } catch (error) {
        console.error("Error fetching session", error);
      }
    }
    fetchSession();
  }, []);

  // Click Outside Logic (Combined)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Card Menu
      if (activeMenuId) {
        const menuElement = document.getElementById(`menu-container-${activeMenuId}`);
        if (menuElement && !menuElement.contains(target)) setActiveMenuId(null);
      }
      
      // Filter Dropdown
      if (isFilterMenuOpen && filterRef.current && !filterRef.current.contains(target)) {
          setIsFilterMenuOpen(false);
      }

      // Sort Dropdown
      if (isSortMenuOpen && sortRef.current && !sortRef.current.contains(target)) {
          setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId, isFilterMenuOpen, isSortMenuOpen]);

  // --- ACTIONS ---
  // Delete Logic
  const openDeleteModal = (item: FlashcardItem) => {
    setItemToDelete(item);
    setActiveMenuId(null);
  };

  const closeDeleteModal = () => setItemToDelete(null);

  const confirmDelete = async () => {
    if (!itemToDelete || !userId) return;
    try {
        setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
        await publicServices.deleteFlashcardItem(userId, itemToDelete.id, itemToDelete.type);
    } catch(error) { console.log(error); } 
    finally { closeDeleteModal(); }
  };

  // Rename Logic
  const openRenameModal = (item: FlashcardItem) => {
    setItemToRename(item);
    setRenameValue(item.title); // Pre-fill with current title
    setActiveMenuId(null); // Close dropdown
  };

  const closeRenameModal = () => {
    setItemToRename(null);
    setRenameValue('');
  };

  const handleRename = async () => {
    if (!itemToRename || !userId || !renameValue.trim()) return;
    
    try {
        const updates = { 
            title: renameValue, 
            itemType: itemToRename.type // Crucial for backend to know which table to update
        };

        // API Call
        await publicServices.updateFlashcardItems(userId, itemToRename.id, updates);

        // Local Update
        setItems(prev => prev.map(item => 
            item.id === itemToRename.id ? { ...item, title: renameValue, last_updated: new Date().toISOString() } : item
        ));
    } catch (error) {
        console.log("Error renaming:", error);
    } finally {
        closeRenameModal();
    }
  };

  const toggleStar = async (currItem: FlashcardItem, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
        const updates = { isStarred: !currItem.isStarred, itemType: currItem.type }
        await publicServices.updateFlashcardItems(userId, currItem.id, updates);
        setItems(prev => prev.map(item => 
            item.id === currItem.id ? { ...item, isStarred: !item.isStarred }: item
        ));
    } catch (error) { console.log(error); }
  };

  const handleCreateFolder = async () => {
      if (!newFolderName.trim() || (currFolder && currFolder.depth === maxDepth)) return;
      const parent_id = currFolder ? currFolder.id : null;
      const newFolder: FlashcardItem = {
          type: 'folder', title: newFolderName, count: 0, depth: currFolder ? currFolder.depth + 1 : 0, isStarred: false, parent_id: parent_id
      };
      try {
        const data = await publicServices.createFolder(userId, newFolder, parent_id);
        const folderData = {
            id: data.id,
            type: "folder",
            title: data.title,
            count: data.count,
            depth: data.depth,
            isStarred: data.starred,
            created_at: data.created_at,
            parent_id: data.parent_id,
            userId: data.user_id,
            last_updated: data.last_updated,
        }

        setItems([folderData as FlashcardItem, ...items]);
      } catch (error) { console.log(error); }
      setNewFolderName('');
      setIsFolderModalOpen(false);
  };

  // Navigation Handlers
  const handleFolderClick = (folder: FlashcardItem) => {
    setPath(prev => [...prev, folder]);
    fetchItems(userId!, folder.id); // API call to get children of this folder
    setSearchTerm('');
  };

  const handleGoBack = () => {
    const newPath = [...path];
    newPath.pop(); // Remove current folder
    setPath(newPath);

    const prevFolder = newPath[newPath.length - 1] || null;
    fetchItems(userId!, prevFolder ? prevFolder.id! : null);
  }

  // CONDITIONAL RENDER: Show DeckView if active
  if (activeDeck) {
      return (
          <DeckView 
              deckTitle={activeDeck.title}
              cards={activeDeck.cards}
              onExit={() => setActiveDeck(null)}
          />
      );
  }

  return (
    <div className="relative flex flex-col h-full w-full text-slate-800 dark:text-gray-200 overflow-y-auto custom-scrollbar animate-fade-in-sm">
      
      {isNewMenuOpen && (
          <div className="fixed inset-0 z-30 cursor-default" onClick={() => setIsNewMenuOpen(false)}></div>
      )}

      <div className="w-full max-w-7xl mx-auto py-4 px-6 md:p-10 space-y-6">

        {/* --- NAVIGATION BREADCRUMB --- */}
        <div className="h-6 flex items-center">
            {currFolder ? (
                <button 
                    onClick={handleGoBack}
                    className="group flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:opacity-70 transition-all"
                >
                    <ChevronLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to {backTargetName}</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <LayoutList size={12} /> Documents
                </div>
            )}
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{currFolder ? currFolder.title : "Your Library"}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{currFolder ? `Managing content inside ${currFolder.title}` : "Manage your decks and folders."}</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent dark:focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- TOOLBAR (Filter & Sort) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
            
            {/* Left: Type Filter */}
            <div className="relative" ref={filterRef}>
                <button 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                >
                    <Filter size={16} />
                    <span>
                        {filterType === 'all' && 'All Items'}
                        {filterType === 'folder' && 'Folders Only'}
                        {filterType === 'deck' && 'Flashcards Only'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        <button onClick={() => { setFilterType('all'); setIsFilterMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === 'all' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                            <LayoutList size={14} /> All Items
                        </button>
                        <button onClick={() => { setFilterType('folder'); setIsFilterMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === 'folder' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                            <Folder size={14} /> Folders Only
                        </button>
                        <button onClick={() => { setFilterType('deck'); setIsFilterMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${filterType === 'deck' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                            <Files size={14} /> Flashcards Only
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Sort Options */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:block">Sort By</span>
                
                {/* Sort Field Dropdown */}
                <div className="relative" ref={sortRef}>
                    <button 
                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                    >
                        {sortOption === 'last_updated' ? <Clock size={16} /> : <Calendar size={16} />}
                        <span>{sortOption === 'last_updated' ? 'Last Updated' : 'Created Date'}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSortMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                             <button onClick={() => { setSortOption('last_updated'); setIsSortMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${sortOption === 'last_updated' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                                <Clock size={14} /> Last Updated
                            </button>
                            <button onClick={() => { setSortOption('created_at'); setIsSortMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-left ${sortOption === 'created_at' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                                <Calendar size={14} /> Created Date
                            </button>
                        </div>
                    )}
                </div>

                {/* Sort Order Toggle */}
                <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
                    title={sortOrder === 'asc' ? "Ascending (Oldest First)" : "Descending (Newest First)"}
                >
                    {sortOrder === 'asc' ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
                </button>
            </div>
        </div>


        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
            
            {/* Create New Card */}
            <div className={`relative group h-52 rounded-2xl transition-all duration-200 ${
                isNewMenuOpen 
                    ? 'bg-white dark:bg-slate-800 shadow-xl border-2 border-violet-500 dark:border-violet-500 z-40' 
                    : 'border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 z-0'
            }`}>
                {!isNewMenuOpen ? (
                    <button 
                        onClick={() => setIsNewMenuOpen(true)}
                        className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-violet-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-violet-100 dark:group-hover:bg-slate-700 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-semibold">Create New</span>
                    </button>
                ) : (
                    <div className="w-full h-full flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Create</span>
                            <button onClick={() => setIsNewMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 h-full justify-center">
                            <button 
                            onClick={() => {
                                openCreateModal();
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all text-left group/item"
                            >
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover/item:text-violet-600"><Files size={18} /></div>
                                <span className="font-semibold text-sm">Flashcard Deck</span>
                            </button>
                            <button 
                                onClick={() => { 
                                  if (!isAtMaxDepth) {
                                    setIsNewMenuOpen(false);
                                    setIsFolderModalOpen(true); 
                                  }
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item w-full ${
                                isAtMaxDepth 
                                ? 'bg-slate-100 dark:bg-slate-800/50 opacity-60 cursor-not-allowed' 
                                : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                                }`}
                            >
                              <div className={`p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm ${!isAtMaxDepth && 'group-hover/item:text-blue-600'}`}>
                                  <Folder size={18} />
                              </div>
                              <div className="flex flex-col">
                                  <span className="font-semibold text-sm">Folder</span>
                                  {isAtMaxDepth && (
                                      <span className="text-[10px] text-red-700 dark:text-red-500 flex items-center gap-1 font-bold">
                                          <AlertTriangle size={10} /> Max Depth Reached
                                      </span>
                                  )}
                              </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Render processed items instead of raw filtered items */}
            {processedItems.map((item) => {
                const isMenuOpen = activeMenuId === item.id;
                const hoverClass = isMenuOpen || isNewMenuOpen ? '' : 'hover:-translate-y-1 hover:drop-shadow-lg';
                const zIndexClass = isMenuOpen ? 'z-40' : 'z-0';

                const StarButton = () => (
                    <button 
                        onClick={(e) => toggleStar(item, e)}
                        className="absolute top-24 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-20 group/star"
                        title={item.isStarred ? "Unstar" : "Star"}
                    >
                        <Star 
                            size={20} 
                            strokeWidth={2.5}
                            className={`transition-all duration-300 ${
                                item.isStarred 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-slate-400 dark:text-slate-500 group-hover/star:text-yellow-400'
                            }`}
                        />
                    </button>
                );

                const MoreMenu = () => (
                    <div className="relative" id={`menu-container-${item.id}`}>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveMenuId(isMenuOpen ? null : item.id!); 
                            }}
                            className={`relative group/more p-1.5 rounded-lg transition-colors ${
                                isMenuOpen 
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                            }`}
                        >
                            <MoreVertical size={18} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                {/* CONDITIONAL ACTION: Edit (Deck) vs Rename (Folder) */}
                                {item.type === 'folder' ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openRenameModal(item); }} 
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                                    >
                                        <Pencil size={12} /> Rename
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openEditorModal(item); }} 
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(item); }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                );

                return item.type === 'folder' ? (
                    <div key={item.id} 
                    onClick={() => handleFolderClick(item)}
                    className={`group relative h-52 cursor-pointer transition-transform duration-300 ${hoverClass} ${zIndexClass}`}>
                         <div className="absolute top-0 left-0 w-28 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-t-xl border-t border-l border-r border-blue-200 dark:border-blue-700/50"></div>
                         <div className="absolute top-4 inset-x-0 bottom-0 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-700/50 rounded-b-xl rounded-tr-xl p-5 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Folder size={20} /></div>
                                <MoreMenu />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{item.count} items</p>
                            </div>
                            <div className="pt-3 mt-auto border-t border-blue-100 dark:border-slate-700/50 text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5"><Calendar size={12} /> Created {timeAgo(item.created_at ?? "")}</div>
                                <div className="flex items-center gap-1.5"><Clock size={12} /> Updated {timeAgo(item.last_updated ?? "")}</div>
                            </div>
                            <StarButton />
                         </div>
                    </div>
                ) : (
                    <div key={item.id} onClick={() => handleDeckClick(item)} className={`group relative h-52 cursor-pointer transition-transform duration-300 ${hoverClass} ${zIndexClass}`}>
                        <div className="absolute top-2 left-2 right-0 bottom-0 bg-slate-200 dark:bg-slate-700 rounded-2xl border border-slate-300 dark:border-slate-600 z-0"></div>
                        <div className="absolute top-0 left-0 right-2 bottom-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-sm z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg"><Files size={20} /></div>
                                <MoreMenu />
                            </div>
                            <div className='space-y-1'>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{item.count} Cards</span>
                                </div>
                            </div>
                            <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5"><Calendar size={12} /> Created {timeAgo(item.created_at ?? "")}</div>
                                <div className="flex items-center gap-1.5"><Clock size={12} /> Updated {timeAgo(item.last_updated ?? "")}</div>
                            </div>
                            <StarButton />
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* Folder Modal */}
      {mounted && isFolderModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="relative w-full max-w-sm flex flex-col items-start animate-in zoom-in-95 duration-200">
                <div className="h-10 w-32 bg-white dark:bg-slate-800 rounded-t-xl relative z-10 translate-y-[1px]"></div>
                <div className="w-full bg-white dark:bg-slate-800 rounded-b-2xl rounded-tr-2xl border-4 border-white dark:border-slate-800 p-6 shadow-2xl relative z-20">
                    <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Folder size={24} /></div>
                             <div><h3 className="text-lg font-bold text-slate-800 dark:text-white">New Folder</h3>
                             <p className="text-xs text-slate-500 dark:text-slate-400">Organize your decks</p>
                             </div>
                         </div>
                         <button onClick={() => { setNewFolderName(''); setIsFolderModalOpen(false) }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Name</label>
                            <input autoFocus type="text" placeholder="Enter folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-400" />
                        </div>
                        <div className="flex gap-3 pt-2">
                             <button onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                             <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"><Check size={18} /> Create</button>
                        </div>
                    </div>
                </div>
             </div>
        </div>, document.body
      )}

       {/* Rename Modal */}
      {mounted && itemToRename && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="relative w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200">
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
                    
                    <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                                 <Pencil size={24} />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Rename {itemToRename.type === 'folder' ? 'Folder' : 'Deck'}</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">Update title</p>
                             </div>
                         </div>
                         <button onClick={closeRenameModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Title</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 focus:outline-none transition-colors placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                             <button onClick={closeRenameModal} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                             <button onClick={handleRename} disabled={!renameValue.trim() || renameValue === itemToRename.title} className="flex-1 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2">Save</button>
                        </div>
                    </div>
                </div>
             </div>
        </div>, document.body
      )}

      {/* Delete Modal*/}
      {mounted && itemToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 scale-100 transform transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400"><AlertTriangle size={24} /></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete {itemToDelete.type === 'folder' ? 'Folder' : 'Deck'}?</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{itemToDelete.title}&quot;</span>? {itemToDelete.type === 'folder' && " This will delete all items inside it."} <br/>This action cannot be undone.</p>
              </div>
              <button onClick={closeDeleteModal} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>, document.body
      )}
    {flashcardEditor.isOpen && (
        <FlashcardGenerationModal
        onClose={closeEditorModal}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        onDeckCreated={handleDeckCreated}
        onDeckUpdated={handleDeckUpdated}
        userId={userId}
        currFolderId={currFolder ? currFolder.id! : null}
        initialData={flashcardEditor.data}
        editMode={flashcardEditor.mode === "edit"}
     />
    )}
    </div>
  );
}