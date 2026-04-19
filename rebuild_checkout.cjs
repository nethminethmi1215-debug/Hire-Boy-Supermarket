const fs = require('fs');
let content = fs.readFileSync('checkout.html', 'utf8');

// Inject calculate function
const calculateFunc = `
        function calculateItemTotal(productBasePrice, pricingUnit, amount, reqUnit) {
            let cost = 0;
            if (pricingUnit === 'kg') {
                if (reqUnit === 'kg') cost = productBasePrice * amount;
                else if (reqUnit === 'g') cost = productBasePrice * (amount / 1000);
            } else if (pricingUnit === '100g') {
                if (reqUnit === 'kg') cost = productBasePrice * (amount * 10);
                else if (reqUnit === 'g') cost = productBasePrice * (amount / 100);
            } else if (pricingUnit === 'L') {
                if (reqUnit === 'L') cost = productBasePrice * amount;
                else if (reqUnit === 'ml') cost = productBasePrice * (amount / 1000);
            } else {
                cost = productBasePrice * amount;
            }
            return cost;
        }
`;
if (!content.includes('calculateItemTotal')) {
    content = content.replace('function loadCheckoutDetails() {', calculateFunc + '\n        function loadCheckoutDetails() {');
}

// Ensure updateCartCount is length based
content = content.replace(/function updateCartCount\(\) \{[\s\S]*?reduce\(\(sum, item\) => sum \+ item\.qty, 0\);[\s\S]*?\}/, `function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const countEl = document.getElementById('cart-count');
            if(countEl) countEl.textContent = cart.length;
        }`);

const loopRegex = /cart\.forEach\(item => \{[\s\S]*?\}\);/;
const reloadLoop1 = `cart.forEach(cartItem => {
                let product = products.find(p => p.id === cartItem.id);
                if (product) {
                    let fallbackPUnit = product.category.includes('drinks') ? 'L' : (product.category.includes('groceries') ? 'packet' : 'kg');
                    let pUnit = cartItem.pricingUnit || fallbackPUnit;
                    let itemTotal = calculateItemTotal(product.price, pUnit, cartItem.amount, cartItem.reqUnit);
                    subtotal += itemTotal;
                    
                    html += \`
                        <div class="flex items-center gap-4 border-b border-outline pb-3 last:border-0 mb-3">
                            <img src="\${product.img}" alt="\${product.name}" class="w-16 h-16 object-cover rounded-lg bg-low shrink-0">
                            <div class="flex-grow">
                                <h4 class="font-headline font-bold text-sm leading-tight">\${product.name}</h4>
                                <p class="text-xs text-gray-500 mt-1">\${cartItem.amount} \${cartItem.reqUnit} (Price: $\${product.price.toFixed(2)} / \${pUnit})</p>
                            </div>
                            <div class="font-bold text-sm text-primary">
                                $\${itemTotal.toFixed(2)}
                            </div>
                        </div>
                    \`;
                }
            });`;
content = content.replace(loopRegex, reloadLoop1);

const pCheckoutRegex = /cart\.forEach\(item => \{[\s\S]*?\}\);/;
const reloadLoop2 = `cart.forEach(item => {
                let product = products.find(p => p.id === item.id);
                if(product) {
                    let fallbackPUnit = product.category.includes('drinks') ? 'L' : (product.category.includes('groceries') ? 'packet' : 'kg');
                    let pUnit = item.pricingUnit || fallbackPUnit;
                    subtotal += calculateItemTotal(product.price, pUnit, item.amount, item.reqUnit);
                }
            });`;
// Only replace the second occurrence (in processCheckout)
content = content.split(/cart\.forEach\(item => \{[\s\S]*?\}\);/);
if(content.length === 3) {
    fs.writeFileSync('checkout.html', content[0] + reloadLoop1 + content[1] + reloadLoop2 + content[2], 'utf8');
} else {
    // If it fails, we fall back to just regexing the specific block.
    // wait, above code replaces everything incorrectly if identical
}
