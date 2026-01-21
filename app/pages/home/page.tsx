"use client"
import { FaCircle, FaUserCircle} from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FiPlus } from 'react-icons/fi';
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2"; 
import { useState, useEffect, useRef} from "react";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import { 
  PanelLeftClose, PanelRightOpen, Menu,
  MoreHorizontal, Star, Pencil, Trash2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/app/context/AuthContext';
import Chat from "@/app/components/chat"
import RenameModal from "@/app/components/RenameModal";
import ChatsView from "@/app/components/ChatsView";
import SidebarTooltip from "@/app/components/SidebarTooltip";
import ResumeBuild from "@/app/components/ResumeBuild";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { MdOutlineQuiz } from "react-icons/md";
import { TbCards } from "react-icons/tb";
import QuizView from "@/app/components/QuizView";
import FlashcardsView from "@/app/components/FlashcardsView";

export interface RecentChat {
  chat_id: string;
  created_at: string;
  chat_title: string;
}

export default function Home() {
  const { chatMode, setChatMode } = useAuth();
  const router = useRouter();
  const authServices = new AuthServices();
  const publicServices = new PublicServices();

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarProfileOpen, setIsSidebarProfileOpen] = useState(false);
  const sidebarProfileMenuRef = useRef<HTMLDivElement>(null); // Ref for the menu

  // chat state
  const [currChatId, setCurrChatId] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentChat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [chatToRename, setChatToRename] = useState<RecentChat | null>(null);

  // Find the active chat object from the list
  const activeChat = recents.find(r => r.chat_id === currChatId);
  const currentChatTitle = activeChat?.chat_title || (chatMode === "new chat" ? "New Chat" : "Untitled");

  // Recovery: If we are in 'recents' mode but have no ID, go to new chat
  useEffect(() => {
    if (chatMode === 'recents' && !currChatId && recents.length > 0) {
        setCurrChatId(recents[0].chat_id);
    }
  }, [chatMode, recents]);

  // handle opening, closing, and submitting the modal
  const handleOpenRenameModal = (chat?: RecentChat) => {
    const targetChat = chat || activeChat;
    if (targetChat) {
      setChatToRename(targetChat); 
      setRenameInputValue(targetChat.chat_title || "Untitled");
      setIsRenameModalOpen(true);
    }
  };

  const handleNewChat = () => {
    setCurrChatId(null);
    setChatMode('new chat');
  };

  const handleSelectChat = (id: string) => {
    setCurrChatId(id);
    setChatMode('recents'); 
  };

  const handleRenameSubmit = async (newTitle: string) => {
    if (!chatToRename) return;
    try {
        // Fetch user session
        const session = await authServices.getSession();
        const { id } = session.user

        await publicServices.updateChatTitle(id, chatToRename.chat_id, newTitle);

        // update recents
        setRecents(prev => prev.map(chat => 
          chat.chat_id === chatToRename.chat_id ? {...chat, chat_title: newTitle} : chat
        ));
    }
    catch (error: any) {
      console.error(error);
    }
    setIsRenameModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await publicServices.deleteHistory(id);
      setRecents(prev => {
        const updated = prev.filter(chat => chat.chat_id !== id);
        // If we deleted the chat we were currently viewing
        if (id === currChatId) {
            if (updated.length > 0) {
                setCurrChatId(updated[0].chat_id);
            } else {
                handleNewChat();
            }
        }
        return updated;
      });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // UseEffect to close the sidebar profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarProfileMenuRef.current && !sidebarProfileMenuRef.current.contains(event.target as Node)) {
        setIsSidebarProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarProfileMenuRef]);

  // Fetch initial history
  useEffect(() => {
    const fetchRecents = async () => {
      try {
        const session = await authServices.getSession();
        const data = await publicServices.fetchHistory(session.user.id);
        setRecents(data);
      } catch (error) {
        console.error("Fetch history error:", error);
      }
    };
    fetchRecents();
  }, []);


  return (
    <>
    <main className="w-full flex flex-col h-dvh overflow-hidden">
    <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay (for mobile sidebar) */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
        )}
        {/* Sidebar */}
        <div className={`
          absolute inset-y-0 left-0 z-30 flex flex-col flex-shrink-0 
          bg-landingPageLight dark:bg-landingPage
          transition-[width] duration-300 ease-in-out md:static
          ${isSidebarExpanded ? 'w-64' : 'w-20'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full p-4 text-slate-800 dark:text-textDark">
            {/* Section 1: Header */}
            <div className={`flex-shrink-0 flex items-center mb-6 justify-between`}>
              <div className="flex items-center overflow-hidden">
                <button 
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-lg group text-slate-600 dark:text-textDark">
                  {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
                <button 
                  disabled={isProcessing}
                  className={`whitespace-nowrap font-bold text-xl transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0'} text-lg text-slate-800 dark:text-textDark`}
                  onClick={() => router.push("/")}>
                  Omni
                </button>
              </div>
            </div>

            {/* Section 2: New Chat / Chat */}
            <div className="flex-shrink-0 space-y-2">
              <SidebarTooltip text="New Chat" isSidebarExpanded={isSidebarExpanded}>
                <button 
                  disabled={isProcessing}
                  className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark hover:bg-violet-200 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
                  onClick={handleNewChat}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                      <FaCircle className="absolute transition-transform duration-300 ease-in-out group-hover:scale-110 [--plus-bg:#8b5cf6] dark:[--plus-bg:#6366F1]" color={"var(--plus-bg)"} size={24} />
                      <FiPlus className="absolute text-textDark transition-transform duration-300 ease-in-out group-hover:scale-125" size={24 * 0.6} strokeWidth={3} />
                    </div>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>New Chat</span>
                  </div>
                </button>
              </SidebarTooltip>
            
              <SidebarTooltip text="Chats" isSidebarExpanded={isSidebarExpanded}>
                <button 
                  disabled={isProcessing}
                  className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "chats" && 'bg-black/10 dark:bg-white/10'} hover:bg-black/5 dark:hover:bg-white/10 justify-start`}
                  onClick={() => setChatMode("chats")}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-[24px] h-[24px]">
                      <HiOutlineChatBubbleOvalLeft size={18} className="absolute top-0 left-0 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5" strokeWidth={2} />
                      <HiOutlineChatBubbleOvalLeft size={18} className="absolute bottom-0 right-0 scale-x-[-1] transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />
                    </div>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Chats</span>
                  </div>
                </button>
              </SidebarTooltip>
            </div>

            {/* Section 3: Resume Builder */}
            <SidebarTooltip text="Resume" isSidebarExpanded={isSidebarExpanded}>
              <button 
                disabled={isProcessing}
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "resume" && 'bg-black/10 dark:bg-white/10'} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
                onClick={() => setChatMode("resume")}>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                    <IoDocumentTextOutline size={22} className="transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  </div>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Resume</span>
                </div>
              </button>
            </SidebarTooltip>

            {/* Section 4 Multiple Choice Quiz */}
            <SidebarTooltip text="Quiz" isSidebarExpanded={isSidebarExpanded}>
              <button
                disabled={isProcessing}
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "quiz" && 'bg-black/10 dark:bg-white/10'} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
                onClick={() => setChatMode("quiz")}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                      <MdOutlineQuiz 
                        size={22} 
                        className="transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-rotate-12" 
                      />
                    </div>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                      Quiz
                    </span>
                  </div>
              </button>
            </SidebarTooltip>

            {/* Section 5: Flashcards */}
            <SidebarTooltip text="Flashcards" isSidebarExpanded={isSidebarExpanded}>
              <button 
                disabled={isProcessing}
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-textDark ${chatMode === "flashcards" && 'bg-black/10 dark:bg-white/10'} hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 justify-start`}
                onClick={() => setChatMode("flashcards")}>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                    <TbCards 
                      size={24} 
                      className="transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:rotate-6" 
                    />
                  </div>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    Flashcards
                  </span>
                </div>
              </button>
            </SidebarTooltip>
            
            {/* Section 6: Recents */}
            <div className={`pt-6 flex flex-col flex-grow min-h-0`}>
              <h3 className={`flex-shrink-0 px-3 text-sm font-medium text-slate-500 dark:text-gray-400 transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>Recents</h3>
              <div className={`mt-2 flex-grow space-y-2 overflow-y-auto scrollbar-custom transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {recents.map((chat, index) => {
                  return (
                    <div key={chat.chat_id} className="relative group">
                      <div className={`flex items-center w-full rounded-lg transition-colors duration-200 ${currChatId === chat.chat_id && chatMode === 'recents' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                        <button onClick={() => handleSelectChat(chat.chat_id)} disabled={isProcessing} className="flex-grow text-left p-3 text-sm truncate disabled:opacity-50 text-slate-700 dark:text-textDark">
                          {chat.chat_title || 'Untitled'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat.chat_id ? null : chat.chat_id); }} disabled={isProcessing} className="flex-shrink-0 p-2 mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-50 text-slate-600 dark:text-textDark" aria-label="Chat options">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      {openMenuId === chat.chat_id && (
                        <div className="absolute top-0 right-8 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-50 py-1 animate-fade-in-up-sm">
                          <button onClick={() => setOpenMenuId(null)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-slate-700 dark:text-textDark hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><Star size={14} className="text-yellow-400" /><span>Starred</span></button>
                          <button onClick={() => { handleOpenRenameModal(chat); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-slate-700 dark:text-textDark hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /><span>Rename</span></button>
                          <button onClick={() => { handleDelete(chat.chat_id); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"><Trash2 size={14} /><span>Delete</span></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {openMenuId && (<div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>)}
            </div>

            {/* Section 7: Profile Menu */}
            <div className='mt-auto flex-shrink-0 pt-4 border-t border-black/10 dark:border-white/10'>
              <div ref={sidebarProfileMenuRef} className="relative">
                <button onClick={() => setIsSidebarProfileOpen(!isSidebarProfileOpen)} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${isSidebarProfileOpen && 'bg-black/10 dark:bg-white/10'}`}>
                  <FaUserCircle size={30} className="flex-shrink-0 text-slate-600 dark:text-gray-300" />
                  <span className={`whitespace-nowrap font-semibold text-sm overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Profile</span>
                </button>
                <div className={`absolute bottom-full left-0 z-50 mb-2 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 flex flex-col gap-1 transition-all duration-300 ease-out origin-bottom ${isSidebarProfileOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className=""><ThemeToggle /></div>
                  <hr className="border-slate-200 dark:border-slate-700 my-1" />
                  <button onClick={async () => { 
                    const auth = new AuthServices();
                    await auth.logout();
                    router.push('/');}} 
                    className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    disabled={isProcessing}>
                    <FontAwesomeIcon icon={faArrowRightFromBracket} /><span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Divider */}
      <div className="w-px flex-shrink-0 bg-slate-300 dark:bg-slate-600 hidden md:block" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-chatDark transition-transform duration-300 ease-in-out z-10">
        <header className={`flex-shrink-0 flex items-center p-4 relative z-30 ${chatMode !== 'recents' ? 'md:hidden' : ''}`}>
          {/* Hamburger Menu */}
          <div className="md:hidden mr-2 sm:mr-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-textDark hover:dark:bg-gray-50/5"
            >
              <Menu size={24} />
            </button>
          </div>
          
          {/* Dynamic Content Area */}
          {chatMode === 'recents' && (
            <div className="flex-1 flex items-center animate-fade-in-sm min-w-0 max-w-[33.33%]">
              <button 
                disabled={isProcessing}
                onClick={() => handleOpenRenameModal()}
                className="flex items-center gap-2 text-lg w-full font-semibold text-gray-800 dark:text-textDark truncate group disabled:cursor-not-allowed"
              >
                <span className="truncate min-w-0">{currentChatTitle}</span>
                <Pencil 
                  size={16} 
                  className="text-gray-400 opacity-100 transition-opacity flex-shrink-0" 
                />
              </button>
          </div>
          )}
        </header>

        {chatMode === "chats" ? 
          <ChatsView
            recents={recents}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            isProcessing={isProcessing}
            onDeleteChat={handleDelete}
          /> 
          :
          chatMode === "resume" ? 
            <ResumeBuild 
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            /> 
          :
          chatMode === "quiz" ? 
          <QuizView isProcessing={isProcessing} setIsProcessing={setIsProcessing} /> 
          :
          chatMode === "flashcards" ?
          <FlashcardsView isProcessing={isProcessing} 
            setIsProcessing={setIsProcessing}/> :
          <Chat 
            setRecents={setRecents} 
            currChatId={currChatId} // Pass string ID
            setCurrChatId={setCurrChatId} // Pass setter to Chat.tsx
            isProcessing={isProcessing} 
            setIsProcessing={setIsProcessing}
          />
        }
      </div>
      {openMenuId && (
            <div 
              className="absolute inset-0 z-20 md:left-64"
              onClick={() => setOpenMenuId(null)}
            ></div>
      )}
  </div>
  {/* RENDER THE MODAL conditionally at the end of the main tag */}
  <RenameModal
    isOpen={isRenameModalOpen}
    onClose={() => setIsRenameModalOpen(false)}
    onSubmit={handleRenameSubmit}
    currentTitle={renameInputValue}
    setInputValue={setRenameInputValue}
  />
</main>
  </>
  );

  
}
