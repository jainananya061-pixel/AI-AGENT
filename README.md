# 🤖 NEXORA - Modern Rule-Based AI Chatbot

A complete, responsive, modern Rule-Based AI Chatbot web app built using pure **HTML5, CSS3, and Vanilla JavaScript**.

---

## ✨ Features

- **🎨 Modern Glassmorphic Interface**:
  - Gradient accents, soft ambient glows, smooth pop-in animations.
  - Dark Mode and Light Mode with instant toggle and local storage persistence.
  - Clean avatars for both User and Bot with online/offline status indicators.
  - Live timestamps for every message.

- **💬 Natural Conversation Flow & State**:
  - **Dynamic Greetings**: Welcomes user with time-aware greetings (Good morning / afternoon / evening).
  - **Name Recognition & Memory**: Remembers your name when you say `my name is <name>` or `call me <name>`.
  - **Multi-turn Riddles**: Interactive brain-teasers that wait for your guesses, provide hints, and reveal answers.
  - **Predefined Rule-Based Logic**: Uses clean if-else pattern matching across greetings, identity, humor, time/date, quotes, math evaluation, and tech facts.
  - **Intelligent Fallbacks**: Politely guides the user when an unrecognized query is entered, offering interactive suggestion chips.
  - **Graceful Exit Handling**: Triggers on `exit`, `quit`, `bye`, or `goodbye`, disabling inputs and presenting a sleek "Session Ended" modal with a 1-click restart button.

- **⚡ Interactive Polish**:
  - **Typing Indicator**: Animated 3-dot bouncing bubble simulating natural thinking delays.
  - **Typewriter Effect**: Character-by-character live text streaming for bot replies.
  - **Quick Prompts & Chips**: Carousel of quick replies + in-message clickable suggestion chips.
  - **Synthesized Audio Effects**: Custom Web Audio API sound effects for message send, receive, and exit (toggleable mute/unmute button).
  - **Clear Chat**: One-click reset to start with a fresh slate.
  - **Fully Responsive**: Flawless experience across desktop, tablet, and mobile devices.

---

## 🚀 How to Run

No installations, build steps, or server dependencies required!

### Option 1: Open directly in your browser
Simply double-click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Run via local web server (optional)
In PowerShell or Terminal:
```bash
# Python
python -m http.server 8000

# or Node.js npx
npx serve
```
Then navigate to `http://localhost:8000`.

---

## 📋 Sample Commands to Try

| Category | Example Phrases |
| :--- | :--- |
| **Greetings** | `hello`, `hi`, `good morning`, `hey` |
| **Identity** | `who are you?`, `who made you?`, `what are you?` |
| **Personalize** | `call me Alex`, `my name is Sarah` |
| **Features** | `what can you do?`, `help`, `commands` |
| **Time & Date** | `what time is it?`, `what is today's date?` |
| **Jokes** | `tell me a joke`, `make me laugh` |
| **Riddles** | `tell me a riddle`, `puzzle` |
| **Quotes** | `give me a quote`, `inspire me` |
| **Math** | `calculate 25 * 4`, `what is 100 / 5`, `50 + 20` |
| **Mood** | `how are you?`, `i am sad`, `i feel great` |
| **Exit** | `exit`, `quit`, `bye`, `goodbye` |

---

## 🛠️ File Structure

```
rule_based_chatbot/
├── index.html       # Semantic HTML layout and interface elements
├── style.css        # Responsive CSS, glassmorphism, themes & animations
├── script.js        # Rule-based decision engine, state & typewriter effects
└── README.md        # Documentation and guide
```
