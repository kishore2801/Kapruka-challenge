import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import google.generativeai as genai
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
import logging

from services.kapruka_mcp import KaprukaMCP
from services.gemini_tools import KAPRUKA_TOOLS
from services.language_detector import detect_language

load_dotenv()

# Setup Logging
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
    version="0.0.1",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


# Request Model
class ChatRequest(BaseModel):
    message: str

    @validator('message')
    def validate_message(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Message cannot be empty")
        if len(v) > 2000:
            raise ValueError("Message too long (max 2000 characters)")
        return v.strip()


# Health Check
@app.get('/health')
async def health():
    """Health Check Endpoint"""
    return {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'version': '0.0.1'
    }


# Main Chat Endpoint
@app.post('/api/chat')
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    """
    Main Chat endpoint that handles user queries in 3 languages:
        - Sinhala (සිංහල)
        - Tamil (தமிழ்)
        - English

    Uses Gemini 2.0 Flash for:
        1. Language understanding
        2. Tool Selection (MCP)
        3. Response Generation
        4. Automatic Translation to user's language
    """

    try:
        user_message = body.message.strip()

        # Detect Language
        detected_lang = detect_language(user_message)
        logger.info(f"Detected Language: {detected_lang}")
        logger.info(f"User message: {user_message}")

        # Create System Prompt with Language Context
        system_instruction = f"""You are a helpful and friendly Kapruka shopping assistant named Kopi.

IMPORTANT: The user is speaking in {detected_lang}.

Your responsibilities:
1. Understand the user's query in {detected_lang}
2. Use available tools to search products or perform actions.
3. Respond ALWAYS in {detected_lang}
4. Provide clear product information, only use the available data.
5. Guide users through shopping end to end by suggesting the best products that fit the user's requirements.

Available Actions:
- Search for products by name, category, or price range
- Get detailed product information
- Check delivery availability
- Create orders
- Track orders
- Check for nearest delivery cities nearby

RULES:
- Keep responses concise but informative
- Always respond in {detected_lang}
- Use tool calls appropriately
- If user asks for something you can't do, politely explain
- Be conversational and friendly"""

        # Create Gemini Model with MCP Tools
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            tools=KAPRUKA_TOOLS,
            system_instruction=system_instruction
        )

        logger.info("Calling Gemini...")
        response = model.generate_content(user_message)

        response_text = ""
        tools_called = []

        # Process Response Parts
        for part in response.content:

            # Extract text response
            if hasattr(part, 'text') and part.text:
                response_text = part.text
                logger.info(f"Gemini Response: {response_text[:100]}...")

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
                        logger.info("Got product details")

                    elif tool_name == "check_delivery":
                        result = await KaprukaMCP.check_delivery(
                            city=tool_args.get("city"),
                            delivery_date=tool_args.get("delivery_date"),
                            product_id=tool_args.get("product_id")
                        )
                        logger.info(f"Delivery check: {result}")

                    elif tool_name == "delivery_cities":
                        result = await KaprukaMCP.delivery_cities(
                            query=tool_args.get("query"),
                            limit=tool_args.get("limit", 50)
                        )
                        logger.info(f"Delivery cities found: {len(result)} results")

                    elif tool_name == "list_categories":
                        result = await KaprukaMCP.list_categories(
                            depth=tool_args.get("depth", 1)
                        )
                        logger.info(f"Categories listed: {len(result)} found")

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

        # Return Response
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


# Run
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Kapruka Agent starting on http://0.0.0.0:{port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"🤖 Using Gemini 2.0 Flash\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")