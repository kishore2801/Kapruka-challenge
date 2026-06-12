# 🛍️ Kapruka Shopping Assistant with "Kopi" Mascot

Welcome to the **Kapruka AI Shopping Assistant**, a sophisticated e-commerce agent designed to provide seamless, conversational shopping experiences. Built as a portfolio demonstration, this application integrates a rich front-end interface, multilingual AI language models, and Model Context Protocol (MCP) tool-calling to browse and purchase products directly through chat.

## 🌟 Key Features

### 🐿️ Interactive Kopi Mascot
- **Dynamic Empathy**: The custom SVG mascot, Kopi, natively reacts to the conversation state. He waves at the start, bounces playfully while searching, shrugs when he encounters an error, and sits on a delivery truck when confirming shipping dates!
- **Rich User Experience**: Kopi is seamlessly integrated into chat bubbles to provide a human-like, friendly presence rather than a sterile bot icon.

### 🌍 Multilingual & Polyglot Support
- **Native Tongues**: Full, highly-polite conversational support for English, Sinhala (සිංහල), and Tamil (தமிழ்).
- **Transliteration Ready**: Skillfully understands and responds respectfully in **Singlish** and **Tanglish**, complete with local nuances and dialect-specific polite suffixes (e.g. `-nga`).
- **Flexible Interactions**: Seamlessly processes custom tone constraints (e.g., "Speak like a pirate") directly translated into local dialects.

### 🛒 Native Chat Checkout & Cart
- **Persistent Cart Drawer**: Manage your items, increase/decrease quantities with a sleek UI stepper, and easily remove items.
- **Visual Confirmations**: When proceeding to checkout, a beautiful frosted-glass modal provides a horizontal scroll of all product images in your cart before processing.
- **In-Chat Ordering**: The AI utilizes the backend `create_order` tool to fetch your delivery details and processes mock checkouts securely within the chat interface, bypassing the need for external redirects!

### 📦 Dynamic Product Integration
- **Real-Time Catalog**: Integrates with Kapruka's MCP to fetch real-time stock, pricing, and vendor details.
- **Rich Hover Previews**: Hover over any suggested product to reveal a sleek tooltip containing an expanded image, vendor name, stock availability, and a full product description.
- **Live Currency Conversion**: Ask the assistant to quote prices in LKR, USD, GBP, EUR, and more.

---

## 🛠️ Technology Stack

**Frontend:**
- **React 18 + Vite**: High-performance rendering and incredibly fast build times.
- **Vanilla CSS**: Fully customized styling (no CSS frameworks) featuring glassmorphism, smooth micro-animations, and dynamic UI states.
- **Lucide-React**: Clean, lightweight iconography.

**Backend:**
- **FastAPI**: Blazing fast Python backend to manage AI interaction and tool routing.
- **Google Gemini-2.5-Flash**: Cutting-edge LLM handling complex intent mapping, multilingual translation, and autonomous tool chaining.
- **httpx / asyncio**: Asynchronous handling of Kapruka's external MCP server to fetch products without blocking the chat.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Gemini API Key from Google AI Studio.

### 1. Backend Setup
Navigate to the `backend` directory, set up your Python environment, and start the server:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # (On Windows: venv\Scripts\activate)
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your API key:
```env
GEMINI_API_KEY="your_api_key_here"
```

Start the FastAPI server:
```bash
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, install dependencies, and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The application will be running live on `http://localhost:5173`.

---

## 🧠 How the AI Works

The assistant operates using an **Agentic Loop**:
1. It intercepts your message and identifies intent & language.
2. If you are asking for a product, it formulates English arguments and calls the `search_products` tool.
3. The backend executes the API call to Kapruka and feeds the raw markdown response back to the AI.
4. The AI then synthesizes this raw data, formats it into a highly polite, localized response, and sends it to the frontend alongside the structured product cards!

---

*Crafted with precision for an elevated E-Commerce AI experience.*
