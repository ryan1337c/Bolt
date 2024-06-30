"use client"
import Image from "next/image";
import Header from "../components/Header";
import { FaRobot } from "react-icons/fa";
import { useState, useEffect, useRef} from "react";
import { Messages } from "../../pages/messages/assistantMessages";
import axios from 'axios';
import TypeWriter from '../components/TypeWriter';
import chatStyles from './components/chatBubble.module.css'

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
  const [imageCount, setImageCount] = useState<number>(1);
  const messageRefs = useRef<HTMLDivElement[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // chat history stuff
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);

  const generateImage = async() => {
    const response = await fetch('api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${userInput}`
      }),
    })
    const data = await response.json();
    setImage(data.url);
    setUserInput('');
    console.log(data.url);

  }



  // const createImagePlaceholder = () => {

  //     const messageInput = (document.getElementById("message-input") as HTMLInputElement);
  //     const messageText = messageInput?.value.trim();
  //     if (messageText !== '') {
  //       // text message 
  //       const textContainer = document.createElement("div");
  //       textContainer.className="mt-5 mb-5 mr-5 ml-auto text-center right-0 border border-blue-500 rounded-lg p-2 mb-2 bg-gray-100 break-words";
  //       textContainer.textContent = messageText;

  //       // width reponsiveness to text size
  //       const messageContent = textContainer.textContent.trim();
  //       const textWidth = messageContent.length * 10;
        
  //       const minWidth = 100;
  //       const maxWidth = 500;

  //       const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
  //       textContainer.style.width = finalWidth + "px";

  //       // Append message to chat box
  //       chatBox?.appendChild(textContainer);
      
  //       // Generate AI Message
  //       generateAssisantMessage();

  //       // Create and append image to chatbox
  //       const imgContainer = document.createElement("div");
  //       const imgElement = document.createElement("img");
  //       imgElement.src = image;
  //       imgElement.alt = "Generated Image";
  //       imgElement.className = "ml-5 mr-5";

  //       // Download image
  //       imgElement.onload = () => {
  //         const downloadButton = document.createElement("a");
  //         downloadButton.href = image;
  //         downloadButton.download = "image" + imageCount + ".png";
  //         downloadButton.textContent = "Download Image";
  //         downloadButton.className = "bg-downloadBox flex justify-center hover:bg-downloadBoxOnHover ml-5 pt-2 pb-2";

  //         downloadButton.addEventListener("click", () => {
  //           setImageCount(imageCount + 1);
  //         });
          
  //         // set width of donwnload button
  //         downloadButton.style.width = imgElement.clientWidth + "px";

  //         chatBox?.appendChild(downloadButton);
          
  //         // Scroll chat box to the bottom
  //         if (chatBox) 
  //           chatBox.scrollTop = chatBox?.scrollHeight
  //       }

  //       imgContainer.appendChild(imgElement);
  //       chatBox?.appendChild(imgContainer);

  //       // Appends current message to history
  //       // setHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
  //       //   const newHistory = [
  //       //     ...prevHistory,
  //       //     { sender: "user", text: messageText, imageUrl: image }
  //       //   ];
  //       //   return newHistory;
  //       // });

  //       // Clear message
  //       messageInput.value = "";
  //   }
  // }


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

        setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
          return addMessageToHistory(prevHistory, 'user', userInput, image, clicked, false);
        });

        setChatHistory((prevHistory: ChatMessage[]): ChatMessage[] => {
          return addMessageToHistory(prevHistory, 'ai', Messages.imgGeneration, '', false, true);
        });


        const messageInput = (document.getElementById("message-input") as HTMLInputElement);
        messageInput.value = '';
        setUserInput('');

        generateImage();

    }
  }

  const downloadImage = (url: string) => {
     // Create an anchor element
     const downloadLink = document.createElement('a');
     downloadLink.href = url;
     downloadLink.download = `image${imageCount}.png`; // Set the desired filename for download
 
     // Append the anchor element to the DOM
     document.body.appendChild(downloadLink);
 
     // Programmatically trigger the download
     downloadLink.click();
 
     // Clean up: Remove the anchor element from the DOM
     document.body.removeChild(downloadLink);
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current)
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  const scrollToMessage = (index: number) =>  {
    chatHistory[currentHistoryIndex].clickedInHistory = false;
    chatHistory[index].clickedInHistory = true;
    setCurrentHistoryIndex(index);

    const targetMessage = messageRefs.current[index];
    if (targetMessage) {
      targetMessage.scrollIntoView({ behavior: 'smooth'});
    }
  }

  useEffect(() => {
    scrollToBottom();

  }, [chatHistory]);

  useEffect(() => {
    if (image) {
        // update to new image url 
        setChatHistory(prevHistory => {
          const updatedHistory = [...prevHistory];
          const lastMessageIndex = updatedHistory.length - 1;
          updatedHistory[lastMessageIndex] = {
            ...updatedHistory[lastMessageIndex],
            imageUrl: image,
            loading: false,
          };

          setImageCount(imageCount + 1);
          return updatedHistory;
        })
    }
  },[image]);

  return (
    <>
    <main className="font-custom-font bg-green-background h-screen w-full flex flex-col">
    <Header />
    <div className="flex-1 grid grid-cols-7 ml-6 mr-6">
      <div className="col-span-1 border border-gray-600 p-4">
        <h1>Today</h1>
        {chatHistory.map((chatMessage, index) => {
          if (chatMessage.sender === 'user'){
            if (chatMessage.clickedInHistory) {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className="bg-gray-200 rounded-md hover:bg-gray-200 hover:rounded-md mb-3 p-2 truncate">
                  {chatMessage.text}
                </div>
              )
            }
            else {
              return (
                <div key={index} onClick = {() => scrollToMessage(index)} className="hover:bg-gray-200 hover:rounded-md mb-3 p-2 truncate">
                  {chatMessage.text}
                </div>
              )
            }
          }
      
        })}
      </div>
      <div className="col-span-6 border border-gray-600 p-4 flex flex-col">
        <div id="chat-box" className="flex flex-col bg-white h-chatbox ml-40 mr-40 border border-gray-500 overflow-y-auto">
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
                   : (<div className="flex flex-col">
                    
                    <TypeWriter text={Messages.imgGeneration} />
                    <img src={chatMessage.imageUrl} alt="Generated Image" className="object-cover"/>
                    <button onClick={() => downloadImage(chatMessage.imageUrl)} className="bg-downloadBox flex justify-center hover:bg-downloadBoxOnHover pt-2 pb-2" style={{width: "238px"}}>Download Image</button> 
                   </div>)}
                       </div>
                  </div>

              )
            }
           
              })}
          <div ref={messagesEndRef}></div>{/* This div will be scrolled to */}
      
        </div>
        <div className="ml-40 mr-40 flex">
            <div className="p-6 flex items-center bg-textBox shadow-lg rounded-md w-full">
              <FaRobot />
              <input type="text" id="message-input" placeholder="Type your message..." className="w-full ml-5 mr-5 pl-5 pt-2 pb-2 text-lg" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}/>
              <button id="send-btn" onClick={() => sendMessage()}>Send</button>
            </div>
          </div>
      </div>
    </div>
    {/* <script
            dangerouslySetInnerHTML={{
              __html: `
              document.addEventListener("DOMContentLoaded", () => {
                const messageInput = document.getElementById("message-input");
                const sendButton = document.getElementById("send-btn");
                const chatBox = document.getElementById("chat-box");
                const chatBoxHeight = chatBox.offsetHeight;

              sendButton.addEventListener("click", () => {
                  console.log("click");
                  const messageText = messageInput.value.trim();
                  if (messageText !== '') {
                    // text message 
                    const textContainer = document.createElement("div");
                    textContainer.className="mt-5 mb-5 mr-5 ml-auto text-center right-0 border border-blue-500 rounded-lg p-2 mb-2 bg-gray-100 break-words";
                    textContainer.textContent = messageText;

                    // width reponsiveness to text size
                    const messageContent = textContainer.textContent.trim();
                    const textWidth = messageContent.length * 10;
                    
                    const minWidth = 100;
                    const maxWidth = 500;

                    const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
                    textContainer.style.width = finalWidth + "px";

                    // Append message to chat box
                    chatBox.appendChild(textContainer);

                    // Clear message
                    messageInput.value = "";
                    
                    // Scroll chat box to the bottom
                    chatBox.scrollTop = chatBox.scrollHeight;
                    
                  }
                });
              });
                  `,
            }}
          ></script> */}
  </main>
  </>
  );


// .tri-right.border.right-in:before {
// 	content: ' ';
// 	position: absolute;
// 	width: 0;
// 	height: 0;
//   left: auto;
// 	right: -40px;
//   top: 30px;
// 	bottom: auto;
// 	border: 20px solid;
// 	border-color: #666 transparent transparent #666;
// }
// .tri-right.right-in:after{
// 	content: ' ';
// 	position: absolute;
// 	width: 0;
// 	height: 0;
//   left: auto;
// 	right: -20px;
//   top: 38px;
// 	bottom: auto;
// 	border: 12px solid;
// 	border-color: lightyellow transparent transparent lightyellow;
// }
  
}
