import { db } from './config/database'
import { ProductType } from './generated/prisma/client'

async function main() {
    // Create a new user with a post
    const prisma = await db.getClient();
    const seeds = prisma.product.createMany({
        data: [
            { sku: 'SKU-001', name: 'Wireless Headphones', description: 'High quality noise cancelling', category: 'Electronics', price: 199.99, discountPrice: 149.99, quantity: 50, type: ProductType.PUBLIC },
            { sku: 'SKU-002', name: 'Cotton T-Shirt', description: '100% Organic Cotton', category: 'Clothing', price: 29.99, discountPrice: null, quantity: 100, type: ProductType.PUBLIC },
            { sku: 'SKU-003', name: 'Gaming Mouse', description: 'RGB lighting and high DPI', category: 'Electronics', price: 59.99, discountPrice: 49.99, quantity: 30, type: ProductType.PUBLIC },
            { sku: 'SKU-004', name: 'Mechanical Keyboard', description: 'Blue switches', category: 'Electronics', price: 129.99, discountPrice: null, quantity: 20, type: ProductType.PRIVATE },
            { sku: 'SKU-005', name: 'Running Shoes', description: 'Lightweight and durable', category: 'Sports', price: 89.99, discountPrice: 69.99, quantity: 45, type: ProductType.PUBLIC },
            { sku: 'SKU-006', name: 'Coffee Maker', description: 'Programmable with timer', category: 'Home & Garden', price: 79.99, discountPrice: null, quantity: 15, type: ProductType.PUBLIC },
            { sku: 'SKU-007', name: 'Blender', description: 'High speed smoothie maker', category: 'Home & Garden', price: 49.99, discountPrice: 39.99, quantity: 25, type: ProductType.PUBLIC },
            { sku: 'SKU-008', name: 'Yoga Mat', description: 'Non-slip surface', category: 'Sports', price: 24.99, discountPrice: null, quantity: 60, type: ProductType.PUBLIC },
            { sku: 'SKU-009', name: 'Novel: The Great Adventure', description: 'Best selling fiction', category: 'Books', price: 14.99, discountPrice: null, quantity: 200, type: ProductType.PUBLIC },
            { sku: 'SKU-010', name: 'Cookbook: Easy Recipes', description: 'Healthy meals in 30 mins', category: 'Books', price: 24.99, discountPrice: 19.99, quantity: 80, type: ProductType.PUBLIC },
            { sku: 'SKU-011', name: 'Smart Watch', description: 'Fitness tracker and notifications', category: 'Electronics', price: 249.99, discountPrice: 199.99, quantity: 40, type: ProductType.PUBLIC },
            { sku: 'SKU-012', name: 'Denim Jeans', description: 'Classic fit', category: 'Clothing', price: 59.99, discountPrice: null, quantity: 70, type: ProductType.PUBLIC },
            { sku: 'SKU-013', name: 'Sneakers', description: 'Casual everyday wear', category: 'Clothing', price: 69.99, discountPrice: 54.99, quantity: 55, type: ProductType.PUBLIC },
            { sku: 'SKU-014', name: 'Dumbbell Set', description: 'Adjustable weights', category: 'Sports', price: 149.99, discountPrice: null, quantity: 10, type: ProductType.PUBLIC },
            { sku: 'SKU-015', name: 'Protein Powder', description: 'Chocolate flavor 2kg', category: 'Food & Beverage', price: 59.99, discountPrice: 49.99, quantity: 100, type: ProductType.PUBLIC },
            { sku: 'SKU-016', name: 'Energy Bar Box', description: 'Pack of 12', category: 'Food & Beverage', price: 24.99, discountPrice: null, quantity: 150, type: ProductType.PUBLIC },
            { sku: 'SKU-017', name: 'Laptop Stand', description: 'Ergonomic aluminum', category: 'Electronics', price: 39.99, discountPrice: 29.99, quantity: 35, type: ProductType.PUBLIC },
            { sku: 'SKU-018', name: 'USB-C Hub', description: '7-in-1 adapter', category: 'Electronics', price: 49.99, discountPrice: null, quantity: 40, type: ProductType.PUBLIC },
            { sku: 'SKU-019', name: 'Desk Lamp', description: 'LED with adjustable brightness', category: 'Home & Garden', price: 34.99, discountPrice: null, quantity: 25, type: ProductType.PUBLIC },
            { sku: 'SKU-020', name: 'Office Chair', description: 'Ergonomic mesh back', category: 'Home & Garden', price: 199.99, discountPrice: 179.99, quantity: 8, type: ProductType.PRIVATE },
            { sku: 'SKU-021', name: 'Backpack', description: 'Water resistant laptop bag', category: 'Clothing', price: 49.99, discountPrice: 39.99, quantity: 45, type: ProductType.PUBLIC },
            { sku: 'SKU-022', name: 'Sunglasses', description: 'Polarized lenses', category: 'Clothing', price: 89.99, discountPrice: null, quantity: 30, type: ProductType.PUBLIC },
            { sku: 'SKU-023', name: 'Tennis Racket', description: 'Professional grade', category: 'Sports', price: 199.99, discountPrice: 159.99, quantity: 12, type: ProductType.PUBLIC },
            { sku: 'SKU-024', name: 'Basketball', description: 'Indoor/Outdoor', category: 'Sports', price: 29.99, discountPrice: null, quantity: 50, type: ProductType.PUBLIC },
            { sku: 'SKU-025', name: 'Sci-Fi Novel', description: 'Space exploration saga', category: 'Books', price: 12.99, discountPrice: null, quantity: 90, type: ProductType.PUBLIC },
            { sku: 'SKU-026', name: 'History Book', description: 'World War II overview', category: 'Books', price: 19.99, discountPrice: 14.99, quantity: 40, type: ProductType.PUBLIC },
            { sku: 'SKU-027', name: 'Green Tea', description: 'Organic japanese matcha', category: 'Food & Beverage', price: 29.99, discountPrice: null, quantity: 60, type: ProductType.PUBLIC },
            { sku: 'SKU-028', name: 'Coffee Beans', description: 'Arabica roast 1kg', category: 'Food & Beverage', price: 34.99, discountPrice: 27.99, quantity: 45, type: ProductType.PUBLIC },
            { sku: 'SKU-029', name: '4K Monitor', description: '27 inch IPS display', category: 'Electronics', price: 349.99, discountPrice: 299.99, quantity: 15, type: ProductType.PUBLIC },
            { sku: 'SKU-030', name: 'Webcam', description: '1080p HD streaming', category: 'Electronics', price: 69.99, discountPrice: null, quantity: 25, type: ProductType.PUBLIC },
            { sku: 'SKU-031', name: 'Plant Pot', description: 'Ceramic white', category: 'Home & Garden', price: 19.99, discountPrice: null, quantity: 80, type: ProductType.PUBLIC },
            { sku: 'SKU-032', name: 'Garden Hose', description: 'Expandable 50ft', category: 'Home & Garden', price: 39.99, discountPrice: 29.99, quantity: 30, type: ProductType.PUBLIC },
            { sku: 'SKU-033', name: 'Winter Jacket', description: 'Insulated waterproof', category: 'Clothing', price: 149.99, discountPrice: 119.99, quantity: 20, type: ProductType.PUBLIC },
            { sku: 'SKU-034', name: 'Scarf', description: 'Wool knitted', category: 'Clothing', price: 24.99, discountPrice: null, quantity: 60, type: ProductType.PUBLIC },
            { sku: 'SKU-035', name: 'Soccer Ball', description: 'Official size 5', category: 'Sports', price: 24.99, discountPrice: 19.99, quantity: 40, type: ProductType.PUBLIC },
            { sku: 'SKU-036', name: 'Swimming Goggles', description: 'Anti-fog UV protection', category: 'Sports', price: 19.99, discountPrice: null, quantity: 55, type: ProductType.PUBLIC },
            { sku: 'SKU-037', name: 'Biography', description: 'Steve Jobs', category: 'Books', price: 16.99, discountPrice: null, quantity: 35, type: ProductType.PUBLIC },
            { sku: 'SKU-038', name: 'Self-Help Book', description: 'Atomic Habits', category: 'Books', price: 18.99, discountPrice: 15.99, quantity: 100, type: ProductType.PUBLIC },
            { sku: 'SKU-039', name: 'Olive Oil', description: 'Extra virgin 1L', category: 'Food & Beverage', price: 14.99, discountPrice: null, quantity: 75, type: ProductType.PUBLIC },
            { sku: 'SKU-040', name: 'Pasta', description: 'Italian spaghetti 500g', category: 'Food & Beverage', price: 2.99, discountPrice: null, quantity: 200, type: ProductType.PUBLIC },
            { sku: 'SKU-041', name: 'Tablet', description: '10 inch android', category: 'Electronics', price: 199.99, discountPrice: 169.99, quantity: 20, type: ProductType.PUBLIC },
            { sku: 'SKU-042', name: 'Phone Case', description: 'Shockproof clear', category: 'Electronics', price: 14.99, discountPrice: 9.99, quantity: 150, type: ProductType.PUBLIC },
            { sku: 'SKU-043', name: 'Bed Sheets', description: 'Cotton king size', category: 'Home & Garden', price: 59.99, discountPrice: 49.99, quantity: 25, type: ProductType.PUBLIC },
            { sku: 'SKU-044', name: 'Pillow', description: 'Memory foam', category: 'Home & Garden', price: 39.99, discountPrice: null, quantity: 40, type: ProductType.PUBLIC },
            { sku: 'SKU-045', name: 'Hoodie', description: 'Fleece pullover', category: 'Clothing', price: 44.99, discountPrice: 34.99, quantity: 60, type: ProductType.PUBLIC },
            { sku: 'SKU-046', name: 'Socks', description: 'Pack of 5', category: 'Clothing', price: 14.99, discountPrice: null, quantity: 100, type: ProductType.PUBLIC },
            { sku: 'SKU-047', name: 'Cycling Helmet', description: 'Safety certified', category: 'Sports', price: 49.99, discountPrice: 39.99, quantity: 15, type: ProductType.PUBLIC },
            { sku: 'SKU-048', name: 'Water Bottle', description: 'Stainless steel insulated', category: 'Sports', price: 24.99, discountPrice: null, quantity: 80, type: ProductType.PUBLIC },
            { sku: 'SKU-049', name: 'Business Book', description: 'Zero to One', category: 'Books', price: 15.99, discountPrice: null, quantity: 45, type: ProductType.PUBLIC },
            { sku: 'SKU-050', name: 'Chocolate Bar', description: 'Dark chocolate 70%', category: 'Food & Beverage', price: 3.99, discountPrice: null, quantity: 150, type: ProductType.PUBLIC },
        ],
    });
    console.log('Products created:', seeds)

    // Fetch all users with their posts
    const allProducts = prisma.product.findMany();
    console.log('All products:', JSON.stringify(allProducts, null, 2))
}

main()
    .then(async () => {
        await db.disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await db.disconnect()
        process.exit(1)
    })