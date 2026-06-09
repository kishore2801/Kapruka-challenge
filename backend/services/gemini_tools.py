from google.generativeai import protos

KAPRUKA_TOOLS = [protos.Tool(
    function_declarations=[
        protos.FunctionDeclaration(
            name="search_products",
            description="Search for products on Kapruka by keyword, category, or price range. Use this when user asks to find, search, or look for products.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "query": protos.Schema(type=protos.Type.STRING, description="Search query (e.g., 'chocolate gifts'). Required."),
                    "max_price": protos.Schema(type=protos.Type.NUMBER, description="Maximum price in LKR (optional)."),
                    "min_price": protos.Schema(type=protos.Type.NUMBER, description="Minimum price in LKR (optional)."),
                    "category": protos.Schema(type=protos.Type.STRING, description="Product category like 'gifts', 'flowers', 'cakes' (optional)."),
                    "sort": protos.Schema(type=protos.Type.STRING, description="Sort by 'price', 'rating', or 'newest' (optional)."),
                    "limit": protos.Schema(type=protos.Type.INTEGER, description="Number of results to return (default 10, max 30)."),
                },
                required=["query"]
            )
        ),
        protos.FunctionDeclaration(
            name="get_product",
            description="Get full details about a specific product including price, rating, images, variants, and shipping info.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "product_id": protos.Schema(type=protos.Type.STRING, description="The product ID from search results."),
                },
                required=["product_id"]
            )
        ),
        protos.FunctionDeclaration(
            name="list_categories",
            description="Show all available product categories on Kapruka. Use when user asks what categories or products are available.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "depth": protos.Schema(type=protos.Type.INTEGER, description="Category depth level (1-3, default 1)."),
                }
            )
        ),
        protos.FunctionDeclaration(
            name="check_delivery",
            description="Check if a product can be delivered to a specific city on a specific date and get the delivery cost.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "city": protos.Schema(type=protos.Type.STRING, description="Delivery city (e.g., 'Colombo', 'Kandy', 'Galle')."),
                    "delivery_date": protos.Schema(type=protos.Type.STRING, description="Desired delivery date in YYYY-MM-DD format."),
                    "product_id": protos.Schema(type=protos.Type.STRING, description="Product ID to check delivery for."),
                },
                required=["city", "delivery_date", "product_id"]
            )
        ),
        protos.FunctionDeclaration(
            name="delivery_cities",
            description="Search Kapruka's delivery network. Use when user asks which cities are available for delivery or mentions a city name.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "query": protos.Schema(type=protos.Type.STRING, description="City name or alias to search for (e.g., 'Colombo', 'කොළඹ')."),
                    "limit": protos.Schema(type=protos.Type.INTEGER, description="Maximum number of cities to return (max 50)."),
                },
                required=["query"]
            )
        ),
        protos.FunctionDeclaration(
            name="create_order",
            description="Create a guest order on Kapruka. No account needed. Use when user is ready to checkout.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "items": protos.Schema(type=protos.Type.STRING, description="JSON array of cart items: [{product_id, quantity, variant}]."),
                    "recipient": protos.Schema(type=protos.Type.STRING, description="JSON object of recipient info: {name, phone, email}."),
                    "delivery": protos.Schema(type=protos.Type.STRING, description="JSON object of delivery info: {address, city, date}."),
                    "sender": protos.Schema(type=protos.Type.STRING, description="JSON object of sender info: {name, phone}."),
                    "gift_message": protos.Schema(type=protos.Type.STRING, description="Optional gift message."),
                },
                required=["items", "recipient", "delivery", "sender"]
            )
        ),
        protos.FunctionDeclaration(
            name="track_order",
            description="Track an existing order status and delivery timeline. Use when user provides an order number.",
            parameters=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "order_number": protos.Schema(type=protos.Type.STRING, description="Order number like 'ORD12345' from confirmation email."),
                },
                required=["order_number"]
            )
        ),
    ]
)]
