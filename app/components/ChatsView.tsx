"use client";
import { FiPlus } from 'react-icons/fi';
import { Search, Trash2} from 'lucide-react';
import { useState } from 'react';
import { RecentChat } from '../pages/home/page'; 
import { formatDistanceToNow } from 'date-fns'; 

// Define the props for the component
interface ChatsViewProps {
  recents: RecentChat[];
  onNewChat: () => void;
  onSelectChat: (index: number) => void;
  isProcessing: boolean;
  onDeleteChat: (index: number) => void 
}

export default function ChatsView({ 
  recents, 
  onNewChat, 
  onSelectChat, 
  isProcessing,
  onDeleteChat
}: ChatsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter the chats based on the search term
  const filteredRecents = recents.filter(chat => {
    const title = chat.chat_title || chat.history.find(msg => msg.role === 'user')?.content || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get the total number of chats for the counter
  const totalChats = recents.length;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden h-full animate-fade-in-sm">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full p-4 sm:p-6 md:p-8">
        
        {/* Header */}
        <div className="flex-shrink-0">
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="
                    text-3xl 
                    font-light  
                    text-gray-700 
                    tracking-tight 
                    mb-4 sm:mb-0
                ">
                    Your Chat History
                </h1>
                <button
                    onClick={onNewChat}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7b66ba] rounded-lg hover:bg-[#66549b] disabled:bg-[#9178d9] transition-colors"
                >
                    <FiPlus size={16} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 border border-gray-300 rounded-lg flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-400" />
                </div>
                <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your chats..."
                className="
                w-full 
                pl-12 pr-4 py-3 
                text-gray-800
                rounded-lg 
                focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                transition-all duration-300 
                "
                 />
            </div>
            <div className="flex-shrink-0 text-sm text-gray-500 mb-4 px-1">
                <p>{totalChats} {totalChats === 1 ? 'chat' : 'chats'} with Bolt</p>
            </div>
        </div>

        {/* Chat List  */}
        <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
                <div className="space-y-3 pb-4">
                    {filteredRecents.length > 0 ? (
                        filteredRecents.map((chat) => {
                        const originalIndex = recents.findIndex(r => r.chat_id === chat.chat_id);
                        const chatTitle = chat.chat_title || chat.history.find(msg => msg.role === 'user')?.content || 'New Chat';
                        // Convert the created_at timestamp into a relative string like "about 5 hours ago"
                        const timeAgo = formatDistanceToNow(new Date(chat.created_at), { addSuffix: true });
                        
                        return (
                            <div
                            key={chat.chat_id}
                            className="w-full flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors group disabled:opacity-50"
                            >
                                <button
                                key={chat.chat_id}
                                onClick={() => onSelectChat(originalIndex)}
                                disabled={isProcessing}
                                className="flex-1 text-left min-w-0"
                                >
                                    <h2 className="font-semibold text-gray-800 truncate mb-1 group-hover:text-indigo-600">
                                        {chatTitle}
                                    </h2>
                                    <p className="text-sm text-gray-500 truncate capitalize">
                                        {`Created ${timeAgo}`}
                                    </p>
                                </button>
                                 {/* Delete Icon Button */}
                                <button
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(originalIndex);
                                    }}
                                    disabled={isProcessing}
                                    className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                    aria-label="Delete chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                        <p>No chats found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}