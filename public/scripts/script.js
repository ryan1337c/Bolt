// document.addEventListener("DOMContentLoaded", () => {
//   const messageInput = document.getElementById("message-input");
//   const sendButton = document.getElementById("send-btn");
//   const chatBox = document.getElementById("chat-box");
//   const chatBoxHeight = chatBox.offsetHeight;

//   sendButton.addEventListener("click", () => {
//     console.log("click");
//     const messageText = messageInput.value.trim();
//     if (messageText !== "") {
//       // text message
//       const textContainer = document.createElement("div");
//       textContainer.className =
//         "mt-5 mb-5 mr-5 ml-auto text-center right-0 border border-blue-500 rounded-lg p-2 mb-2 bg-gray-100 break-words";
//       textContainer.textContent = messageText;

//       // width reponsiveness to text size
//       const messageContent = textContainer.textContent.trim();
//       const textWidth = messageContent.length * 10;

//       const minWidth = 100;
//       const maxWidth = 500;

//       const finalWidth = Math.min(Math.max(minWidth, textWidth), maxWidth);
//       textContainer.style.width = finalWidth + "px";

//       // Append message to chat box
//       chatBox.appendChild(textContainer);

//       // Clear message
//       messageInput.value = "";

//       // Scroll chat box to the bottom
//       chatBox.scrollTop = chatBox.scrollHeight;
//     }
//   });
// });

// Aligning the user text area (fixed) with the chat box (relative)

function syncFixedToOuter() {
  const outer = document.getElementById('outer');
  const inner = document.getElementById('inner-fixed');
  if (!outer || !inner) return;

  const rect = outer.getBoundingClientRect();
  console.log('outer rect:', rect);  // This will show the outer element's width
  inner.style.left = rect.left + 'px'
  inner.style.width = rect.width + 'px';
  console.log('inner width set to:', inner.style.width);  // This will log the applied width
}

window.addEventListener('load', syncFixedToOuter);
window.addEventListener('resize', syncFixedToOuter)


