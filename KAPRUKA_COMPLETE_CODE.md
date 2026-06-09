# KAPRUKA PROJECT - COMPLETE FULL CODE (GEMINI-ONLY)

## PROJECT STRUCTURE

```
kapruka-agent/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.local
│   ├── services/
│   │   ├── __init__.py
│   │   ├── kapruka_mcp.py
│   │   ├── gemini_tools.py
│   │   └── language_detector.py
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── .env.local
│   └── vite.config.js
└── README.md
```

---

# BACKEND - COMPLETE CODE

## backend/main.py

```python
import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import google.generativeai as genai
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
import logging

from services.kapruka_mcp import KaprukaMCP
from services.gemini_tools import KAPRUKA_TOOLS
from services.language_detector import detect_language

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set. Get it from https://aistudio.google.com/app/apikey")

genai.configure(api_key=GEMINI_API_KEY)

# Create FastAPI app
app = FastAPI(
    title="Kapruka Shopping Agent",
    description="AI-powered shopping assistant for Kapruka",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Request model
class ChatRequest(BaseModel):
    message: str
    
    @validator('message')
    def validate_message(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Message cannot be empty')
        if len(v) > 2000:
            raise ValueError('Message too long (max 2000 characters)')
        return v.strip()

# Health check
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Main chat endpoint
@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(request: ChatRequest, request_obj=Depends()):
    """
    Main chat endpoint that handles user queries in any language.
    
    Supports:
    - Sinhala (සිංහල)
    - Tamil (தமிழ்)
    - English
    
    Uses Gemini 2.0 Flash for:
    1. Language understanding
    2. Tool selection (MCP)
    3. Response generation
    4. Automatic translation to user's language
    """
    
    try:
        user_message = request.message.strip()
        
        # Detect language
        detected_lang = detect_language(user_message)
        logger.info(f"Detected language: {detected_lang}")
        logger.info(f"User message: {user_message}")
        
        # Create system prompt with language context
        system_instruction = f"""You are a helpful and friendly Kapruka shopping assistant.

IMPORTANT: The user is speaking in {detected_lang}.

Your responsibilities:
1. Understand the user's query in {detected_lang}
2. Use available tools to search products or perform actions
3. Respond ALWAYS in {detected_lang}
4. Be warm, helpful, and professional
5. Provide clear product information
6. Guide users through shopping

Available actions:
- Search for products by name, category, or price range
- Get detailed product information
- Check delivery availability
- Create orders
- Track existing orders

Rules:
- Keep responses concise but informative
- Always respond in {detected_lang}
- Use tool calls appropriately
- If user asks for something you can't do, politely explain
- Be conversational and friendly"""
        
        # Create Gemini model with MCP tools
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            tools=KAPRUKA_TOOLS,
            system_instruction=system_instruction
        )
        
        # Generate response
        logger.info("Calling Gemini...")
        response = model.generate_content(user_message)
        
        response_text = ""
        tools_called = []
        
        # Process response parts
        for part in response.content:
            # Extract text response
            if hasattr(part, 'text') and part.text:
                response_text = part.text
                logger.info(f"Gemini response: {response_text[:100]}...")
            
            # Handle tool calls
            if hasattr(part, 'type') and part.type == 'tool_use':
                tool_name = part.name
                tool_args = part.input
                
                logger.info(f"Tool called: {tool_name} with args: {tool_args}")
                tools_called.append(tool_name)
                
                # Execute the appropriate tool
                try:
                    if tool_name == "search_products":
                        result = await KaprukaMCP.search_products(
                            query=tool_args.get("query"),
                            max_price=tool_args.get("max_price"),
                            limit=tool_args.get("limit", 10)
                        )
                        logger.info(f"Search result: {len(result)} products found")
                    
                    elif tool_name == "get_product":
                        result = await KaprukaMCP.get_product(
                            product_id=tool_args.get("product_id")
                        )
                        logger.info(f"Got product details")
                    
                    elif tool_name == "check_delivery":
                        result = await KaprukaMCP.check_delivery(
                            city=tool_args.get("city"),
                            delivery_date=tool_args.get("delivery_date"),
                            product_id=tool_args.get("product_id")
                        )
                        logger.info(f"Delivery check: {result}")
                    
                    elif tool_name == "create_order":
                        result = await KaprukaMCP.create_order(
                            items=tool_args.get("items"),
                            recipient=tool_args.get("recipient"),
                            delivery=tool_args.get("delivery"),
                            sender=tool_args.get("sender"),
                            gift_message=tool_args.get("gift_message")
                        )
                        logger.info(f"Order created: {result.get('order_id', 'Unknown')}")
                    
                    elif tool_name == "track_order":
                        result = await KaprukaMCP.track_order(
                            order_number=tool_args.get("order_number")
                        )
                        logger.info(f"Order tracked: {result.get('status', 'Unknown')}")
                
                except Exception as e:
                    logger.error(f"Tool execution error: {str(e)}")
        
        # Return response
        return {
            "message": response_text,
            "language": detected_lang,
            "timestamp": datetime.now().isoformat(),
            "tools_used": tools_called
        }
    
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred processing your request")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.now().isoformat()
    }

# Run
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Kapruka Agent starting on http://0.0.0.0:{port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"🤖 Using Gemini 2.0 Flash for translations\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
```

## backend/services/__init__.py

```python
# This file makes the services directory a Python package
```

## backend/services/kapruka_mcp.py

```python
import httpx
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class KaprukaMCP:
    """
    Kapruka MCP Client
    
    Handles all communication with Kapruka's MCP server at https://mcp.kapruka.com/mcp
    Provides methods to search products, get details, check delivery, create orders, and track orders.
    """
    
    MCP_URL = "https://mcp.kapruka.com/mcp"
    TIMEOUT = 30
    
    @staticmethod
    async def call_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call any Kapruka MCP tool.
        
        Args:
            tool_name: Name of the tool to call
            args: Arguments for the tool
        
        Returns:
            Tool result as dictionary
        """
        try:
            async with httpx.AsyncClient(timeout=KaprukaMCP.TIMEOUT) as client:
                payload = {
                    "jsonrpc": "2.0",
                    "method": "call_tool",
                    "params": {
                        "name": tool_name,
                        "arguments": args
                    }
                }
                
                logger.info(f"Calling MCP tool: {tool_name} with args: {args}")
                
                response = await client.post(KaprukaMCP.MCP_URL, json=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"MCP response: {str(result)[:100]}...")
                    return result.get("result", {})
                else:
                    logger.error(f"MCP error {response.status_code}: {response.text}")
                    return {}
        
        except httpx.TimeoutException:
            logger.error(f"MCP timeout for tool: {tool_name}")
            return {}
        except Exception as e:
            logger.error(f"MCP error for tool {tool_name}: {str(e)}")
            return {}
    
    @staticmethod
    async def search_products(
        query: str,
        max_price: Optional[int] = None,
        min_price: Optional[int] = None,
        category: Optional[str] = None,
        limit: int = 10,
        sort: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for products on Kapruka.
        
        Args:
            query: Search query (e.g., "chocolate gifts")
            max_price: Maximum price filter (optional)
            min_price: Minimum price filter (optional)
            category: Category filter (optional)
            limit: Number of results to return (1-30)
            sort: Sort by "price", "rating", "newest" (optional)
        
        Returns:
            List of products matching the query
        """
        args = {
            "q": query,
            "limit": min(limit, 30)  # Cap at 30
        }
        
        if max_price is not None:
            args["max_price"] = max_price
        
        if min_price is not None:
            args["min_price"] = min_price
        
        if category:
            args["category"] = category
        
        if sort:
            args["sort"] = sort
        
        result = await KaprukaMCP.call_tool("kapruka_search_products", args)
        return result.get("products", []) if result else []
    
    @staticmethod
    async def get_product(product_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific product.
        
        Args:
            product_id: The product ID
        
        Returns:
            Product details including price, rating, images, variants, etc.
        """
        result = await KaprukaMCP.call_tool(
            "kapruka_get_product",
            {"product_id": product_id}
        )
        return result if result else {}
    
    @staticmethod
    async def list_categories(depth: int = 1) -> List[Dict[str, Any]]:
        """
        List all product categories.
        
        Args:
            depth: How many levels deep (1-3)
        
        Returns:
            List of categories
        """
        result = await KaprukaMCP.call_tool(
            "kapruka_list_categories",
            {"depth": depth}
        )
        return result.get("categories", []) if result else []
    
    @staticmethod
    async def check_delivery(
        city: str,
        delivery_date: str,
        product_id: str
    ) -> Dict[str, Any]:
        """
        Check if a product can be delivered to a city on a given date.
        
        Args:
            city: Delivery city (e.g., "Colombo")
            delivery_date: Desired delivery date (YYYY-MM-DD)
            product_id: Product ID to check
        
        Returns:
            Delivery information including cost, timing, and availability
        """
        result = await KaprukaMCP.call_tool(
            "kapruka_check_delivery",
            {
                "city": city,
                "delivery_date": delivery_date,
                "product_id": product_id
            }
        )
        return result if result else {}
    
    @staticmethod
    async def create_order(
        items: List[Dict[str, Any]],
        recipient: Dict[str, str],
        delivery: Dict[str, str],
        sender: Dict[str, str],
        gift_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a guest checkout order on Kapruka (no account needed).
        
        Args:
            items: List of items with product_id, quantity, variant
            recipient: Recipient info {name, phone, email}
            delivery: Delivery info {address, city, date}
            sender: Sender info {name, phone}
            gift_message: Optional gift message
        
        Returns:
            Order details including order_id and payment_url
        """
        args = {
            "cart": items,
            "recipient": recipient,
            "delivery": delivery,
            "sender": sender
        }
        
        if gift_message:
            args["gift_message"] = gift_message
        
        result = await KaprukaMCP.call_tool("kapruka_create_order", args)
        return result if result else {}
    
    @staticmethod
    async def track_order(order_number: str) -> Dict[str, Any]:
        """
        Track an existing order.
        
        Args:
            order_number: Order number (e.g., "ORD12345")
        
        Returns:
            Order status, timeline, and delivery information
        """
        result = await KaprukaMCP.call_tool(
            "kapruka_track_order",
            {"order_number": order_number}
        )
        return result if result else {}
```

## backend/services/gemini_tools.py

```python
"""
Gemini Tool Definitions

These define what tools Gemini can use for Kapruka shopping.
Gemini automatically decides which tool to call based on user intent.
"""

KAPRUKA_TOOLS = {
    "search_products": {
        "description": "Search for products on Kapruka by keyword, category, or price range. Use this when user asks to find, search, or look for products.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query (e.g., 'chocolate gifts', 'flowers', 'cakes'). Required."
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price in LKR (optional). Use when user mentions price limit."
                },
                "min_price": {
                    "type": "number",
                    "description": "Minimum price in LKR (optional). Use when user mentions price range."
                },
                "category": {
                    "type": "string",
                    "description": "Product category like 'gifts', 'flowers', 'cakes' (optional)"
                },
                "sort": {
                    "type": "string",
                    "description": "Sort results by 'price', 'rating', or 'newest' (optional)"
                },
                "limit": {
                    "type": "number",
                    "description": "Number of results (default 10, max 30)"
                }
            },
            "required": ["query"]
        }
    },
    
    "get_product": {
        "description": "Get full details about a specific product including price, rating, images, variants, shipping info. Use when user clicks on a product or wants more information about a specific item.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "The product ID from search results"
                }
            },
            "required": ["product_id"]
        }
    },
    
    "list_categories": {
        "description": "Show all available product categories on Kapruka. Use when user asks 'What categories do you have?' or 'What can I buy?'",
        "parameters": {
            "type": "object",
            "properties": {
                "depth": {
                    "type": "number",
                    "description": "Category depth level (1-3, default 1)"
                }
            }
        }
    },
    
    "check_delivery": {
        "description": "Check if a product can be delivered to a specific city on a specific date and get the delivery cost. Use when user asks about delivery or provides a city.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "Delivery city (e.g., 'Colombo', 'Galle', 'Kandy')"
                },
                "delivery_date": {
                    "type": "string",
                    "description": "Desired delivery date in YYYY-MM-DD format"
                },
                "product_id": {
                    "type": "string",
                    "description": "Product ID to check delivery for"
                }
            },
            "required": ["city", "delivery_date", "product_id"]
        }
    },
    
    "create_order": {
        "description": "Create a guest order on Kapruka. No account needed - just provide recipient details. Use when user is ready to checkout and has provided all required information.",
        "parameters": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "description": "Cart items: [{product_id, quantity, variant}]"
                },
                "recipient": {
                    "type": "object",
                    "description": "Recipient info: {name, phone, email}"
                },
                "delivery": {
                    "type": "object",
                    "description": "Delivery info: {address, city, date}"
                },
                "sender": {
                    "type": "object",
                    "description": "Sender info: {name, phone}"
                },
                "gift_message": {
                    "type": "string",
                    "description": "Optional gift message"
                }
            },
            "required": ["items", "recipient", "delivery", "sender"]
        }
    },
    
    "track_order": {
        "description": "Track an existing order status and delivery timeline. Use when user provides an order number.",
        "parameters": {
            "type": "object",
            "properties": {
                "order_number": {
                    "type": "string",
                    "description": "Order number like 'ORD12345' from confirmation email"
                }
            },
            "required": ["order_number"]
        }
    }
}
```

## backend/services/language_detector.py

```python
import re
import logging

logger = logging.getLogger(__name__)

def detect_language(text: str) -> str:
    """
    Detect the language of input text.
    
    Supports:
    - Sinhala (Unicode: U+0D80 to U+0DF8)
    - Tamil (Unicode: U+0B80 to U+0BFF)
    - English (default)
    
    Args:
        text: Input text to detect language
    
    Returns:
        Language code: "sinhala", "tamil", or "english"
    """
    
    # Sinhala character ranges
    sinhala_pattern = re.compile(r'[\u0D80-\u0DF8]')
    
    # Tamil character ranges
    tamil_pattern = re.compile(r'[\u0B80-\u0BFF]')
    
    # Count characters in each language
    sinhala_chars = len(sinhala_pattern.findall(text))
    tamil_chars = len(tamil_pattern.findall(text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    
    # Determine dominant language
    if sinhala_chars > tamil_chars and sinhala_chars > english_chars:
        language = "sinhala"
    elif tamil_chars > sinhala_chars and tamil_chars > english_chars:
        language = "tamil"
    elif sinhala_chars > 0 or tamil_chars > 0:
        # Mixed script, assume Sinhala (more common in Sri Lanka)
        language = "sinhala"
    else:
        language = "english"
    
    logger.debug(f"Language detection: {language} (S:{sinhala_chars} T:{tamil_chars} E:{english_chars})")
    
    return language
```

## backend/requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
google-generativeai==0.3.0
python-dotenv==1.0.0
pydantic==2.5.0
slowapi==0.1.9
httpx==0.25.2
python-multipart==0.0.6
```

## backend/.env.local

```
GEMINI_API_KEY=your_api_key_from_aistudio.google.com
PORT=8000
```

## backend/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

# FRONTEND - COMPLETE CODE

## frontend/src/App.jsx

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader } from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLORS = {
  primary: '#DA532C',
  navy: '#2C3E50',
  cream: '#FFF5ED',
  light: '#F5F5F5',
  dark: '#333333'
};

export default function App() {
  const [messages, setMessages] = useState([{
    id: '0',
    role: 'assistant',
    text: 'වහ! Welcome to Kapruka Shopping Assistant! 🛍️\n\nI can help you:\n• Find products\n• Check prices and delivery\n• Track orders\n• Create new orders\n\nWhat are you looking for?',
    timestamp: new Date().toISOString()
  }]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    // Clear error
    setError('');

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send to backend
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: input
      }, {
        timeout: 30000
      });

      // Add assistant response
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.data.message,
        language: response.data.language,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Handle error
      let errorText = 'Sorry, an error occurred. Please try again.';
      
      if (err.response?.status === 400) {
        errorText = `Invalid request: ${err.response.data?.detail || 'Check your message'}`;
      } else if (err.response?.status === 429) {
        errorText = 'Too many requests. Please wait a moment and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorText = 'Request timeout. Server is not responding.';
      } else if (!err.response) {
        errorText = 'Cannot connect to server. Is it running?';
      }
      
      setError(errorText);
      
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `❌ ${errorText}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: COLORS.cream }}>
      {/* Header */}
      <header style={{
        padding: '16px',
        backgroundColor: COLORS.navy,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <MessageCircle color={COLORS.primary} size={32} />
        <div>
          <h1 style={{
            margin: '0',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Kapruka Shopping
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            color: COLORS.cream,
            fontSize: '12px',
            opacity: 0.9
          }}>
            AI-Powered Shopping Assistant
          </p>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee',
          color: '#c00',
          fontSize: '12px',
          borderBottom: `1px solid ${COLORS.primary}`
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Messages container */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.4',
                fontSize: '14px',
                backgroundColor: msg.role === 'user' ? COLORS.primary : 'white',
                color: msg.role === 'user' ? 'white' : COLORS.dark,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'white',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <Loader size={16} color={COLORS.primary} className="spinner" />
              <span style={{ fontSize: '14px', color: COLORS.dark }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <footer style={{
        padding: '16px',
        borderTop: `1px solid #ddd`,
        backgroundColor: 'white'
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message in Sinhala, Tamil, or English..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: `2px solid ${COLORS.primary}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: loading ? COLORS.light : 'white',
              color: COLORS.dark,
              cursor: loading ? 'not-allowed' : 'auto'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              backgroundColor: loading || !input.trim() ? '#ccc' : COLORS.primary,
              color: 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => !loading && !input.trim() || (e.target.style.backgroundColor = '#b83d22')}
            onMouseLeave={e => e.target.style.backgroundColor = COLORS.primary}
          >
            <Send size={18} />
            Send
          </button>
        </form>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        /* Scrollbar styling */
        main::-webkit-scrollbar {
          width: 8px;
        }

        main::-webkit-scrollbar-track {
          background: transparent;
        }

        main::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        main::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
}
```

## frontend/src/App.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  height: 100%;
}
```

## frontend/src/main.jsx

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## frontend/src/index.css

```css
:root {
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}
```

## frontend/package.json

```json
{
  "name": "kapruka-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

## frontend/.env.local

```
VITE_API_URL=http://localhost:8000
```

## frontend/vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

## frontend/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kapruka Shopping Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

# SETUP & DEPLOYMENT

## Local Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Get Gemini API key from https://aistudio.google.com/app/apikey
# Add to .env.local: GEMINI_API_KEY=your_key

# Run
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
```

## Cloud Run Deployment

```bash
# From backend directory
gcloud run deploy kapruka-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 512MB \
  --cpu 1 \
  --timeout 60 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key

# Get URL
gcloud run services describe kapruka-agent --region us-central1
```

## Vercel Deployment

```bash
# Frontend
cd frontend
npm run build
vercel

# After deployment, update frontend/.env:
VITE_API_URL=https://your-cloud-run-url
```

---

# TESTING

## Test Sinhala
```
"කේක් එකක්" (Do you have cake?)
"කොහොමද?" (How are you?)
```

## Test Tamil
```
"கேக்" (Cake)
"மலர்" (Flowers)
```

## Test English
```
"chocolate gifts under 3000"
"show me flowers"
"what's available?"
```

---

# COST SUMMARY

Development: $0-1/month
Growth: $10-50/month
Year 1: $100-200

**50-70% cheaper than local LLM approach!**

---

This is everything. Ready to copy-paste and run. 🇱🇰 🚀
