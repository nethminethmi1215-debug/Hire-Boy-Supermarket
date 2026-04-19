const fs = require('fs');

// 1. Fix checkout.html empty cart bug by adding the missing calculateItemTotal function
let checkoutHtml = fs.readFileSync('checkout.html', 'utf8');

const calculateFunc = `
        // Added to fix total being 0 and items not displaying
        function calculateItemTotal(productBasePrice, pricingUnit, amount, reqUnit) {
            let itemTotal = 0;
            if (pricingUnit === 'kg' && reqUnit === 'g') {
                itemTotal = productBasePrice * (amount / 1000);
            } else if ((pricingUnit === 'g' || pricingUnit === '100g') && reqUnit === 'g') {
                let unitRatio = pricingUnit === '100g' ? 100 : 1;
                itemTotal = productBasePrice * (amount / unitRatio);
            } else if (pricingUnit === 'packet' && reqUnit === 'packet') {
                itemTotal = productBasePrice * amount;
            } else if (pricingUnit === 'L' && reqUnit === 'ml') {
                itemTotal = productBasePrice * (amount / 1000);
            } else if ((pricingUnit === 'ml' || pricingUnit === '100ml') && reqUnit === 'ml') {
                let unitRatio = pricingUnit === '100ml' ? 100 : 1;
                itemTotal = productBasePrice * (amount / unitRatio);
            } else {
                itemTotal = productBasePrice * amount;
            }
            return itemTotal;
        }

        function loadCheckoutDetails`;

if (!checkoutHtml.includes('function calculateItemTotal')) {
    checkoutHtml = checkoutHtml.replace('function loadCheckoutDetails', calculateFunc);
    fs.writeFileSync('checkout.html', checkoutHtml, 'utf8');
    console.log("Fixed checkout.html");
}

// 2. Add Footer to all pages
const htmlFiles = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html', 'product.html', 'cart.html', 'checkout.html', 'admin.html'];

const footerHtml = `
    <!-- User Request: Footer added to every page with specific text and contacts -->
    <footer class="bg-lowest border-t border-outline mt-16 pt-12 pb-8 w-full shrink-0">
        <div class="max-w-7xl mx-auto px-10">
            <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                <!-- Left Details -->
                <div class="text-center md:text-left">
                    <p class="text-gray-500 text-sm mb-2 font-medium">Curating the finest provisions for the modern pantry. Delivered fresh, always.</p>
                    <p class="text-gray-400 text-xs tracking-wide">© 2024 The Digital Orchard. Freshness Delivered.</p>
                </div>
                <!-- Right Links -->
                <div class="flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-600">
                    <a href="#" class="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" class="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" class="hover:text-primary transition-colors">Shipping Info</a>
                    <a href="#" onclick="alert('Customer Support: 0773811326'); event.preventDefault();" class="hover:text-primary transition-colors">Contact Us</a>
                </div>
            </div>
        </div>
    </footer>
`;

htmlFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Check if footer already exists to avoid duplication
    if (!content.includes('Curating the finest provisions for the modern pantry')) {
        content = content.replace('</body>', footerHtml + '\\n</body>');
        fs.writeFileSync(f, content, 'utf8');
        console.log("Added footer to " + f);
    }
});
