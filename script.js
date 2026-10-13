/**
 * NEXORA - Rule-Based AI Chatbot
 * Vanilla JavaScript Implementation
 */

// ==========================================================================
// 1. State Management & Configuration
// ==========================================================================
const state = {
  userName: null,
  isWaitingForRiddleAnswer: false,
  currentRiddle: null,
  messageCount: 0,
  soundEnabled: true,
  isTyping: false,
  isSessionActive: true,
};

// Knowledge base: Jokes, Quotes, Riddles, and Facts
const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🪲",
  "There are only 10 types of people in the world: those who understand binary, and those who don't. 💻",
  "Why did the JavaScript developer wear glasses? Because they didn't C#! 🤓",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🍺",
  "Why do Java programmers have to wear glasses? Because they don't C#! 👓",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡"
];

const QUOTES = [
  "“Code is like humor. When you have to explain it, it’s bad.” – Cory House",
  "“The best error message is the one that never shows up.” – Thomas Fuchs",
  "“Simplicity is the soul of efficiency.” – Austin Freeman",
  "“Make it work, make it right, make it fast.” – Kent Beck",
  "“Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.” – Patrick McKenzie"
];

const RIDDLES = [
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answers: ["echo", "an echo"],
    hint: "Think of high canyons or empty rooms!"
  },
  {
    question: "What has keys, but no locks; space, but no room; and you can enter, but never go in?",
    answers: ["keyboard", "a keyboard"],
    hint: "You are probably touching one right now!"
  },
  {
    question: "The more of this there is, the less you see. What is it?",
    answers: ["darkness", "dark", "the dark"],
    hint: "It happens when the lights go out."
  },
  {
    question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    answers: ["m", "letter m", "the letter m"],
    hint: "Look closely at the spelling of the words!"
  }
];

// ==========================================================================
// 2. DOM Elements
// ==========================================================================
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const charCounter = document.getElementById('charCounter');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const botStatusText = document.getElementById('botStatusText');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const exitOverlay = document.getElementById('exitOverlay');
const exitMessage = document.getElementById('exitMessage');
const restartChatBtn = document.getElementById('restartChatBtn');
const suggestionChips = document.getElementById('suggestionChips');

// ==========================================================================
// 3. Audio Synth (Web Audio API)
// ==========================================================================
function playTone(type = 'receive') {
  if (!state.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'send') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'receive') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'exit') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    // Audio context may be restricted by browser autoplay policy until user gesture
  }
}

// ==========================================================================
// 4. Helper Functions
// ==========================================================================
function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================================================
// 5. Message Rendering & Typewriter Effect
// ==========================================================================

/**
 * Appends a user message to the chat log.
 */
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `
    <div class="message-avatar user-avatar-small" title="You">
      <i class="fa-solid fa-user"></i>
    </div>
    <div class="message-content-wrapper">
      <div class="message-bubble">
        <p>${escapeHTML(text)}</p>
      </div>
      <div class="message-meta">
        <span>${getFormattedTime()}</span>
        <i class="fa-solid fa-check"></i>
      </div>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
  playTone('send');
}

/**
 * Appends a bot message with optional typing effect and rich formatting.
 */
function appendBotMessage(responseObj, useTypewriter = true) {
  const text = typeof responseObj === 'string' ? responseObj : responseObj.text;
  const chips = typeof responseObj === 'object' && responseObj.chips ? responseObj.chips : [];

  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  const rowId = `bot-msg-${Date.now()}`;
  row.id = rowId;

  row.innerHTML = `
    <div class="message-avatar bot-avatar-small" title="NEXORA">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="message-content-wrapper">
      <div class="message-bubble" id="${rowId}-bubble">
        <!-- Text injected here -->
      </div>
      ${chips.length > 0 ? `
        <div class="bot-reply-chips" id="${rowId}-chips">
          ${chips.map(chip => `<button class="reply-subchip" data-prompt="${escapeHTML(chip)}">${escapeHTML(chip)}</button>`).join('')}
        </div>
      ` : ''}
      <div class="message-meta">
        <span>${getFormattedTime()}</span>
        <span>• NEXORA</span>
      </div>
    </div>
  `;

  chatMessages.appendChild(row);
  scrollToBottom();

  const bubble = document.getElementById(`${rowId}-bubble`);

  if (!useTypewriter) {
    bubble.innerHTML = formatBotHTML(text);
    attachSubchipListeners(row);
    scrollToBottom();
    playTone('receive');
    return;
  }

  // Typewriter effect
  state.isTyping = true;
  toggleInputState(false);

  // We type raw text or parse html incrementally
  let index = 0;
  const tempSpan = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  bubble.appendChild(tempSpan);
  bubble.appendChild(cursor);

  playTone('receive');

  const typingInterval = setInterval(() => {
    if (index < text.length) {
      tempSpan.textContent += text.charAt(index);
      index++;
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      cursor.remove();
      // Render final formatted HTML (preserving markdown formatting like bold, lists, quotes)
      bubble.innerHTML = formatBotHTML(text);
      attachSubchipListeners(row);
      state.isTyping = false;
      toggleInputState(true);
      scrollToBottom();
    }
  }, 14); // smooth typing speed
}

/**
 * Attach listeners to dynamic suggestion chips inside messages.
 */
function attachSubchipListeners(container) {
  const subchips = container.querySelectorAll('.reply-subchip');
  subchips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && state.isSessionActive) {
        processUserMessage(prompt);
      }
    });
  });
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

/**
 * Basic markdown-style parser for bot responses
 */
function formatBotHTML(rawText) {
  let formatted = escapeHTML(rawText);

  // Bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Line breaks to paragraphs
  const paragraphs = formatted.split('\n\n').filter(p => p.trim() !== '');
  if (paragraphs.length > 1) {
    return paragraphs.map(p => {
      // Check for bullet lists
      if (p.includes('\n- ') || p.startsWith('- ')) {
        const items = p.split('\n- ').filter(i => i.trim() !== '');
        const listItems = items.map(item => `<li>${item.replace(/^- /, '')}</li>`).join('');
        return `<ul>${listItems}</ul>`;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  return `<p>${formatted.replace(/\n/g, '<br>')}</p>`;
}

// ==========================================================================
// 6. Rule-Based AI Engine (If-Else & Pattern Matching)
// ==========================================================================

/**
 * Main Rule-Based Decision Logic
 * Analyzes clean input string through structured if-else branches.
 */
function evaluateRuleBasedResponse(input) {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  // Continuous Conversation: Riddle State Check
  if (state.isWaitingForRiddleAnswer && state.currentRiddle) {
    const current = state.currentRiddle;
    if (lower.includes("give up") || lower.includes("tell me") || lower.includes("what is it") || lower.includes("dont know") || lower.includes("don't know")) {
      state.isWaitingForRiddleAnswer = false;
      const answer = current.answers[0];
      state.currentRiddle = null;
      return {
        text: `The answer was: **${answer.toUpperCase()}**! 🎯\n\nNice try! Would you like another riddle or something else?`,
        chips: ["Another riddle", "Tell a joke", "Help"]
      };
    }

    const isCorrect = current.answers.some(ans => lower.includes(ans));
    if (isCorrect) {
      state.isWaitingForRiddleAnswer = false;
      state.currentRiddle = null;
      return {
        text: `🎉 **Bingo! You got it right!**\nThe answer is indeed **${current.answers[0]}**.\n\nYou have sharp wit! What should we do next?`,
        chips: ["Another riddle", "Tell me a joke", "Daily Quote"]
      };
    } else {
      return {
        text: `Not quite! 💡 **Hint:** ${current.hint}\n\nTry another guess, or type **"give up"** if you want the answer!`,
        chips: ["Give up", "Tell me a joke"]
      };
    }
  }

  // 1. Exit Commands
  if (
    lower === "exit" ||
    lower === "quit" ||
    lower === "bye" ||
    lower === "goodbye" ||
    lower === "close" ||
    lower === "see you" ||
    lower.startsWith("bye ") ||
    lower.startsWith("exit ")
  ) {
    return { isExit: true };
  }

  // 2. Greetings
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower === "hey" ||
    lower === "hola" ||
    lower === "namaste" ||
    lower === "sup" ||
    lower.startsWith("hi ") ||
    lower.startsWith("hello ") ||
    lower.startsWith("hey ") ||
    lower.includes("good morning") ||
    lower.includes("good afternoon") ||
    lower.includes("good evening")
  ) {
    const timeGreeting = getTimeOfDayGreeting();
    const namePrefix = state.userName ? `, **${state.userName}**` : "";
    return {
      text: `${timeGreeting}${namePrefix}! 👋\n\nI'm **NEXORA**, your rule-based AI companion. How can I help you today?`,
      chips: ["What can you do?", "Tell me a joke", "What's the time?", "Help"]
    };
  }

  // 3. User Name Introduction / Remembrance
  if (
    lower.startsWith("my name is ") ||
    lower.startsWith("call me ") ||
    lower.startsWith("i am ") && lower.split(" ").length <= 4
  ) {
    let name = "";
    if (lower.startsWith("my name is ")) {
      name = raw.slice(11).trim();
    } else if (lower.startsWith("call me ")) {
      name = raw.slice(8).trim();
    } else if (lower.startsWith("i am ")) {
      name = raw.slice(5).trim();
    }

    // Clean punctuation
    name = name.replace(/[.!?,]/g, '');
    if (name.length > 0) {
      state.userName = name;
      return {
        text: `Delighted to meet you, **${state.userName}**! ✨\n\nI will remember your name for this session. What would you like to explore?`,
        chips: ["What can you do?", "Tell me a joke", "Daily Quote"]
      };
    }
  }

  // 4. Identity & Creator Questions
  if (
    lower.includes("who are you") ||
    lower.includes("what are you") ||
    lower.includes("your name") ||
    lower.includes("who created you") ||
    lower.includes("who made you")
  ) {
    return {
      text: `I am **NEXORA** 🤖, a deterministic, rule-based AI assistant built with pure **HTML, CSS, and JavaScript**.\n\nI operate on conditional if-else logic, state management, and keyword processing to give you fast, reliable, and instant responses without needing heavy server models!`,
      chips: ["What can you do?", "Show commands", "Tell a joke"]
    };
  }

  // 5. Capabilities & Features
  if (
    lower.includes("what can you do") ||
    lower.includes("capabilities") ||
    lower.includes("features") ||
    lower.includes("skills") ||
    lower.includes("what are your features")
  ) {
    return {
      text: `Here is what I can do for you right now:\n\n` +
            `• ⏰ **Time & Date:** Check current live clock & calendar\n` +
            `• 😂 **Humor & Jokes:** Lighthearted programming & dad jokes\n` +
            `• 🧩 **Interactive Riddles:** Test your mind with brain teasers\n` +
            `• ✨ **Inspiration:** Motivational tech quotes & wisdom\n` +
            `• 🔢 **Calculations:** Solve math like \`calculate 25 * 4\`\n` +
            `• 🌦️ **Weather Advice:** Practical weather guidance\n` +
            `• 👤 **Personalization:** Remember your name\n` +
            `• 🚪 **Session Management:** Graceful exit handling`,
      chips: ["Tell a riddle", "Calculate 15 * 8", "Current time", "Exit"]
    };
  }

  // 6. Time and Date
  if (
    lower.includes("time") ||
    lower.includes("what time is it") ||
    lower.includes("current time") ||
    lower.includes("clock")
  ) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      text: `🕒 Right now the current time is **${timeStr}**.`,
      chips: ["What is today's date?", "Tell me a joke", "Help"]
    };
  }

  if (
    lower.includes("date") ||
    lower.includes("what is today") ||
    lower.includes("today's date") ||
    lower.includes("day is today") ||
    lower.includes("calendar")
  ) {
    const dateStr = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return {
      text: `📅 Today is **${dateStr}**.`,
      chips: ["What time is it?", "Daily Quote", "Help"]
    };
  }

  // 7. Jokes & Humor
  if (
    lower.includes("joke") ||
    lower.includes("funny") ||
    lower.includes("make me laugh") ||
    lower.includes("laugh")
  ) {
    const randomJoke = JOKES[Math.floor(Math.random() * JOKES.length)];
    return {
      text: `Here is a good one for you:\n\n${randomJoke}`,
      chips: ["Another joke", "Tell me a riddle", "Daily Quote"]
    };
  }

  // 8. Interactive Riddles
  if (
    lower.includes("riddle") ||
    lower.includes("puzzle") ||
    lower.includes("brain teaser") ||
    lower === "another riddle"
  ) {
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    state.isWaitingForRiddleAnswer = true;
    state.currentRiddle = riddle;
    return {
      text: `🧩 **Riddle Time:**\n\n"${riddle.question}"\n\nType your answer in the chat or type **"give up"** to reveal the answer!`,
      chips: ["Give up", "Tell me a hint"]
    };
  }

  // 9. Quotes & Motivation
  if (
    lower.includes("quote") ||
    lower.includes("motivat") ||
    lower.includes("inspire") ||
    lower.includes("wisdom") ||
    lower.includes("daily quote")
  ) {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return {
      text: `✨ **Inspiring Thought:**\n\n${randomQuote}`,
      chips: ["Another quote", "Tell a joke", "Help"]
    };
  }

  // 10. Math & Calculator Evaluation
  if (
    lower.startsWith("calculate ") ||
    lower.startsWith("calc ") ||
    lower.startsWith("what is ") && /\d/.test(lower) ||
    /^[0-9\s\+\-\*\/\(\)\.\^]+$/.test(raw)
  ) {
    let expression = raw
      .replace(/calculate/i, '')
      .replace(/calc/i, '')
      .replace(/what is/i, '')
      .replace(/x/g, '*')
      .trim();

    try {
      // Safe sanitizer: allow only numbers and basic math symbols
      if (/^[0-9\s\+\-\*\/\(\)\.\%]+$/.test(expression)) {
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${expression})`)();
        if (result !== undefined && !isNaN(result)) {
          return {
            text: `🧮 **Calculation Result:**\n\`${expression}\` = **${result}**`,
            chips: ["Calculate 100 / 4", "Tell a joke", "Help"]
          };
        }
      }
    } catch (e) {
      return {
        text: `I couldn't calculate that math expression. Please use standard formats like: \`calculate 45 * 2\` or \`12 + 34\`.`,
        chips: ["Calculate 50 * 3", "Help"]
      };
    }
  }

  // 11. Weather Inquiries
  if (
    lower.includes("weather") ||
    lower.includes("temperature") ||
    lower.includes("forecast") ||
    lower.includes("rain") ||
    lower.includes("sunny")
  ) {
    return {
      text: `☀️ Since I am running offline in your local browser sandbox, I don't tap into live satellite telemetry, but remember:\n\n*“No matter what the forecast says outside, always bring your own sunshine and stay hydrated!”* 💧\n\nLooking for live info? You can check [Weather.com](https://weather.com)!`,
      chips: ["What time is it?", "Tell me a joke", "Daily Quote"]
    };
  }

  // 12. Emotional & Well-Being Queries
  if (
    lower.includes("how are you") ||
    lower.includes("how're you") ||
    lower.includes("how do you do")
  ) {
    return {
      text: `I'm operating at 100% computational efficiency, thank you for asking! ⚡\n\nMore importantly, how are you feeling today?`,
      chips: ["I'm feeling good!", "I'm feeling tired", "Tell me a joke"]
    };
  }

  if (
    lower.includes("sad") ||
    lower.includes("unhappy") ||
    lower.includes("depressed") ||
    lower.includes("stressed") ||
    lower.includes("tired")
  ) {
    return {
      text: `I'm sorry to hear that. 💙 Remember to take a deep breath, step away from screens for a few minutes, and drink some water.\n\nWould a funny joke or an inspiring quote help cheer you up?`,
      chips: ["Tell me a joke", "Daily Quote", "Tell a riddle"]
    };
  }

  if (
    lower.includes("happy") ||
    lower.includes("great") ||
    lower.includes("good") ||
    lower.includes("awesome") ||
    lower.includes("fantastic")
  ) {
    return {
      text: `That's wonderful to hear! 🌟 Keep that positive momentum going! What would you like to explore next?`,
      chips: ["Tell a riddle", "Give me a quote", "What can you do?"]
    };
  }

  // 13. Gratitude & Pleasantries
  if (
    lower.includes("thank you") ||
    lower.includes("thanks") ||
    lower.includes("thx") ||
    lower.includes("appreciate")
  ) {
    const namePrefix = state.userName ? `, **${state.userName}**` : "";
    return {
      text: `You're very welcome${namePrefix}! 😊 Happy to assist. Is there anything else you need?`,
      chips: ["What can you do?", "Help", "Exit"]
    };
  }

  // 14. Technology / Web Dev Questions
  if (
    lower.includes("javascript") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("python") ||
    lower.includes("coding")
  ) {
    return {
      text: `💻 **Tech Insights:**\n\n` +
            `• **HTML5:** The skeletal structure of the web.\n` +
            `• **CSS3:** The aesthetic styling, animations, and responsive layout.\n` +
            `• **JavaScript:** The dynamic brain making web pages interactive (just like me!).`,
      chips: ["Tell a joke", "What can you do?", "Help"]
    };
  }

  // 15. Help & Command Guide
  if (
    lower === "help" ||
    lower.includes("commands") ||
    lower.includes("options") ||
    lower.includes("menu") ||
    lower.includes("guide")
  ) {
    return {
      text: `📚 **NEXORA Command Directory:**\n\n` +
            `• **Greetings:** \`hello\`, \`hi\`, \`good morning\`\n` +
            `• **Identity:** \`who are you\`, \`who made you\`\n` +
            `• **Personalize:** \`my name is <name>\`, \`call me <name>\`\n` +
            `• **Time & Date:** \`time\`, \`date\`, \`what day is it\`\n` +
            `• **Entertainment:** \`joke\`, \`riddle\`, \`quote\`\n` +
            `• **Calculation:** \`calculate 50 * 4\`, \`12 + 8\`\n` +
            `• **Feelings:** \`how are you\`, \`i am sad\`, \`i am happy\`\n` +
            `• **Session Exit:** \`exit\`, \`bye\`, \`quit\``,
      chips: ["Tell me a joke", "What time is it?", "Exit"]
    };
  }

  // 16. Fallback Response for Unknown Queries
  const fallbacks = [
    `I'm not quite sure how to answer that yet 🤔. Remember, I run on rule-based logic! Try asking something from my command guide.`,
    `Hmm, that's beyond my current rule set! 📖 Type **"help"** to see all the questions I can answer.`,
    `I didn't quite catch that. Would you like a joke, current time, or an inspiring quote instead?`
  ];
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  return {
    text: randomFallback,
    chips: ["Help", "What can you do?", "Tell me a joke", "Exit"]
  };
}

// ==========================================================================
// 7. Message Pipeline & User Input Handler
// ==========================================================================
function processUserMessage(rawText) {
  if (!state.isSessionActive || state.isTyping) return;
  const text = rawText.trim();
  if (!text) return;

  state.messageCount++;

  // 1. Render user message
  appendUserMessage(text);

  // 2. Clear input
  userInput.value = '';
  charCounter.textContent = '0/500';

  // 3. Show typing indicator
  showTypingIndicator();

  // 4. Calculate realistic delay (500ms - 900ms) for natural feel
  const delay = Math.min(1000, 450 + Math.random() * 450);

  setTimeout(() => {
    hideTypingIndicator();

    // Evaluate rules
    const response = evaluateRuleBasedResponse(text);

    if (response.isExit) {
      handleExitCommand();
    } else {
      appendBotMessage(response, true);
    }
  }, delay);
}

function showTypingIndicator() {
  typingIndicator.classList.remove('hidden');
  botStatusText.textContent = "Typing...";
  scrollToBottom();
}

function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
  botStatusText.textContent = state.isSessionActive ? "Active & Ready to chat" : "Offline";
}

function toggleInputState(enabled) {
  userInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
  if (enabled) {
    userInput.focus();
  }
}

// ==========================================================================
// 8. Exit & Session Lifecycle
// ==========================================================================
function handleExitCommand() {
  state.isSessionActive = false;
  playTone('exit');

  const farewell = state.userName
    ? `Goodbye, **${state.userName}**! It was a pleasure chatting with you. Have a wonderful day ahead! 👋`
    : `Goodbye! Thank you for spending time chatting with NEXORA. Have a wonderful day ahead! 👋`;

  appendBotMessage({ text: farewell, chips: [] }, true);

  // Update status UI
  const statusIndicator = document.querySelector('.status-indicator');
  if (statusIndicator) {
    statusIndicator.classList.remove('online');
    statusIndicator.classList.add('offline');
    statusIndicator.title = "Status: Offline";
  }
  botStatusText.textContent = "Session Ended";
  toggleInputState(false);

  // Show exit modal overlay after brief delay
  setTimeout(() => {
    exitOverlay.classList.remove('hidden');
    exitMessage.textContent = state.userName 
      ? `Goodbye ${state.userName}! You have safely concluded this session.`
      : "You have safely ended this conversation. Click below whenever you want to chat again!";
  }, 1600);
}

function restartChat() {
  state.isSessionActive = true;
  state.isWaitingForRiddleAnswer = false;
  state.currentRiddle = null;
  state.messageCount = 0;

  exitOverlay.classList.add('hidden');
  chatMessages.innerHTML = '';

  const statusIndicator = document.querySelector('.status-indicator');
  if (statusIndicator) {
    statusIndicator.classList.remove('offline');
    statusIndicator.classList.add('online');
    statusIndicator.title = "Status: Online";
  }
  botStatusText.textContent = "Active & Ready to chat";
  toggleInputState(true);

  // Send Initial Greeting
  sendGreeting();
}

// ==========================================================================
// 9. Initial Greeting Message
// ==========================================================================
function sendGreeting() {
  const timeGreeting = getTimeOfDayGreeting();
  const greetingText = `👋 **${timeGreeting}! Welcome to NEXORA!**\n\n` +
    `I am your interactive **Rule-Based AI Chatbot**. I can tell jokes, test your wit with riddles, tell the time, calculate math, and share inspiring quotes.\n\n` +
    `Try asking me something or pick one of the suggestions below!`;

  setTimeout(() => {
    appendBotMessage({
      text: greetingText,
      chips: ["What can you do?", "Tell me a joke", "What's the time?", "Help"]
    }, false);
  }, 300);
}

// ==========================================================================
// 10. Event Listeners
// ==========================================================================

// Form submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  processUserMessage(userInput.value);
});

// Character counter
userInput.addEventListener('input', () => {
  const count = userInput.value.length;
  charCounter.textContent = `${count}/500`;
});

// Suggestion chips at bottom
suggestionChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip && state.isSessionActive && !state.isTyping) {
    const prompt = chip.getAttribute('data-prompt');
    if (prompt) {
      processUserMessage(prompt);
    }
  }
});

// Clear Chat Button
clearChatBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear the entire chat history?")) {
    chatMessages.innerHTML = '';
    state.isWaitingForRiddleAnswer = false;
    state.currentRiddle = null;
    sendGreeting();
  }
});

// Sound Toggle Button
soundToggleBtn.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggleBtn.innerHTML = state.soundEnabled 
    ? '<i class="fa-solid fa-volume-high"></i>'
    : '<i class="fa-solid fa-volume-xmark"></i>';
  soundToggleBtn.title = state.soundEnabled ? "Mute Sound" : "Enable Sound";
  if (state.soundEnabled) playTone('receive');
});

// Theme Toggle Button
themeToggleBtn.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-theme');
  themeToggleBtn.innerHTML = isLight 
    ? '<i class="fa-solid fa-moon"></i>'
    : '<i class="fa-solid fa-sun"></i>';
  themeToggleBtn.title = isLight ? "Switch to Dark Theme" : "Switch to Light Theme";
  localStorage.setItem('nexora_theme', isLight ? 'light' : 'dark');
});

// Restart Chat from Exit Modal
restartChatBtn.addEventListener('click', () => {
  restartChat();
});

// Load saved theme preference
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('nexora_theme') || localStorage.getItem('aurabot_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
  sendGreeting();
  userInput.focus();
});
