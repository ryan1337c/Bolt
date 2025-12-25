"use client"
import { FaRobot, FaBolt} from "react-icons/fa";

import { useState, useEffect, useRef, useCallback} from "react";
import Messages from "../../util/assistantMessages";
import TypeWriter from './TypeWriter';
import chatStyles from './chatBubble.module.css'
import { AiOutlineSend } from "react-icons/ai";
import { CiSquarePlus} from "react-icons/ci";
import { VscMic } from "react-icons/vsc";
import Image from "next/image";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import { ChevronDown, Check, Ban, FileText, X} from 'lucide-react';
import { nanoid } from 'nanoid';
import { GoPaperclip } from "react-icons/go";
import SpeechRecognitionModal from "./SpeechRecognitionModal";
import { useAuth } from '@/app/context/AuthContext';
import { RecentChat } from "../pages/home/page";


export interface ChatMessage {
  role: string;
  content: string;
  imageUrl: string;
  clickedInHistory: boolean; 
  loading: boolean;
  isNew: boolean;
}

type ChatProps = {
  chat: ChatMessage[];
  setRecents: React.Dispatch<React.SetStateAction<RecentChat[]>>;
  currChatId: string;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function Chat({ chat, setRecents, currChatId, isProcessing, setIsProcessing}: ChatProps) {
  const [userInput, setUserInput] = useState('');
  const [image, setImage] = useState('');
  const [imageTrigger, setImageTrigger] = useState(false);
  const [imageCount, setImageCount] = useState<number>(1);
  const messageRefs = useRef<HTMLDivElement[]>([]); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const { chatMode, setChatMode } = useAuth();

  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // chat box stuff
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);
  const isAutoScroll = useRef(true);
  
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
  interface FileWithPreview extends File {
    preview: string;
  }
  const [files, setFiles] = useState<FileWithPreview[]>([]);
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
    const file  = e.target.files![0];
    // Create a temporary url for the image preview of the file
    const fileWithUrl =  Object.assign(file, {
      preview: URL.createObjectURL(file)
    })
    // Add the newly selected file to your component's state
    setFiles((prevFiles) => [...prevFiles, fileWithUrl]);
  }
};

  const handleFileDelete = (fileIndex: number) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles[fileIndex];
      // Revoke the object URL of the deleted file to free up memory
      URL.revokeObjectURL(fileToRemove.preview);
      return prevFiles.filter((_, index) => index !== fileIndex)
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
  }

  // Effect to clean up the object URLs when the components umounts
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview))
    };
  }, [files])

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
    setIsProcessing(true);
    
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
    // setIsProcessing(false);
    
  }

  const generateResponse = async() => {
    setIsProcessing(true);
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

    // setIsProcessing(false);
  }

  const generateResponseWithUpload = async() => {
    setIsProcessing(true);
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
      // setIsProcessing(false);
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

    // setIsProcessing(false);
  }

  const sendMessage = async () => {
    if (userInput) {

      let clicked = false;
      if (chatHistory.length === 0)
        clicked = true;
      
      // Define the user's new message
      const userMessage: ChatMessage = {
        role: "user",
        content: userInput,
        imageUrl: '',
        clickedInHistory: clicked,
        loading: false,
        isNew: true,
      };

      // Define the AI's new placeholder/loading message
      const aiPlaceholderMessage: ChatMessage = {
        role: "assistant",
        content: selectedTool === "image" ? Messages.imgGeneration : '',
        imageUrl: '',
        clickedInHistory: false,
        loading: true,
        isNew: true,
      };

      // Atomically update the chat history with both messages at once
      setChatHistory(prevHistory => [...prevHistory, userMessage, aiPlaceholderMessage]);

      
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

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    const targetMessage = messagesEndRef.current;
    if (chatBoxRef.current && targetMessage) {
      const chatBox = chatBoxRef.current;
      const messageOffsetTop = targetMessage.offsetTop;

      chatBox.scrollTo({
        top: messageOffsetTop,
        behavior: behavior, 
      });
    }
  };

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

  // This is the useEffect that syncs local state with the parent
  useEffect(() => {
    setChatHistory(chat);
  }, [currChatId, chatMode]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToBottom('auto');
    }
  }, [chatHistory]);

  useEffect(() => {
    // Scroll to the bottom every time chatHistory is updated
    const shouldUpdate = chatHistory.length > 0 && chatHistory.at(-1)?.loading === false;
    console.log("Chat Length: ", chatHistory.length)
    console.log("Last message done loading?: ", chatHistory.at(-1)?.loading)
    const updateChatHistory = async() => {
      try {
        // Fetch user session
        const session = await authServices.getSession();
        const {email} = session.user

        await publicServices.updateHistory(email, chatHistory, currChatId);

        console.log("Chat history updated")

        // Update recents by replacing the old chat with new one
        setRecents(prev => 
          prev.map(session => 
            session.chat_id === currChatId ? {...session, history: chatHistory} : session
          )
        );

      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }

    const createChatHistory = async() => {
      try{
        const session = await authServices.getSession();
        const {id, email} = session.user;

        const data = await publicServices.addHistory(id, email, chatHistory);

        console.log("Chat history created successfully!");

        if (data) {
          // Add new chat history to recents
          setRecents(prev => [data, ...prev])
          
          setChatMode("recents")
        }
      }
      catch( error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }

    if (shouldUpdate) {
      if (chatMode === "recents")
        updateChatHistory();
      else if (chatMode === "new chat")
        createChatHistory();

    }

    const shouldGenerateResponse = chatHistory.length > 0 && chatHistory.at(-1)?.loading === true;


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
            ...(isValid ? {} : selectedModelData?.name === "DeepSeek" ? {content: 'We do no currently support image generation for this model.'} : { content: 'Message is not appropriate.' }),
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
    scrollToBottom();

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
  }, [chatMode]);

  // Apply markdown formatting
  const formatMarkdown = (text: string): string => {
    // First, handle code blocks
    let processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const lang = language || 'text';
      const blockId = `code-${nanoid()}`
      return `<div class="code-block border border-gray-200 dark:border-none rounded-lg overflow-hidden bg-gray-50 dark:bg-codeBgDark"><div class="flex justify-between items-center px-3 py-0.5 border-b border-gray-200 dark:border-slate-600"><span class="text-xs text-gray-600 dark:text-textDark font-medium">${lang}</span><button class="copy-btn dark:bg-codeBgDark dark:text-textDark hover:bg-[#e5e7eb] dark:hover:bg-white/10" data-block-id="${blockId}">Copy</button></div><div class="overflow-x-auto"><pre class="p-4"><code id="${blockId}" class="text-sm font-mono text-gray-800 dark:text-textDark">${escapeHtml(code.trim())}</code></pre></div></div>`;
    });

    // Then handle other markdown formatting

    return processedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-chatDark px-1 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400">$1</code>')
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
    setIsProcessing(false);
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

  const renderInputArea = () => (
    <div className="bg-white dark:bg-chatDark w-full max-w-4xl mx-auto px-2">
      <div className={`
        flex flex-col border p-2 bg-white dark:bg-slate-800 w-full mb-2 rounded-xl shadow-sm
        transition-all duration-300 ease-in-out 
        ${isTextareaFocused 
          ? 'border-gray-400 dark:border-slate-500 shadow-md'
          : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'
        }`}
      >
      {/* Uploaded files */}
          {files.length > 0 && (
          <div className="mb-2 p-2 border-t border-b border-gray-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg pl-2 pr-1 py-1 text-sm">
                      {/* Conditional rendering for image preview */}
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-8 h-8 mr-2 object-cover rounded"
                          // Revoke the object URL on load to free up memory as soon as the image is loaded
                          onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                        />
                      ) : (
                        <FileText className="w-4 h-4 mr-2 text-slate-600 dark:text-gray-300 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-xs text-slate-800 dark:text-gray-200">{file.name}</span>
                      <button
                          type="button"
                          onClick={() => handleFileDelete(index)}
                          className="ml-2 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
                          aria-label={`Remove ${file.name}`}
                      >
                          <X className="w-3 h-3 text-slate-700 dark:text-gray-300" />
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
              disabled={isProcessing}
              className="flex-1 mt-1 min-h-[20px] max-h-[150px] resize-none bg-transparent border-none outline-none overflow-y-auto pt-1 text-base break-words whitespace-normal text-black dark:text-textDark placeholder:text-gray-500 dark:placeholder:text-gray-400"
              value={userInput}
              onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setUserInput(e.target.value)
                  handleInput()
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
            />
            <button id="send-btn" type="button" onClick={() => sendMessage()} disabled={isProcessing || !userInput} className={`w-8 h-8 p-1.5 flex items-center justify-center rounded-full border-none
            transition-colors duration-200 ease-in-out ${userInput ? "bg-black hover:bg-gray-600 dark:bg-white dark:hover:bg-gray-300" : "bg-gray-300 dark:bg-slate-600 cursor-not-allowed"}`}>
                <AiOutlineSend className={`w-5 h-5 ${userInput ? "text-white dark:text-black" : "text-gray-500 dark:text-gray-400"}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between -ml-1">
              <div className="flex items-center gap-1">
              <div className="relative group">
                <button
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out"
                  onClick={() => setIsOpenUpload(!isOpenUpload)}
                  disabled={isProcessing}
                >
                  <CiSquarePlus size="2em" className="text-gray-500 dark:text-gray-400" />
                </button>
                {/* Tooltip */}
                {!isOpenUpload && ( <div className="absolute bottom-full left-0 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg transition-opacity duration-200 ease-out opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 group-hover:delay-200">Add files and more<div className="absolute top-full left-6 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div></div> )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                {/* Dropdown */}
                {isOpenUpload && ( <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1"><button onClick={handleUploadSelect} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 text-left"><GoPaperclip size={"25px"} className="flex-shrink-0 text-gray-600 dark:text-gray-300" /><div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{upload.name}</div><Check className="w-4 h-4 text-blue-600" /></button></div> )}
              </div>

              <div className="relative inline-block text-left group">
                <button
                  onClick={() => setIsOpenTools(!isOpenTools)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                    <svg className=" w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z" /></svg>
                </button>
                {/* Tooltip */}
                {!isOpenTools && ( <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 ease-out group-hover:delay-200">Search and Tools<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div></div> )}
                {/* Dropdown */}
                {isOpenTools && ( <div className="absolute bottom-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1">{tools.map((tool, index) => ( <button key={index} onClick={() => handleToolSelect(tool.id)} className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 text-left"><div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{tool.name}</div></div>{selectedTool === tool.id && (<Check className="w-4 h-4 text-blue-600" />)}</button>))}</div> )}
              </div>
              
              <div className="relative group inline-block">
                <button className="p-2.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setIsDictateModalOpen(true)} disabled={isProcessing}>
                  <VscMic size="20px" />
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 ease-out group-hover:delay-200">Dictate<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div></div>
              </div>
            </div>

            <div className="relative inline-block text-left ml-auto">
              <button
                onClick={() => {setIsOpenModel(!isOpenModel) }}
                className="inline-flex items-center justify-between w-40 md:w-64 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
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
                {selectedTool === "image" && selectedModelData?.name === "DeepSeek" ? (
                <div
                    className="relative group"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    >
                    <Ban className="w-4 h-4 transition-transform duration-200 text-red-500" />
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
              {isOpenModel && (
                <div className="absolute right-0 z-10 bottom-full mb-2 w-40 md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col max-h-[60vh]">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {models.map((model) => (
                        <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className="group flex items-center w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
                        >
                        <div className="flex items-center flex-1">
                            <div className={`w-2 h-2 rounded-full mr-3 ${
                            model.tier === 'sonnet' ? 'bg-orange-500' :
                            model.tier === 'gpt4' ? 'bg-green-500' :
                            model.tier === 'deepseek' ? 'bg-blue-500' :
                            'bg-gray-500'
                            }`} />
                            <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{model.name}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{model.description}</div>
                            </div>
                        </div>
                        {selectedModel === model.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                        )}
                        </button>
                    ))}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 flex-shrink-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Choose the model that best fits your needs
                        </div>
                    </div>
                </div>
              )}
            </div>
            {(isOpenModel || isOpenTools || isOpenUpload) && (<div className="fixed inset-0 z-0" onClick={() => { const clickType = isOpenModel ? "model": isOpenTools ? "tools": "upload"; handleOverlayClick(clickType) }} /> )}
          </div>
    </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 dark:text-white dark:bg-chatDark">
      {chatHistory.length === 0 && chatMode === "new chat" ? (
        // Empty chat state 
        <div className="flex-1 flex flex-col items-center justify-center p-4 -mt-16 animate-fade-in-up">
          <div className="text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-lg">
              <FaBolt className="text-white" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-700 dark:text-textDark">
              What can I help you with today?
            </h1>
          </div>
          <div className="w-full mt-8">
            {renderInputArea()}
          </div>
        </div>
      ) : (
        // Active chat state
        <div className="w-full flex flex-col flex-1 min-h-0 animate-fade-in-sm">
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 overflow-hidden">
              <div id="chat-box" ref={chatBoxRef} className="h-full overflow-y-auto scrollbar-custom p-4 max-w-4xl mx-auto">
                {chatHistory.map((chatMessage,index) => {
                  const minWidth = 100;
                  const maxWidth = 500;
                  const textWidth = chatMessage.content.length * 10;
                  const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
                  const containerStyle = {
                    maxWidth: `${finalWidth}px`,
                  }
                  const bubbleStyle = {
                    maxWidth: '500px',
                  };

                  // display user messages
                  if (chatMessage.role === 'user') {
                    return (
                      <div key={index} className="flex justify-end w-full mb-4">
                        <div
                        ref={(reference) => {
                          if (reference)
                            messageRefs.current[index] = reference as HTMLDivElement;
                        }}
                        className={`text-sm text-left rounded-lg p-3 bg-gray-200 dark:bg-userChatBg dark:text-textDark break-words ${chatStyles.talkBubbleUser}`}
                        style={containerStyle}>
                          {/* Display any images for file uploads */}
                          {}
                          {chatMessage.content}
                      </div>
                      </div>
                    );
                  }

                  // display ai messages
                  else {
                    return (
                      <div key={index} className="flex justify-start w-full mb-4 items-start gap-3">
                        <FaRobot size="24px" className="mt-1.5 flex-shrink-0 text-gray-600 dark:text-textDark"/>
                        <div
                          className={`
                            min-w-0 flex-1 rounded-lg
                            text-sm text-left
                            p-3
                            bg-white
                            dark:bg-chatDark
                            text-gray-800
                            dark:text-textDark
                            break-words
                            max-full
                          `}
                        >
                          {chatMessage.loading ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.1s' }} />
                              <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              {chatMessage.isNew ? (
                                <TypeWriter
                                  content={formatMarkdown(chatMessage.content)}
                                  baseSpeed={15}
                                  containerRef={chatBoxRef}
                                  isAutoScrollRef={isAutoScroll}
                                  onComplete={handleTypingComplete}
                                />
                              ) : (
                                <div
                                  className="whitespace-pre-wrap text-sm"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdown(chatMessage.content) }}
                                />
                              )}

                              {chatMessage.imageUrl && (
                                <div className="mt-2 relative w-64 h-64 rounded-md overflow-hidden group">
                                  <Image
                                    src={chatMessage.imageUrl}
                                    alt="Generated Image"
                                    width={256}
                                    height={256}
                                    priority
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                  />
                                  
                                  {/* The Download Button Overlay */}
                                  <button
                                    onClick={() => downloadImage(chatMessage.imageUrl)}
                                    className={`
                                      absolute inset-0 w-full h-full flex items-center justify-center
                                      bg-black/60 text-white font-semibold text-sm
                                      opacity-0 group-hover:opacity-100
                                      transition-opacity duration-300
                                    `}
                                  >
                                    Download Image
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
                <div ref={messagesEndRef}></div>
              </div>
            </div>
          </div>
          <div className="w-full sticky bottom-0 z-10 bg-white dark:bg-chatDark flex-shrink-0">
            {renderInputArea()}
          </div>
        </div>
      )}
      {/* Render voice speech-to-text popup */}
      <SpeechRecognitionModal
      isOpen={isDictateModalOpen}
      onClose={() => setIsDictateModalOpen(false)}
      onTranscript={handleDictateTranscript}
      />
    </div>
  )
}
