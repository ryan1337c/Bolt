"use client"
import Header from "../../components/Header";
import { FaRobot } from "react-icons/fa";
import { useState, useEffect, useRef} from "react";
import Messages from "../../../util/assistantMessages";
import TypeWriter from '../../components/TypeWriter';
import chatStyles from '../../components/chatBubble.module.css'
import { AiOutlineSend } from "react-icons/ai";
import { CiSquarePlus } from "react-icons/ci";
import Image from "next/image";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import { ChevronDown, Check, Ban, Palette, Globe, Code, FileText, Calculator } from 'lucide-react';

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

  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // chat box stuff
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);

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

  // Search and Tools
  const [isOpenTools, setIsOpenTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState("image")
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
    else
      setIsOpenTools(false);
  }

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
    const { role, content, imageUrl, clickedInHistory, loading, isNew } = messageData;
    const newMessage: ChatMessage = { role, content, imageUrl, clickedInHistory, loading, isNew };
    return [...prevHistory, newMessage];
  }


  const sendMessage = async () => {
    if (userInput) {

      let clicked = false;
      let isNew = true;
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
          isNew: true
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
          isNew: true
        });
      });

      
      const messageInput = (document.getElementById("message-input") as HTMLInputElement);
      messageInput.value = '';
      setUserInput('');

      if (selectedTool === 'image')
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
    chatHistory[currentHistoryIndex].clickedInHistory = false;
    chatHistory[index].clickedInHistory = true;
    setCurrentHistoryIndex(index);

    const targetMessage = messageRefs.current[index];
      if (chatBoxRef.current && targetMessage) {
        const chatBox = chatBoxRef.current;
        const messageOffsetTop = targetMessage.offsetTop;
        chatBox.scrollTo({
          top: messageOffsetTop,
          behavior: 'smooth',
        });
    }


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
    // scrollToBottom();
    const shouldUpdate = chatHistory.length > 0 && chatHistory.at(-1)?.loading === false;
    const updateChatHistory = async() => {
      try {
        // Fetch user session
        const session = await authServices.getSession();

        await publicServices.updateHistory(session.user.id, chatHistory);
      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }

    if (shouldUpdate)
      updateChatHistory();

    const shouldGenerateResponse = chatHistory.length > 0 && chatHistory.at(-1)?.loading === true;

    if (shouldGenerateResponse && selectedTool === "reasoning") {
      generateResponse();
    }
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

        // Fetch user chat history
        const history = await publicServices.fetchHistory(session.user.id);

        if (history === false) {
          // Create a new user history in databse
          await publicServices.addHistory(session.user.id);
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
    }
    fetchHistory();

    // Mount handleInput for user input box
    handleInput();


    // Use the ref instead of getElementById
    const chatContainer = chatBoxRef.current;
    if (!chatContainer) {
      console.log('Chat container not ready yet');
      return;
    }

    let scrollTimeout: NodeJS.Timeout;

    const observer = new MutationObserver(() => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 16);
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log('Observer set up successfully');

    // Cleanup
    return () => {
      observer.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleDelete = async() => {
    try {
      // Fetch user session
      const session = await authServices.getSession();
      await publicServices.deleteHistory(session.user.id, chatHistory);

      setChatHistory([]);
    }
    catch (error: any) {
      const message = error.message || 'An unexpected error occurred';
      console.error(message);
    }
  }

  return (
    <>
    <main className="h-screen w-full flex flex-col">
    <Header />
    <div className="flex-1 grid grid-cols-7 ml-6 mr-6 ">
      <div className="text-white hidden md:block md:col-span-1 overflow-y-auto h-chatHistoryBox bg-landingPage scrollbar-custom">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-2 sticky top-0 bg-inherit z-10 p-2 mr-2">
          <h1 className="font-medium mb-2">Today</h1>
          <button className="bg-red-700 rounded-md pl-1 pr-1" onClick={handleDelete}>Delete All</button>
        </div>
        <div className="mr-2">
        {chatHistory.map((chatMessage, index) => {
          if (chatMessage.role === 'user'){
            if (chatMessage.clickedInHistory) {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className="border border-gray-200 rounded-md hover:rounded-md mb-3 p-2 truncate hover:cursor-pointer">
                  {chatMessage.content}
                </div>
              )
            }
            else {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className=" border border-transparent hover:rounded-md hover:cursor-pointer mb-3 p-2 truncate ">
                  {chatMessage.content}
                </div>
              )
            }
          }
      
        })}
        </div>
      </div>
      <div className="col-span-8 md:col-span-6 sm:pl-[5rem] sm:pr-[5rem] lg:pl-0 lg:pr-0 flex flex-col">
        <div className="h-chatbox md:w-[55vw]" >
        <div id="chat-box" ref={chatBoxRef} className="flex flex-col bg-white h-[60vh] md:h-[70vh] lg:ml-40 lg:mr-40 overflow-y-auto scrollbar-custom rounded-t-lg w-full">
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
                    className={`mt-5 mb-2 mr-10 ml-auto text-sm text-center right-0 rounded-lg p-2 bg-gray-200 break-words ${chatStyles.talkBubbleUser}`} 
                    style={containerStyle}>
                  {chatMessage.content}
                </div>
              );
            }

          // display ai messages
           else {
              return (<div key={index} className="flex flex-row">
                <FaRobot size="30px" className="mt-10 ml-3 flex-shrink-0"/>
                <div className={` mt-5 mb-2 w-auto rounded-lg  bg-white break-words ${chatStyles.talkBubbleAi}`}>
                {chatMessage.loading ? (
                <>
                  <div className={`${chatStyles.dot1_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot2_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot3_delay } ${chatStyles.loadingAnimation}`}/>
                  
                </>
                )
                   :(<div className="flex flex-col">
                    {chatMessage.isNew ? <TypeWriter text={chatMessage.content}/>: <div className="whitespace-pre-wrap text-sm">{chatMessage.content}</div>}
                    
                    {chatMessage.imageUrl !== '' && <>
                    <Image src={chatMessage.imageUrl} alt="Generated Image" className="object-cover" width={256} height={256} priority />
                    <button onClick={() => downloadImage(chatMessage.imageUrl)} className="bg-downloadBox mt-2 rounded-md font-semibold 0flex justify-center hover:bg-downloadBoxOnHover pt-2 pb-2" style={{width: "256px"}}>Download Image</button>
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
        <div className="relative h-[121px]">
        <div className="w-full lg:ml-40 lg:mr-40 absolute bottom-0">
            <div className="bg-white shadow-lg rounded-b-2xl w-full">
              <div className={`flex flex-col border rounded-bl-2xl rounded-br-2xl p-2 bg-white w-full
              transition-colors duration-300 ease-in-out ${isTextareaFocused ? 'border-gray-500': 'border-gray-300 hover:border-gray-500'}`}>
                <div className={`flex items-center`}>
                  <textarea
                  id="message-input"
                  ref={textareaRef}
                  placeholder="Type your message..."
                  wrap="hard"
                  disabled={processingMessage}
                  className="flex-1  min-h[24px] max-h-[200px] resize-none bg-transparent border-none ouline-none overflow-hidden pt-1 text-lg break-words whitespace-normal outline-none placeholder:text-gray-500" 
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
                  <button className="rounded-md hover:bg-gray-100 transition-colors duration-300 ease-in-out ">
                    <CiSquarePlus size="2.7em" className="text-gray-500" />
                  </button>
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
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
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
                      <div className="absolute left-0 z-10 bottom-full mb-2 w-40 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
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
                        
                        {/* Footer */}
                        <div className="border-t border-gray-100 px-4 py-3">
                          <div className="text-xs text-gray-500">
                            Choose the model that best fits your needs
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Overlay to close dropdown when clicking outside */}
                  {(isOpenModel || isOpenTools) && (
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => {
                        const clickType = isOpenModel ? "model": "tools";
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
      </div>
    </div>
  </div>
</main>
  </>
  );


  
}
