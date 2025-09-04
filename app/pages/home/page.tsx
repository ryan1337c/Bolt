"use client"
import { FaRobot, FaCircle} from "react-icons/fa";
import { FiPlus } from 'react-icons/fi';
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2"; 
import { useState, useEffect} from "react";
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

export interface ChatMessage {
  role: string;
  content: string;
  imageUrl: string;
  clickedInHistory: boolean; 
  loading: boolean;
  isNew: boolean;
}

export type ChatSession = ChatMessage[];

export interface RecentChat {
  history: ChatSession;
  chat_id: string;
  created_at: string;
  chat_title: string;
}


export default function Home() {
  const { chatMode, setChatMode } = useAuth();

  // side bar stuff
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currChat, setCurrChat] = useState(0);
  const [recents, setRecents] = useState<RecentChat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [chatToRename, setChatToRename] = useState<RecentChat | null>(null);

  // Title
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');
  
  // auth
  const authServices = new AuthServices();
  const publicServices = new PublicServices();
  

  let currentChatTitle = "New Chat"; // Default for 'new chat' mode
  if (chatMode === 'recents' && recents[currChat]) {
    const currentChat = recents[currChat];
    
    // Use the custom title if it exists, otherwise fall back to the first message's content.
    console.log("current title", currentChat.chat_title );
    currentChatTitle = currentChat.chat_title || 
                      currentChat.history.find(msg => msg.role === 'user')?.content || 
                      'Chat History'; // Fallback for empty chats
  }



  // handle opening, closing, and submitting the modal
  const handleOpenRenameModal = (chatIndex: number = currChat) => {
    const chat = recents[chatIndex];
    if (chat) {
      // Remember the entire chat object we intend to rename.
      setChatToRename(chat); 
      
      // Set the input value for the modal.
      const title = chat.chat_title || 
                    chat.history.find(msg => msg.role === 'user')?.content || 
                    'Chat History';
      setRenameInputValue(title);
      setIsRenameModalOpen(true);
    }
  };

  const handleNewChat = () => {
    setChatMode('new chat');
  };

  const handleSelectChat = (index: number) => {
    setCurrChat(index);
    setChatMode('recents'); 
  };

  const handleCloseRenameModal = () => {
    setIsRenameModalOpen(false);
    setChatToRename(null); 
  };

  const handleRenameSubmit = async (newTitle: string) => {
    if (!chatToRename) return;

    try {
        // Fetch user session
        const session = await authServices.getSession();
        const {email} = session.user

        await publicServices.updateChatTitle(email, chatToRename.chat_id, newTitle);

        console.log("Title has been succesfully changed to: ", newTitle);

        // update recents
        setRecents(prev => {
          return prev.map(chat => {
            // If this is the chat we just updated, return the new version
            if (chat.chat_id === chatToRename.chat_id) {
              return {...chat, chat_title: newTitle}
            }
            return chat
          })
        })

    }
    catch (error: any) {
      const message = error.message || 'An unexpected error occurred';
      console.error(message);
    }
    handleCloseRenameModal();
  };

  const handleDelete = async(chatIndex: number) => {
    const chatToDelete = recents[chatIndex];
    try{
      // Fetch user session
      const session = await authServices.getSession();
      const {email} = session.user
      await publicServices.deleteHistory(email, chatToDelete.history, chatToDelete.chat_id);

      console.log("Successfully deleted chat!");

      // Update recents
      setRecents(prev => prev.filter(chat => chat.chat_id !== chatToDelete.chat_id));
    }
    catch(error: any) {
      const message = error.message || 'An unexpected error occurred';
      console.error(message);
    }
  }

  useEffect(() => {
    // Fetch recent chats
    const fetchRecents = async() => {
      try{
        // Fetch user session
        const session = await authServices.getSession();

        const {id} = session.user

        // Fetch user chat history
        const recents = await publicServices.fetchHistory(id);

        setRecents(recents)
      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }
    fetchRecents();
  }, [])

  return (
    <>
    <main className="w-full flex flex-col h-dvh overflow-hidden">
    {/* <Header /> */}
    <div className="flex flex-1 overflow-hidden relative">
        {/* --- Overlay (for mobile sidebar) --- */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
        )}
        {/* Sidebar */}
        <div className={`
          absolute inset-y-0 left-0 z-30 flex flex-col flex-shrink-0 bg-landingPage
          transition-[width] duration-300 ease-in-out md:static
          ${isSidebarExpanded ? 'w-64' : 'w-20'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full p-4 text-white overflow-hidden">
            {/* Section 1: Header with smooth text animation */}
            <div className={`flex-shrink-0 flex items-center mb-6 justify-between`}>
              <div className="flex items-center overflow-hidden">
                <button 
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-lg group">
                  {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
                <button 
                  disabled={isProcessing}
                  className={`whitespace-nowrap font-bold text-xl transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0'} text-lg`}
                  onClick={() => {
                    router.push("/")
                  }}>
                  Bolt
                </button>

              </div>
            </div>

            {/* Section 2: Actions with smooth text animation */}
            <div className="flex-shrink-0 space-y-2">
              <SidebarTooltip text="New Chat" isSidebarExpanded={isSidebarExpanded}>
                <button 
                  disabled={isProcessing}
                  className={`w-full group flex p-3 rounded-lg text-sm font-medium text-white ${chatMode === "new chat" && 'bg-white/10'} hover:bg-white/10 transition-colors duration-300 justify-start`}
                  onClick={() => {
                    setChatMode("new chat");
                    setCurrChat(0);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                      <FaCircle className="absolute transition-transform duration-300 ease-in-out group-hover:scale-110" color="#a78bfa" size={24} />
                      <FiPlus className="absolute text-white transition-transform duration-300 ease-in-out group-hover:scale-125" size={24 * 0.6} strokeWidth={3} />
                    </div>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                      New Chat
                    </span>
                  </div>
                </button>
              </SidebarTooltip>

              {/* Chats Button */}
              <SidebarTooltip text="Chats" isSidebarExpanded={isSidebarExpanded}>
                <button 
                  disabled={isProcessing}
                  className={`w-full group flex p-3 rounded-lg text-sm font-medium text-white ${chatMode === "chats" && 'bg-white/10'} hover:bg-white/10 justify-start`}
                  onClick={() => setChatMode("chats")}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-[24px] h-[24px]">
                      <HiOutlineChatBubbleOvalLeft size={18} className="absolute top-0 left-0 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5" strokeWidth={2} />
                      <HiOutlineChatBubbleOvalLeft size={18} className="absolute bottom-0 right-0 scale-x-[-1] transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" strokeWidth={2} />
                    </div>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                      Chats
                    </span>
                  </div>
                </button>
              </SidebarTooltip>
            </div>
            
            {/* Section 3 Chats */}
              <div className={`pt-6 flex flex-col flex-grow min-h-0`}>
                <h3 className={`
                  flex-shrink-0 px-3 text-sm font-medium text-gray-400
                  transition-opacity duration-300
                  ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}
                `}>Recents</h3>
                <div className={`
                  mt-2 flex-grow space-y-2 overflow-y-auto scrollbar-custom
                  transition-opacity duration-300
                  ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}
                `}>
                  {recents.map((chat, index) => {
                    const firstUserMessage = chat.history.find(msg => msg.role === 'user');
                    const chatTitle = chat.chat_title || firstUserMessage?.content || 'New Chat';

                    return (
                      <div key={chat.chat_id} className="relative group">
                        <div className={`
                          flex items-center w-full rounded-lg transition-colors duration-200
                          ${currChat === index && chatMode === 'recents' ? 'bg-white/10' : 'hover:bg-white/10'}
                          `}>
                          {/* Button for selecting the chat (takes up most of the space) */}
                          <button
                            disabled={isProcessing} 
                            onClick={() => {
                              setCurrChat(index);
                              setChatMode("recents");
                            }}
                            className="flex-grow text-left p-3 text-sm truncate disabled:opacity-50"
                          >
                            {chatTitle}
                          </button>

                          {/* Button for the three-dots menu icon */}
                          <button
                            disabled={isProcessing}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents the chat from being selected
                              setOpenMenuId(openMenuId === chat.chat_id ? null : chat.chat_id);
                            }}
                            className="flex-shrink-0 p-2 mr-1 rounded-full hover:bg-white/20 disabled:opacity-50"
                            aria-label="Chat options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>

                        {/* The Dropdown Menu (Conditionally Rendered) */}
                        {openMenuId === chat.chat_id && (
                          <div className="absolute top-0 right-8 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 animate-fade-in-up-sm">
                            {/* Starred */}
                            <button
                              onClick={() => setOpenMenuId(null)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors"
                            >
                              <Star size={14} className="text-yellow-400" />
                              <span>Starred</span>
                            </button>
                            {/* Rename */}
                            <button
                              onClick={() => {
                                handleOpenRenameModal(index); 
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors"
                            >
                              <Pencil size={14} />
                              <span>Rename</span>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => {
                                handleDelete(index)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Overlay to close menu when clicking outside (place this after the map) */}
                {openMenuId && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setOpenMenuId(null)}
                  ></div>
                  )}
              </div>
            {/* Section 4 */}
            <div className='flex-shrink-0 flex justify-center overflow-hidden'>
              {/* This invisible div will grow and shrink to push the button */}
              <div 
                className={`
                  transition-all duration-300 ease-in-out
                  ${isSidebarExpanded ? 'w-full' : 'w-0'} 
                `}
              />
              <SidebarTooltip text="Sign Out" isSidebarExpanded={isSidebarExpanded}>
                <button 
                  disabled={isProcessing}
                  className={`p-2 flex ${isSidebarExpanded ? 'w-full gap-2' : 'w-min mx-auto'} transition-all duration-300 ease-in-out 
                    items-center justify-center shine-button hover:bg-hoverLandingPage rounded-lg`} onClick={async () => {
                  const auth = new AuthServices();
                  await auth.logout();
                  // redirect back to landing page 
                  router.push('/');
                }}>
                  <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Sign Out</span>
                </button>
              </SidebarTooltip>
            </div>
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white transition-transform duration-300 ease-in-out">
        <header className={`flex-shrink-0 flex items-center p-4`}>
          {/* Hamburger Menu */}
          <div className="md:hidden mr-2 sm:mr-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>
          
          {/* Dynamic Content Area */}
          {chatMode === 'recents' && (
            <div className="flex-1 flex items-center">
              <button 
                disabled={isProcessing}
                onClick={() => handleOpenRenameModal()}
                className="flex items-center gap-2 text-lg font-semibold text-gray-800 truncate group disabled:cursor-not-allowed"
              >
                <span className="truncate">{currentChatTitle}</span>
                <Pencil 
                  size={16} 
                  className="text-gray-400 opacity-100 transition-opacity" 
                />
              </button>
          </div>
          )}
        </header>

        {chatMode === "chats" ? (
          <ChatsView
            recents={recents}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            isProcessing={isProcessing}
            onDeleteChat={handleDelete}
          />
          ) : (
          <Chat 
            chat={chatMode === "recents" && recents[currChat] ? recents[currChat].history : []} 
            setRecents={setRecents} 
            currChatId={chatMode === "recents" && recents[currChat] ? recents[currChat].chat_id : ""}
            isProcessing={isProcessing} 
            setIsProcessing={setIsProcessing}
          />
        )}
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
    onClose={handleCloseRenameModal}
    onSubmit={handleRenameSubmit}
    currentTitle={renameInputValue}
    setInputValue={setRenameInputValue}
  />
</main>
  </>
  );

  
}
