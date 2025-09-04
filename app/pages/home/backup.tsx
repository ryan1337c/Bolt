"use client"
import Header from "../../components/Header";
import { FaRobot, FaCircle} from "react-icons/fa";
import { FiPlus } from 'react-icons/fi';
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2"; 
import { useState, useEffect, useRef, useCallback} from "react";
import Messages from "../../../util/assistantMessages";
import TypeWriter from '../../components/TypeWriter';
import chatStyles from '../../components/chatBubble.module.css'
import { AiOutlineSend } from "react-icons/ai";
import { CiSquarePlus} from "react-icons/ci";
import { VscMic } from "react-icons/vsc";
import Image from "next/image";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import { ChevronDown, Check, Ban, FileText, X, PanelLeftClose, PanelRightOpen, Menu} from 'lucide-react';
import { nanoid } from 'nanoid';
import { GoPaperclip } from "react-icons/go";
import SpeechRecognitionModal from "../../components/SpeechRecognitionModal";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/app/context/AuthContext';


export interface ChatMessage {
  role: string;
  content: string;
  imageUrl: string;
  clickedInHistory: boolean; 
  loading: boolean;
  isNew: boolean;
}


export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [image, setImage] = useState('');
  const [imageTrigger, setImageTrigger] = useState(false);
  const [imageCount, setImageCount] = useState<number>(1);
  const messageRefs = useRef<HTMLDivElement[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [processingMessage, setProcessingMessage] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [currentState, setCurrentState] = useState("text");
  const { chatMode, setChatMode } = useAuth();

  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // chat box stuff
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);
  const isAutoScroll = useRef(true);

  // side bar stuff
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // auth
  const authServices = new AuthServices();
  const publicServices = new PublicServices();

  // Model dropdown
  const [isOpenModel, setIsOpenModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const models = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'OpenAI\'s most capable multimodal model',
      tier: 'gpt4'
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      description: 'Smart, efficient model for everyday use',
      tier: 'sonnet'
    },
    {
      id: 'deep-seek',
      name: 'DeepSeek',
      description: 'Most capable model for complex tasks',
      tier: 'deepseek'
    },
  ];

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpenModel(false);
  }

  const selectedModelData = models.find(model => model.id === selectedModel);

  // Uploading 
  const [isOpenUpload, setIsOpenUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const upload = {
    name: "Add photos & files",
    icon: "",
    id: "upload"
  }

  const handleUploadSelect = () => {
    setIsOpenUpload(false);
    // Safely trigger the click event on the hidden file input
    fileInputRef.current?.click();
  }

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

  if (e.target.files && e.target.files.length > 0) {
    // Add the newly selected file to your component's state
    setFiles((prevFiles) => [...prevFiles, e.target.files![0]]);
  }
};

  const handleFileDelete = (fileIndex: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index != fileIndex));

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
  }

  // Search and Tools
  const [isOpenTools, setIsOpenTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState("reasoning")
  const [showTooltip, setShowTooltip] = useState(false);
  const tools = [
    { name: "Generate Image", icon: "", id: "image"},
    { name: "Reasoning", icon: "", id: "reasoning"},
  ]

  const handleToolSelect = (toolId: string) => {
    setIsOpenTools(false);
    // Tool logic
    setSelectedTool(toolId)
  }

  const handleOverlayClick = (clickType: string) => {
    if (clickType === "model") 
      setIsOpenModel(false);
    else if (clickType === "tools")
      setIsOpenTools(false);
    else
      setIsOpenUpload(false);
  }

  // Voice modal
  const [isDictateModalOpen, setIsDictateModalOpen] = useState(false);

  // Handler for speech to text
  const handleDictateTranscript = (text: string) => {
    // Appends the dictated text to any existing text in the textarea
    setUserInput(prev => prev ? `${prev} ${text}` : text);
    setIsDictateModalOpen(false); // Close the modal
    
    // Optional: focus the textarea and trigger its auto-resize
    if (textareaRef.current) {
        setTimeout(() => {
            textareaRef.current?.focus();
            handleInput();
        }, 0)
    }
  };

  const filterForOpenAI = (history: ChatMessage[]) => {
    return history.map(({ role, content }) => ({ role, content}));
  }

  const generateImage = async() => {
    setProcessingMessage(true);
    
    try {
      const response = await fetch('../api/generateImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${userInput}`
      }),
    });

    if (!response.ok) {
      setIsValid(false)
      console.log("Something went wrong when generating image on server side");
      setImage("fail");
    }
      else {
        const data = await response.json();
        const imageUrl = await publicServices.uploadImage(data.url);
        setImage(imageUrl);
        setIsValid(true)
      }
    }
   catch (error: any) {
      // Network issue
      console.error('Fetch failed: ', error.message || error);
      setImage("fail");
    }

    setImageTrigger(prev => !prev);
    setProcessingMessage(false);
    
  }

  const generateResponse = async() => {
    setProcessingMessage(true);
    console.log("history", chatHistory);
    try{
      const response = await fetch('../api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: filterForOpenAI(chatHistory),
          modelId: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Access the response message
      const aiMessage = data.response;

      console.log("AI message: ", aiMessage);

      // Update chat ai chat history 
      setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory];
        const lastMessageIndex = updatedHistory.length - 1;
        updatedHistory[lastMessageIndex] = {
          ...updatedHistory[lastMessageIndex],
          content: aiMessage,
          loading: false,
        }
        return updatedHistory;
      })
    }
    catch(error: any) {
      console.error('Fetch failed: ', error.message || error);
    }

    setProcessingMessage(false);
  }

  const generateResponseWithUpload = async() => {
    setProcessingMessage(true);
    if (selectedTool === "image") {
      // Update chat ai chat history 
      setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory];
        const lastMessageIndex = updatedHistory.length - 1;
        updatedHistory[lastMessageIndex] = {
          ...updatedHistory[lastMessageIndex],
          content: 'As of now, we do not support image generation with uploads',
          loading: false,
        }
        return updatedHistory;
      })
      setFiles([]); 
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setProcessingMessage(false);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    })
    formData.append("modelId", selectedModel);
    formData.append("userInput", chatHistory[chatHistory.length - 1 - 1].content)

    setFiles([]); 
    // reset value fo file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const response = await fetch('../api/generateWithUpload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

            if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Access the response message
      const aiMessage = data.response;

      console.log("AI message: ", aiMessage);

      // Update chat ai chat history 
      setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory];
        const lastMessageIndex = updatedHistory.length - 1;
        updatedHistory[lastMessageIndex] = {
          ...updatedHistory[lastMessageIndex],
          content: aiMessage,
          loading: false,
        }
        return updatedHistory;
      })

    }
    catch(error: any) {
      console.error('Fetch failed: ', error.message || error);
      // set ai loading to false
      setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory];
        const lastMessageIndex = updatedHistory.length - 1;
        updatedHistory[lastMessageIndex] = {
          ...updatedHistory[lastMessageIndex],
          content: `${selectedModel} does not support one of the file(s) formats`,
          loading: false,
        }
        return updatedHistory;
      })
    }

    setProcessingMessage(false);
  }

  const addMessageToHistory = (
    prevHistory: ChatMessage[],
    messageData: {
      role: 'user' | 'assistant',
      content: string,
      imageUrl: string,
      clickedInHistory: boolean,
      loading: boolean,
      isNew: boolean,
    }
  ): ChatMessage[] => {
    const { role, content, imageUrl, clickedInHistory, loading, isNew} = messageData;
    const newMessage: ChatMessage = { role, content, imageUrl, clickedInHistory, loading, isNew};
    return [...prevHistory, newMessage];
  }


  const sendMessage = async () => {
    if (userInput) {

      let clicked = false;
      if (chatHistory.length === 0)
        clicked = true;

      // Adding user message to chat history
      setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
        return addMessageToHistory(prevHistory, {
          role: "user",
          content: userInput,
          imageUrl: '',
          clickedInHistory: clicked,
          loading: false,
          isNew: true,
        });
      });

      // Adding ai reponse to chat history
      setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
        return addMessageToHistory(prevHistory, {
          role: "assistant",
          content: selectedTool === "image" ? Messages.imgGeneration: '',
          imageUrl: '',
          clickedInHistory: false,
          loading: true,
          isNew: true,
        });
      });

      
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      
      const messageInput = (document.getElementById("message-input") as HTMLInputElement);
      messageInput.value = '';
      setUserInput('');

      if (selectedTool === 'image' && files.length == 0)
        await generateImage();


    //     Force placeholder to re-render
    if (textareaRef.current) {
      textareaRef.current.blur();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
    }

    }
  }

const downloadImage = async (imageUrl : string) => {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'generated-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
};


  const scrollToBottom = () => {

    const targetMessage = messagesEndRef.current
    if (chatBoxRef.current && targetMessage) {
      const chatBox = chatBoxRef.current;
      const messageOffsetTop = targetMessage.offsetTop;

      chatBox.scrollTo({
        top: messageOffsetTop,
        behavior: 'smooth',
      });
  }

  }

  const scrollToMessage = (index: number) =>  {

    setChatHistory((prevHistory) => {
      const updated = prevHistory.map((msg, i) => ({
        ...msg,
        clickedInHistory: i === index,
        isNew: false
      }));

      return updated;
    });

    setCurrentHistoryIndex(index);

    const scrollWhenReady = () => {
      const targetMessage = messageRefs.current[index];
      if (targetMessage && chatBoxRef.current) {
        const chatBox = chatBoxRef.current;
        const messageOffsetTop = targetMessage.offsetTop;
        chatBox.scrollTo({ top: messageOffsetTop, behavior: 'smooth' });
      } else {
        requestAnimationFrame(scrollWhenReady);
      }
    };

    scrollWhenReady();

  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && userInput.trim()) {
        sendMessage();
      }
  }

  const handleInput = () => {
    if (textareaRef.current) {
      // Reset height to auto to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; 
      
      if (scrollHeight <= maxHeight) {
        // Growing phase - textarea expands
        textareaRef.current.style.height = scrollHeight + 'px';
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        // Max height reached - enable scrolling
        textareaRef.current.style.height = maxHeight + 'px';
        textareaRef.current.style.overflowY = 'auto';
      }
    }

  }

  useEffect(() => {
    // Scroll to the bottom every time chatHistory is updated
    const shouldUpdate = chatHistory.length > 0 && chatHistory.at(-1)?.loading === false;
    const updateChatHistory = async() => {
      try {
        // Fetch user session
        const session = await authServices.getSession();
        const {email} = session.user

        await publicServices.updateHistory(email, chatHistory);
      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }

    if (shouldUpdate)
      updateChatHistory();

    const shouldGenerateResponse = chatHistory.length > 0 && chatHistory.at(-1)?.loading === true && chatMode === "recents";


    if (shouldGenerateResponse && selectedTool === "reasoning" && files.length == 0) 
        generateResponse();
    
    // Responses with uploads
    if (files.length > 0 && shouldGenerateResponse) 
      generateResponseWithUpload()
    
  }, [chatHistory]); // Depend on chatHistory to trigger when new messages are added

  useEffect(() => {
    if (image) {
        // update to new image url 
        setChatHistory(prevHistory => {
          const updatedHistory = [...prevHistory];
          const lastMessageIndex = updatedHistory.length - 1;
          updatedHistory[lastMessageIndex] = {
            ...updatedHistory[lastMessageIndex],
            ...(isValid ? {} : { content: 'Message is not appropriate.' }),
            imageUrl: image !== 'fail' ? image : '',
            loading: false,
          };

          setImageCount(imageCount + 1);
          return updatedHistory;
        });


            // Additional scroll to bottom after a short delay to ensure image is fully loaded
            setTimeout(() => {
                scrollToBottom();
            }, 800);
    }

  },[imageTrigger]);

  useEffect(() => {
    // Load user chat history
    async function fetchHistory() {
      try {
        // Fetch user session
        const session = await authServices.getSession();

        const {id, email} = session.user

        // Fetch user chat history
        const history = await publicServices.fetchHistory(id);

        if (history === false) {
          // Create a new user history in databse
          await publicServices.addHistory(id, email);
          return;
        }

        setChatHistory(history.map((msg: ChatMessage)  => ({
          ...msg,
          isNew: false
        })));
      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }

      
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }

    if (chatMode === "recents") {
    fetchHistory();

    // Mount handleInput for user input box
    handleInput();

    const chatContainer = chatBoxRef.current;
    if (!chatContainer) {
      console.log('Chat container not ready yet');
      return;
    }

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;

      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1;

      isAutoScroll.current = isAtBottom;
    };
    chatContainer.addEventListener('scroll', onScroll);
    return () => chatContainer.removeEventListener('scroll', onScroll);
  }
    else
      setChatHistory([])
  }, [chatMode]);

  // const handleDelete = async() => {
  //   try {
  //     // Fetch user session
  //     const session = await authServices.getSession();
  //     const {email} = session.user
  //     await publicServices.deleteHistory(email, chatHistory);

  //     setChatHistory([]);
  //   }
  //   catch (error: any) {
  //     const message = error.message || 'An unexpected error occurred';
  //     console.error(message);
  //   }
  // }

  // Apply markdown formatting
  const formatMarkdown = (text: string): string => {
    // First, handle code blocks
    let processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const lang = language || 'text';
      const blockId = `code-${nanoid()}`
      return `<div class="code-block border border-gray-200 rounded-lg overflow-hidden"><div class="flex justify-between items-center bg-gray-50 px-3 py-0.5 border-b border-gray-200"><span class="text-xs text-gray-600 font-medium">${lang}</span><button class="copy-btn" data-block-id="${blockId}">Copy</button></div><div class="bg-gray-50"><pre class="p-4 whitespace-pre-wrap break-words"><code id="${blockId}" class="block whitespace-pre-wrap break-words text-sm font-mono text-gray-800">${escapeHtml(code.trim())}</code></pre></div></div>`;
    });

    // Then handle other markdown formatting

    return processedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>');
  };

  // HTML escape function
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

    // Copy to clipboard function
    const copyToClipboard = useCallback((text: string, buttonElement: HTMLElement) => {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Copied!';
        
        setTimeout(() => {
          buttonElement.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }, []);
  
    // Setup copy functionality after content updates
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('copy-btn')) {
        const blockId = target.getAttribute('data-block-id');
        const codeEl = document.getElementById(blockId!);
        if (codeEl) {
          copyToClipboard(codeEl.textContent || '', target);
        }
      }
    };
  
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [copyToClipboard]);

  const handleTypingComplete = useCallback(() => {
    setChatHistory(prevHistory => {
      if (prevHistory.length === 0) {
        return prevHistory;
      }
      
      const lastIndex = prevHistory.length - 1;
      const lastMessage = prevHistory[lastIndex];

      // Only update if the last message was 'new' to prevent unnecessary re-renders
      if (lastMessage && lastMessage.isNew) {
        const updatedHistory = [...prevHistory];
        updatedHistory[lastIndex] = { ...lastMessage, isNew: false };
        return updatedHistory;
      }
      
      return prevHistory;
    });
  }, []); // No dependencies needed due to using the updater form of setState

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
          transition-transform md:transition-[width] duration-300 ease-in-out md:static
          ${isSidebarExpanded ? 'w-64' : 'w-20'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full p-4 text-white ">
            {/* Section 1: Header with smooth text animation */}
            <div className={`flex items-center mb-6 justify-between`}>
              <div className="flex items-center overflow-hidden">
                <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-lg group">
                  {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
                <button className={`whitespace-nowrap font-bold text-xl transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0'} text-lg`}
                  onClick={() => {
                    router.push("/")
                  }}>
                  Bolt
                </button>

              </div>
            </div>

            {/* Section 2: Actions with smooth text animation */}
            <div className="space-y-2">
              <button 
                className={`w-full group flex p-3 rounded-lg text-sm font-medium text-white ${chatMode === "new chat" && 'bg-white/10'} hover:bg-white/10 transition-colors duration-300 justify-start`}
                onClick={() => setChatMode("new chat")}
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

              {/* Chats Button */}
              <button className={`w-full group flex p-3 rounded-lg text-sm font-medium text-white ${chatMode === "chats" && 'bg-white/10'} hover:bg-white/10 justify-start`}
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
            </div>
            
            {/* Section 3 Chats */}
            
             <div className={`flex-grow pt-6 flex flex-col min-h-0
              overflow-hidden transition-all duration-300 ease-in-out
              ${isSidebarExpanded ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'}
            `}>
                <h3 className={`px-3 text-sm font-medium text-gray-400 flex-shrink-0`}>Recents</h3>
                <div className="mt-2 flex-grow space-y-2 overflow-y-auto scrollbar-custom">
                    {chatHistory.map((chatMessage, index) => (
                        chatMessage.role === 'user' && (
                            <button key={index} onClick={() => scrollToMessage(index)} 
                                className={`w-full text-left p-3 rounded-lg text-sm truncate hover:bg-white/10 transition-colors duration-300
                                ${chatMessage.clickedInHistory ? 'bg-white/10' : ''}
                                ${!isSidebarExpanded && 'hidden'}`}>
                                {chatMessage.content}
                            </button>
                        )
                    ))}
                </div>
            </div>
            {/* Section 4 */}
            <div className='mt-auto'>
              <button className={`ml-auto p-2 flex ${isSidebarExpanded && 'gap-2'} items-center justify-center shine-button hover:bg-hoverLandingPage`} onClick={async () => {
                const auth = new AuthServices();
                await auth.logout();
                // redirect back to landing page 
                router.push('/');
              }}>
                <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Sign Out</span>
              </button>
            </div>
          </div>
      </div>

      {/* Main Chat Area */}
      {chatMode === "recents" ? <div className="flex-1 flex flex-col min-w-0 bg-white transition-transform duration-300 ease-in-out">
        {/* Hamburger Menu Button (Mobile Only) */}
          <div className="p-4 md:hidden">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <Menu size={24} />
            </button>
          </div>
        <div className="w-full flex flex-col flex-1 overflow-hidden h-full">
          <div id="chat-box" ref={chatBoxRef} className="w-full flex flex-col bg-white flex-1 overflow-y-auto overflow-x-hidden scrollbar-custom">
            {chatHistory.map((chatMessage,index) => {
              const minWidth = 100;
              const maxWidth = 500;
              const textWidth = chatMessage.content.length * 10;
              const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
              const containerStyle = {
                maxWidth: `${finalWidth}px`,
              }

              // display user messages
              if (chatMessage.role === 'user') {
                return (
                  <div key={index}
                      ref={(reference) => {
                        if (reference)
                          messageRefs.current[index] = reference as HTMLDivElement;
                      }}
                      className={`mt-5 mb-2 mr-10 ml-auto text-sm text-center right-0 rounded-lg p-2 bg-gray-200 break-all ${chatStyles.talkBubbleUser}`}
                      style={containerStyle}>
                    {chatMessage.content}
                  </div>
                );
              }

            // display ai messages
            else {
                return (<div key={index} className="flex flex-row">
                  <FaRobot size="30px" className="mt-10 ml-3 flex-shrink-0"/>
                  <div className={` mt-5 mb-2 w-auto rounded-lg  bg-white break-all ${chatStyles.talkBubbleAi}`}>
                  {chatMessage.loading ? (
                  <>
                    <div className={`${chatStyles.dot1_delay } ${chatStyles.loadingAnimation}`}/>
                    <div className={`${chatStyles.dot2_delay } ${chatStyles.loadingAnimation}`}/>
                    <div className={`${chatStyles.dot3_delay } ${chatStyles.loadingAnimation}`}/>

                  </>
                  )
                    :(<div className="flex flex-col">
                      {chatMessage.isNew ? <TypeWriter content={formatMarkdown(chatMessage.content)} baseSpeed={15} containerRef={chatBoxRef} isAutoScrollRef={isAutoScroll} onComplete={handleTypingComplete}/>: <div className="whitespace-pre-wrap text-sm"           dangerouslySetInnerHTML={{
                        __html: formatMarkdown(chatMessage.content)
                      }} />}

                      {chatMessage.imageUrl !== '' && <>
                      <Image src={chatMessage.imageUrl} alt="Generated Image" className="object-cover p-2" width={256} height={256} priority />
                      <button onClick={() => downloadImage(chatMessage.imageUrl)} className="bg-downloadBox m-2 rounded-md font-semibold flex justify-center hover:bg-downloadBoxOnHover pt-2 pb-2" >Download Image</button>
                      </>}
                    </div>)
                    }
                        </div>
                    </div>
                )
              }

                })}
            <div ref={messagesEndRef}></div>{/* This div will be scrolled to */}

          </div>
        <div className="w-full  sticky bottom-0 z-10 bg-white">
            <div className="bg-white w-full">
              <div className={`flex flex-col border p-2 bg-white w-full
              transition-colors duration-300 ease-in-out ${isTextareaFocused ? 'border-gray-500': 'border-gray-300 hover:border-gray-500'}`}>
              {/* Uploaded files */}
                {files.length > 0 && (
                  <div className="mb-2 p-2 border-t border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center bg-gray-100 rounded-lg pl-2 pr-1 py-1 text-sm">
                          <FileText className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                          <span className="truncate max-w-xs">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleFileDelete(index)}
                            className="ml-2 p-0.5 rounded-full hover:bg-gray-300"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-3 h-3 text-gray-700" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`flex items-center`}>
                  <textarea
                  id="message-input"
                  ref={textareaRef}
                  placeholder="Type your message..."
                  wrap="hard"
                  disabled={processingMessage}
                  className="flex-1  mt-2 min-h[24px] max-h-[200px] resize-none bg-transparent border-none ouline-none overflow-hidden pt-1 text-base break-all whitespace-normal outline-none placeholder:text-gray-500"
                  value={userInput}
                  onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setUserInput(e.target.value)
                    handleInput()
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)} // Corrected event type here
                  onFocus={() => setIsTextareaFocused(true)}
                  onBlur={() => setIsTextareaFocused(false)}
                  />
                    <button id="send-btn" type="button" onClick={() => sendMessage()} disabled={processingMessage}><AiOutlineSend className={`w-10 h-10 p-[5px] flex items-center justify-center text-white rounded-full border-2
                      transition-colors duration-200 ease-in-out ${userInput ? "bg-black  hover:bg-gray-600" : "bg-gray-300"}`}/></button>
                </div>
                <div className="flex">
                  <div className="relative group">
                    <button 
                      className="rounded-md hover:bg-gray-100 transition-colors duration-300 ease-in-out"
                      onClick={() => setIsOpenUpload(!isOpenUpload)}
                    >
                      <CiSquarePlus size="2.7em" className="text-gray-500" />
                    </button>

                    {/* Uploading tip */}
                    {!isOpenUpload && (
                      <div className="absolute bottom-full left-0 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        Add files and more
                        <div className="absolute top-full left-6 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}         
                      onChange={handleFileChange} 
                      className="hidden"         
                    />


                    {/* Show dropdown */}
                      {isOpenUpload && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                          <button
                            onClick={handleUploadSelect}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left"
                          >
                            <GoPaperclip size={"25px"} className="flex-shrink-0 text-gray-600" />
                            
                            <div className="flex-1 text-sm font-medium text-gray-900">
                              {upload.name}
                            </div>
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="relative inline-block text-left group">
                    <button
                      onClick={() => setIsOpenTools(!isOpenTools)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                      >
                        <svg className=" w-6 h-6" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z" />
                        </svg>
                    </button>

                    {/* Tooltip */}
                    {!isOpenTools && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        Search and Tools
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}

                    {/* Tool Dropdown Menu */}
                    {isOpenTools && (
                      <div className="absolute bottom-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                        {tools.map((tool, index) => (
                          <button
                            key={index}
                            onClick={() => handleToolSelect(tool.id)}
                            className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left"
                          >
                            <div className="flex-shrink-0 mt-0.5 text-gray-600">
                              {tool.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {tool.name}
                              </div>
                            </div>
                            {selectedTool === tool.id && (
                                <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative group inline-block">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-color"
                    onClick={() => setIsDictateModalOpen(true)}>
                      <VscMic size="21px" />
                    </button>

                    {/* Voice tip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      Dictate
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
     
                  </div>
                  <div className="relative inline-block text-left ml-auto">
                    {/* Trigger Button */}
                    <button
                      onClick={() => {
                        if (selectedTool !== "image")
                          setIsOpenModel(!isOpenModel)
                      }
                      }
                      className="inline-flex items-center justify-between w-40 md:w-64 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedModelData?.tier === 'sonnet' ? 'bg-orange-500' :
                          selectedModelData?.tier === 'gpt4' ? 'bg-green-500' :
                          selectedModelData?.tier === 'deepseek' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-left">
                          {selectedModelData?.name}
                        </span>
                      </div>
                {selectedTool === "image" ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <Ban className="w-4 h-4 transition-transform duration-200 text-red-500" />

                  {/* Tooltip */}
                    <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-10 ${showTooltip ? 'opacity-100': 'opacity-0 pointer-events-none '} transition-opacity duration-75`}>
                      Model selection disabled for image tool
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>

                  </div>
                  ):  <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpenModel ? 'transform rotate-180' : ''
                        }`}
                      />
                      }
                    </button>

                    {/* Model Dropdown Menu */}
                    {isOpenModel && (
                      <div className="absolute right-0 z-10 bottom-full mb-2 w-40 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col max-h-[60vh]">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                          {models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => handleModelSelect(model.id)}
                              className="group flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="flex items-center flex-1">
                                <div className={`w-2 h-2 rounded-full mr-3 ${
                                  model.tier === 'sonnet' ? 'bg-orange-500' :
                                  model.tier === 'gpt4' ? 'bg-green-500' :
                                  model.tier === 'deepseek' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`} />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-gray-900">{model.name}</div>
                                  <div className="text-gray-500 text-xs mt-0.5">{model.description}</div>
                                </div>
                              </div>
                              {selectedModel === model.id && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Footer - CHANGED: Added flex-shrink-0 */}
                        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
                          <div className="text-xs text-gray-500">
                            Choose the model that best fits your needs
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Overlay to close dropdown when clicking outside */}
                  {(isOpenModel || isOpenTools || isOpenUpload) && (
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => {
                        const clickType = isOpenModel ? "model": isOpenTools ? "tools": "upload";
                        handleOverlayClick(clickType)
                      }}
                    />
                  )}
              </div>
            </div>
            </div>
            </div>
        </div>
      </div>
    </div> : <div className="flex-1 flex flex-col items-center justify-center bg-white p-4 ">
    <div className="text-center w-full max-w-3xl mx-auto">
        <FaRobot size="60px" className="mx-auto text-gray-400 mb-4 animate-fade-in" />
        <h1 className="text-2xl font-bold text-gray-800 animate-fade-in">Welcome to Bolt AI</h1>
        
        {/* This is the container for the text box */}
        <div className="w-full mt-5">
            <div className={`flex flex-col border rounded-2xl p-2 bg-white
                transition-colors duration-300 ease-in-out ${isTextareaFocused ? 'border-gray-500' : 'border-gray-300 hover:border-gray-500'}`}>
                
                {/* Uploaded files */}
                {files.length > 0 && (
                    <div className="mb-2 p-2 border-t border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {files.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="flex items-center bg-gray-100 rounded-lg pl-2 pr-1 py-1 text-sm">
                                    <FileText className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                                    <span className="truncate max-w-xs">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleFileDelete(index)}
                                        className="ml-2 p-0.5 rounded-full hover:bg-gray-300"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <X className="w-3 h-3 text-gray-700" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`flex items-center`}>
                    <textarea
                        id="message-input"
                        ref={textareaRef}
                        placeholder="How can I help you today?"
                        wrap="hard"
                        disabled={processingMessage}
                        className="flex-1 mt-2 min-h[24px] max-h-[200px] resize-none bg-transparent border-none ouline-none overflow-hidden pt-1 text-base break-all whitespace-normal outline-none placeholder:text-gray-500"
                        value={userInput}
                        onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setUserInput(e.target.value)
                            handleInput()
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)}
                        onFocus={() => setIsTextareaFocused(true)}
                        onBlur={() => setIsTextareaFocused(false)}
                    />
                    <button id="send-btn" type="button" onClick={() => sendMessage()} disabled={processingMessage}>
                        <AiOutlineSend className={`w-10 h-10 p-[5px] flex items-center justify-center text-white rounded-full border-2
                            transition-colors duration-200 ease-in-out ${userInput ? "bg-black hover:bg-gray-600" : "bg-gray-300"}`} />
                    </button>
                </div>
                <div className="flex">
                  <div className="relative group">
                    <button 
                      className="rounded-md hover:bg-gray-100 transition-colors duration-300 ease-in-out"
                      onClick={() => setIsOpenUpload(!isOpenUpload)}
                    >
                      <CiSquarePlus size="2.7em" className="text-gray-500" />
                    </button>

                    {/* Uploading tip */}
                    {!isOpenUpload && (
                      <div className="absolute bottom-full left-0 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        Add files and more
                        <div className="absolute top-full left-6 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}         
                      onChange={handleFileChange} 
                      className="hidden"         
                    />


                    {/* Show dropdown */}
                      {isOpenUpload && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                          <button
                            onClick={handleUploadSelect}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left"
                          >
                            <GoPaperclip size={"25px"} className="flex-shrink-0 text-gray-600" />
                            
                            <div className="flex-1 text-sm font-medium text-gray-900">
                              {upload.name}
                            </div>
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="relative inline-block text-left group">
                    <button
                      onClick={() => setIsOpenTools(!isOpenTools)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                      >
                        <svg className=" w-6 h-6" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z" />
                        </svg>
                    </button>

                    {/* Tooltip */}
                    {!isOpenTools && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        Search and Tools
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}

                    {/* Tool Dropdown Menu */}
                    {isOpenTools && (
                      <div className="absolute bottom-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                        {tools.map((tool, index) => (
                          <button
                            key={index}
                            onClick={() => handleToolSelect(tool.id)}
                            className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left"
                          >
                            <div className="flex-shrink-0 mt-0.5 text-gray-600">
                              {tool.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {tool.name}
                              </div>
                            </div>
                            {selectedTool === tool.id && (
                                <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative group inline-block">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-color"
                    onClick={() => setIsDictateModalOpen(true)}>
                      <VscMic size="21px" />
                    </button>

                    {/* Voice tip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      Dictate
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
     
                  </div>
                  <div className="relative inline-block text-left ml-auto">
                    {/* Trigger Button */}
                    <button
                      onClick={() => {
                        if (selectedTool !== "image")
                          setIsOpenModel(!isOpenModel)
                      }
                      }
                      className="inline-flex flex-shrink-1 items-center justify-between w-40 md:w-64 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedModelData?.tier === 'sonnet' ? 'bg-orange-500' :
                          selectedModelData?.tier === 'gpt4' ? 'bg-green-500' :
                          selectedModelData?.tier === 'deepseek' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-left">
                          {selectedModelData?.name}
                        </span>
                      </div>
                {selectedTool === "image" ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <Ban className="w-4 h-4 transition-transform duration-200 text-red-500" />

                  {/* Tooltip */}
                    <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-10 ${showTooltip ? 'opacity-100': 'opacity-0 pointer-events-none '} transition-opacity duration-75`}>
                      Model selection disabled for image tool
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>

                  </div>
                  ):  <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpenModel ? 'transform rotate-180' : ''
                        }`}
                      />
                      }
                    </button>

                    {/* Model Dropdown Menu */}
                    {isOpenModel && (
                      <div className="absolute right-0 z-10 bottom-full mb-2 w-40 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col max-h-[60vh]">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                          {models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => handleModelSelect(model.id)}
                              className="group flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="flex items-center flex-1">
                                <div className={`w-2 h-2 rounded-full mr-3 ${
                                  model.tier === 'sonnet' ? 'bg-orange-500' :
                                  model.tier === 'gpt4' ? 'bg-green-500' :
                                  model.tier === 'deepseek' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`} />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-gray-900">{model.name}</div>
                                  <div className="text-gray-500 text-xs mt-0.5">{model.description}</div>
                                </div>
                              </div>
                              {selectedModel === model.id && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Footer - CHANGED: Added flex-shrink-0 */}
                        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
                          <div className="text-xs text-gray-500">
                            Choose the model that best fits your needs
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Overlay to close dropdown when clicking outside */}
                  {(isOpenModel || isOpenTools || isOpenUpload) && (
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => {
                        const clickType = isOpenModel ? "model": isOpenTools ? "tools": "upload";
                        handleOverlayClick(clickType)
                      }}
                    />
                  )}
                  </div>
                </div>
            </div>
        </div>
    </div>
</div>}
  </div>
</main>
   {/* Render voice speech-to-text popup */}
    <SpeechRecognitionModal
      isOpen={isDictateModalOpen}
      onClose={() => setIsDictateModalOpen(false)}
      onTranscript={handleDictateTranscript}
    />
  </>
  );

  
}
