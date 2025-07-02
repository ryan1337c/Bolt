"use client"
import Header from "../../components/Header";
import { FaRobot } from "react-icons/fa";
import { useState, useEffect, useRef} from "react";
import Messages from "../../../util/assistantMessages";
import TypeWriter from '../../components/TypeWriter';
import chatStyles from '../../components/chatBubble.module.css'
import { AiOutlineSend } from "react-icons/ai";
import Image from "next/image";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";

export interface ChatMessage {
  sender: string;
  text: string;
  imageUrl: string;
  clickedInHistory: boolean; 
  loading: boolean;
}


export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [image, setImage] = useState('');
  const [imageTrigger, setImageTrigger] = useState(false);
  const [imageCount, setImageCount] = useState<number>(1);
  const messageRefs = useRef<HTMLDivElement[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [processingMessage, setProcessingMessage] = useState(false);

  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);

  // chat box stuff
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);

  // auth
  const authServices = new AuthServices();
  const publicServices = new PublicServices();

  const generateImage = async() => {
    setProcessingMessage(true);
    
    try {
      const response = await fetch('../api/generate', {
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
      console.log("Error 400 or 500");
      setImage("fail");
    }
      else {
        const data = await response.json();
        setImage(data.url);
        console.log(data.url);
        setIsValid(true)
      }
    }
   catch (error: any) {
      // Network issue
      console.error('Fetch failed: ', error.message || error)
    }

    setImageTrigger(prev => !prev);
    setProcessingMessage(false);
    
  }

  const addMessageToHistory = (
    prevHistory: ChatMessage[],
    sender: 'user' | 'ai',
    text: string,
    imageUrl: string,
    clickedInHistory: boolean,
    loading: boolean
  ): ChatMessage[] => {
    const newMessage: ChatMessage = { sender, text, imageUrl, clickedInHistory, loading};
    return [...prevHistory, newMessage];
  }


  const sendMessage = () => {
    if (userInput) {

      let clicked = false;
      if (chatHistory.length === 0)
        clicked = true;

      // Adding user message to chat history
      setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
        return addMessageToHistory(prevHistory, 'user', userInput, image, clicked, false);
      });

      // Adding ai reponse to chat history
      setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
        return addMessageToHistory(prevHistory, 'ai', Messages.imgGeneration, '', false, true);
      });


      const messageInput = (document.getElementById("message-input") as HTMLInputElement);
      messageInput.value = '';
      setUserInput('');

      generateImage();

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

  useEffect(() => {
    // Scroll to the bottom every time chatHistory is updated
    scrollToBottom();

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
    if (chatHistory.length !== 0)
      updateChatHistory()
  }, [chatHistory]); // Depend on chatHistory to trigger when new messages are added

  useEffect(() => {
    if (image) {
        // update to new image url 
        setChatHistory(prevHistory => {
          const updatedHistory = [...prevHistory];
          const lastMessageIndex = updatedHistory.length - 1;
          updatedHistory[lastMessageIndex] = {
            ...updatedHistory[lastMessageIndex],
            ...(isValid ? {} : { text: 'Meessage is not appropriate.' }),
            imageUrl: image !== 'fail' ? image : '',
            loading: false,
          };

          setImageCount(imageCount + 1);
          return updatedHistory;
        });

        scrollToBottom()

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

        setChatHistory(history);
      }
      catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
      }
    }
    fetchHistory();
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
    <main className="h-screen w-full flex flex-col overflow-hidden">
    <Header />
    <div className="flex-1 grid grid-cols-7 ml-6 mr-6">
      <div className="text-white hidden sm:block sm:col-span-1 p-4 overflow-y-auto h-chatHistoryBox ">
        <div className="flex items-center">
          <h1 className="font-medium mb-2">Today</h1>
          <button className="bg-red-700 rounded-md right-0 p-1" onClick={handleDelete}>Delete All</button>
        </div>
        {chatHistory.map((chatMessage, index) => {
          if (chatMessage.sender === 'user'){
            if (chatMessage.clickedInHistory) {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className="border border-gray-200 rounded-md hover:rounded-md mb-3 p-2 truncate hover:cursor-pointer">
                  {chatMessage.text}
                </div>
              )
            }
            else {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className=" border border-transparent hover:border-gray-200 hover:rounded-md hover:cursor-pointer mb-3 p-2 truncate ">
                  {chatMessage.text}
                </div>
              )
            }
          }
      
        })}
      </div>
      <div className="col-span-8 md:col-span-6 sm:pl-[5rem] sm:pr-[5rem] lg:pl-0 lg:pr-0 flex flex-col ">
        <div className="h-chatbox" >
        <div id="chat-box" ref={chatBoxRef} className="flex flex-col bg-white h-[60vh] md:h-[70vh] lg:ml-40 lg:mr-40 overflow-y-auto scrollbar-custom rounded-lg md:w-[63vw] ">
          {chatHistory.map((chatMessage,index) => {
            const minWidth = 100;
            const maxWidth = 500;
            const textWidth = chatMessage.text.length * 10;
            const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
            const containerStyle = {
              maxWidth: `${finalWidth}px`,
            }
            
            // display user messages
            if (chatMessage.sender === 'user') {
              return (
                <div key={index} 
                    ref={(reference) => {
                      if (reference)
                        messageRefs.current[index] = reference as HTMLDivElement;
                    }}
                    className={`mt-5 mb-2 mr-10 ml-auto text-center right-0 border border-blue-500 rounded-lg p-2 bg-white break-words ${chatStyles.talkBubbleUser} ${chatStyles.border} ${chatStyles.triRightOnRightSide}`} 
                    style={containerStyle}>
                  {chatMessage.text}
                </div>
              );
            }

          // display ai messages + image generated
           else {
              return (<div key={index} className="flex flex-row">
                <FaRobot size="30px" className="mt-10 ml-3"/>
                <div className={` mt-5 mb-2 ml-5 max-w-256 border border-blue-500 rounded-lg p-2 bg-white break-words ${chatStyles.talkBubbleAi} ${chatStyles.border} ${chatStyles.triRightOnLeftSide}`}>
                {chatMessage.loading ? (
                <>
                  <div className={`${chatStyles.dot1_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot2_delay } ${chatStyles.loadingAnimation}`}/>
                  <div className={`${chatStyles.dot3_delay } ${chatStyles.loadingAnimation}`}/>
                  
                </>
                )
                   :(<div className="flex flex-col">
                    <TypeWriter text={chatMessage.text} />
                    {chatMessage.imageUrl !== '' && <>
                    <Image src={chatMessage.imageUrl} alt="Generated Image" className="object-cover" width={1024} height={1024} priority />
                    <button onClick={() => downloadImage(chatMessage.imageUrl)} className="bg-downloadBox mt-2 rounded-md font-semibold 0flex justify-center hover:bg-downloadBoxOnHover pt-2 pb-2" style={{width: "238px"}}>Download Image</button>
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
        <div className="flex md:w-[63vw] lg:ml-40 lg:mr-40 ">
            <div className="p-6 flex items-center bg-textBox shadow-lg rounded-md w-full">
              <textarea
              id="message-input"
              placeholder="Type your message..."
              wrap="hard"
              disabled={processingMessage}
              className="w-full h-[100%] md:h-11 ml-5 mr-5 pl-5 pt-2 text-lg rounded-lg overflow-auto break-words whitespace-normal resize-none"
              value={userInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserInput(e.target.value)} 
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)} // Corrected event type here
              />
                <button id="send-btn" onClick={() => sendMessage()} disabled={processingMessage}><AiOutlineSend className={`w-10 h-10 p-[5px] flex items-center justify-center text-white rounded-full border-2 ${userInput ? "bg-black  hover:bg-gray-600" : "bg-gray-300"}`}/></button>
            </div>
        </div>
      </div>
    </div>
  </div>
</main>
  </>
  );


  
}
