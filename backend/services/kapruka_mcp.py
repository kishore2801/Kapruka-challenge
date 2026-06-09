import httpx
import logging
from typing import Dict, List, Any, Optional


logger = logging.getLogger(__name__)

class KaprukaMCP:
    '''
        Kapruka MCP Client
        --------------------
        Handled all communication with Kapruka's MCP server at https://mcp.kapruka.com/mcp


        Provides methods to search products, get details, check delivery, create orders, and track orders.
    '''

    MCP_URL = "https://mcp.kapruka.com/mcp"
    TIMEOUT = 30

    @staticmethod
    async def call_tool(tool_name: str, args: Dict[str, Any])-> Dict[str, Any]:
        """
        Call any Kapruka MCP tool.

        Args:
            tool_name (str): Name of the tool to call.
            args (Dict[str, Any]): Arguments to pass to the tool
        
        Returns:
            Tool results as dictionary
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
                logger.info(f"Calling tool {tool_name} with args {args}")
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
            )-> List[Dict[str, Any]]:
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
                'q': query,
                "limit": min(limit, 30)
                }
            
            if max_price is not None:
                args['max_price'] = max_price
            
            if min_price is not None:
                args['min_price'] = min_price
            
            if category is not None:
                args['category'] = category
            
            if sort is not None:
                args['sort'] = sort

            result = await KaprukaMCP.call_tool("kapruka_search_products", args)
            return result.get("products", []) if result else []
        

        @staticmethod
        async def get_product(product_id: str)-> Dict[str, Any]:
            """
            Get detailed information about a specific product.

            Args:
                product_id: The Product ID


            Returns:
                Detailed information about the product
            """

            result = await KaprukaMCP.call_tool("kapruka_get_product", {'product_id': product_id})

            return result if result else {}
        
        @staticmethod
        async def list_categories(depth: int=1)-> List[Dict[str, Any]]:
            '''
            List all product categories.

            Args:
                depth: How many levels deep (1-3)
            Returns:
                List of categories
            
            '''

            result = await KaprukaMCP.call_tool("kapruka_list_categories", {'depth': depth})

            return result.get("categories", []) if result else []
        
        @staticmethod
        async def delivery_cities(query: str, limit: 50)-> List[Dict[str, Any]]:

            """
            List all delivery cities.

            args:
                query:  Query of delivery city
                limit:  Max no of cities
            
            returns:
                List of delivery cities
            
            """
            result = await KaprukaMCP.call_tool("kapruka_delivery_cities", {'query': query, 'limit': limit})

            return result.get("cities", []) if result else []
        

        @staticmethod
        async def check_delivery(
            city: str,
            delivery_date: str,
            product_id: str,
            )-> Dict[str, Any]:
            """
            Check delivery availability for a specific product.

            Args:
                - city : city of delivery
                - delivery date : expected delivery date
                - product_id : Product id
            
            result:
                - Delivery information including cost, timing, and availability
            
            """
            result = await KaprukaMCP.call_tool("kapruka_check_delivery", {
                "city": city,
                "delivery_date": delivery_date,
                "product_id": product_id
                })

            return result if result else {}
        

        @staticmethod
        async def create_order(
            items: List[Dict[str, Any]],
            recipient: Dict[str, str],
            delivery: Dict[str, str],
            sender: Dict[str, str],
            gift_message: Optional[str] = None
            ) -> Dict[str,Any]:

            '''
            Create a guest Checkout order on Kapruka (no account Needed)

            Args:
             - items: List of items with product_id, quantity, variant
             - recipient: Recipient info {name, phone, email}
             - delivery: Delivery info {city, date}
             - sender: Sender info {name, phone, email}
             - gift_message: Gift message (optional)


            Returns:
            - Order details including order_id and payment_url
            '''

            args = {
                "cart": items,
                "recipient": recipient,
                "delivery": delivery,
                "sender": sender,
                    }

            if gift_message is not None:
                args["gift_message"] = gift_message

            result = await KaprukaMCP.call_tool("kapruka_create_order", args)

            return result if result else {}
        
    async def track_order(order_number: str)-> Dict[str, Any]:
        """
        Track an existing order.add()
        
        Args:
        - order_number: Order number (e.g., "ORD12345)


        Returns:
        - Order status, timeline, and delivery information
        
        """

        result = await KaprukaMCP.call_tool("kapruka_track_order",
        {"order_number": order_number})

        return result if result else {}




        




    
    