from google.genai import types

KAPRUKA_TOOLS = [types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="search_products",
            description="Search for products on Kapruka by keyword, category, or price range. Use this when user asks to find, search, or look for products.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "query": types.Schema(type=types.Type.STRING, description="Search query (e.g., 'chocolate gifts'). Required."),
                    "max_price": types.Schema(type=types.Type.NUMBER, description="Maximum price (optional)."),
                    "min_price": types.Schema(type=types.Type.NUMBER, description="Minimum price (optional)."),
                    "category": types.Schema(type=types.Type.STRING, description="Exact Kapruka category name. Only use these verified values: 'Chocolates', 'Softtoy', 'Clothing', 'Electronic', 'Grocery', 'Household', 'Cosmetics', 'KidsToys', 'Perfumes', 'Jewellery', 'Books', 'Fruits'. Do NOT use 'Cakes', 'Flowers', 'Soft Toys', or any other name — they will return zero results. Omit for cakes, flowers, or any category not in this list."),
                    "sort": types.Schema(type=types.Type.STRING, description="Sort by 'price', 'rating', or 'newest' (optional)."),
                    "limit": types.Schema(type=types.Type.INTEGER, description="Number of results to return (default 10, max 30)."),
                    "currency": types.Schema(type=types.Type.STRING, description="Currency code for prices, e.g. LKR, USD, GBP, EUR, AUD, CAD, SGD, INR."),
                },
                required=["query"]
            )
        ),
        types.FunctionDeclaration(
            name="get_product",
            description="Get full details about a specific product including price, rating, images, variants, and shipping info.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_id": types.Schema(type=types.Type.STRING, description="The product ID from search results."),
                    "currency": types.Schema(type=types.Type.STRING, description="Currency code for prices, e.g. LKR, USD, GBP, EUR, AUD, CAD, SGD, INR."),
                },
                required=["product_id"]
            )
        ),
        types.FunctionDeclaration(
            name="list_categories",
            description="Show all available product categories on Kapruka. Use when user asks what categories or products are available.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "depth": types.Schema(type=types.Type.INTEGER, description="Category depth level (1-3, default 1)."),
                }
            )
        ),
        types.FunctionDeclaration(
            name="check_delivery",
            description="Check if a product can be delivered to a specific city on a specific date and get the delivery cost.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "city": types.Schema(type=types.Type.STRING, description="Delivery city (e.g., 'Colombo', 'Kandy', 'Galle')."),
                    "delivery_date": types.Schema(type=types.Type.STRING, description="Desired delivery date in YYYY-MM-DD format."),
                    "product_id": types.Schema(type=types.Type.STRING, description="Product ID to check delivery for."),
                },
                required=["city", "delivery_date", "product_id"]
            )
        ),
        types.FunctionDeclaration(
            name="delivery_cities",
            description="Search Kapruka's delivery network. Use when user asks which cities are available for delivery or mentions a city name.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "query": types.Schema(type=types.Type.STRING, description="City name or alias to search for (e.g., 'Colombo', 'කොළඹ')."),
                    "limit": types.Schema(type=types.Type.INTEGER, description="Maximum number of cities to return (max 50)."),
                },
                required=["query"]
            )
        ),
        types.FunctionDeclaration(
            name="update_cart",
            description="Add or remove items from the user's shopping cart. Call this when the user says they want to buy something or add it to their cart. You must provide the COMPLETE updated list of items.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "items": types.Schema(
                        type=types.Type.ARRAY,
                        description="The COMPLETE updated list of items in the cart.",
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "product_id": types.Schema(type=types.Type.STRING, description="Product ID."),
                                "name": types.Schema(type=types.Type.STRING, description="Product Name."),
                                "price": types.Schema(type=types.Type.STRING, description="Product Price (e.g. 'LKR 4000')."),
                                "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity."),
                                "image_url": types.Schema(type=types.Type.STRING, description="Product Image URL."),
                            },
                            required=["product_id", "name", "price", "quantity", "image_url"],
                        ),
                    ),
                },
                required=["items"],
            )
        ),
        types.FunctionDeclaration(
            name="create_order",
            description="Create a guest checkout order on Kapruka. No account required. Returns a click-to-pay URL. ONLY call this once you have collected ALL required fields from the user.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "items": types.Schema(
                        type=types.Type.ARRAY,
                        description="Cart items to order.",
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "product_id": types.Schema(type=types.Type.STRING, description="Product ID."),
                                "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity."),
                                "variant": types.Schema(type=types.Type.STRING, description="Variant name if applicable, otherwise omit."),
                            },
                            required=["product_id", "quantity"],
                        ),
                    ),
                    "recipient": types.Schema(
                        type=types.Type.OBJECT,
                        description="Person receiving the order.",
                        properties={
                            "name": types.Schema(type=types.Type.STRING, description="Full name."),
                            "phone": types.Schema(type=types.Type.STRING, description="Phone number."),
                            "email": types.Schema(type=types.Type.STRING, description="Email address."),
                        },
                        required=["name", "phone"],
                    ),
                    "delivery": types.Schema(
                        type=types.Type.OBJECT,
                        description="Delivery details.",
                        properties={
                            "address": types.Schema(type=types.Type.STRING, description="Full street address."),
                            "city": types.Schema(type=types.Type.STRING, description="Delivery city."),
                            "date": types.Schema(type=types.Type.STRING, description="Delivery date in YYYY-MM-DD format."),
                        },
                        required=["address", "city", "date"],
                    ),
                    "sender": types.Schema(
                        type=types.Type.OBJECT,
                        description="Person placing the order.",
                        properties={
                            "name": types.Schema(type=types.Type.STRING, description="Full name."),
                            "phone": types.Schema(type=types.Type.STRING, description="Phone number."),
                        },
                        required=["name", "phone"],
                    ),
                    "gift_message": types.Schema(type=types.Type.STRING, description="Optional gift message to include."),
                    "currency": types.Schema(type=types.Type.STRING, description="Currency code, e.g. LKR, USD, GBP, EUR, AUD, CAD, SGD, INR."),
                },
                required=["items", "recipient", "delivery", "sender"],
            )
        ),
        types.FunctionDeclaration(
            name="track_order",
            description="Track an existing order status and delivery timeline. Use when user provides an order number.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_number": types.Schema(type=types.Type.STRING, description="Order number like 'ORD12345' from confirmation email."),
                },
                required=["order_number"]
            )
        ),
    ]
)]
