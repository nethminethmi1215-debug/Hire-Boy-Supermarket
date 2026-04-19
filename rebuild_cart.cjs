const fs = require('fs');
let content = fs.readFileSync('cart.html', 'utf8');

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

// Inject calculate function before loadCart
if (!content.includes('calculateItemTotal')) {
    content = content.replace('function loadCart() {', calculateFunc + '\n        function loadCart() {');
}

// Ensure updateCartCount is length based
content = content.replace(/function updateCartCount\(\) \{[\s\S]*?reduce\(\(sum, item\) => sum \+ item\.qty, 0\);[\s\S]*?\}/, `function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const countEl = document.getElementById('cart-count');
            if(countEl) countEl.textContent = cart.length;
        }`);

// Replace loadCart entirely
const loadCartRegex = /function loadCart\(\) \{[\s\S]*?\}\s*function changeQty/;
const newLoadCart = `function loadCart() {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            let products = JSON.parse(localStorage.getItem('products')) || [];
            let cartItemsDiv = document.getElementById('cart-items');
            
            const subtotalElement = document.getElementById('summary-subtotal');
            const taxElement = document.getElementById('summary-tax');
            const totalElement = document.getElementById('summary-total');
            const checkoutBtn = document.getElementById('checkout-btn');

            if (cart.length === 0) {
                cartItemsDiv.innerHTML = \`
                    <div class="text-center py-16 bg-lowest rounded-3xl ghost-border">
                        <span class="material-symbols-outlined text-[64px] text-gray-300 mb-4 block">remove_shopping_cart</span>
                        <p class="text-gray-500 font-headline text-xl">Your cart is empty</p>
                        <a href="index.html" class="inline-block mt-6 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors">Start Shopping</a>
                    </div>
                \`;
                subtotalElement.innerText = '$0.00';
                taxElement.innerText = '$0.00';
                totalElement.innerText = '$0.00';
                checkoutBtn.classList.add('opacity-50', 'pointer-events-none');
                return;
            } else {
                checkoutBtn.classList.remove('opacity-50', 'pointer-events-none');
            }

            let subtotal = 0;
            let html = '';

            cart.forEach((cartItem, idx) => {
                let product = products.find(p => p.id === cartItem.id);
                if (product) {
                    let fallbackPUnit = product.category.includes('drinks') ? 'L' : (product.category.includes('groceries') ? 'packet' : 'kg');
                    let pUnit = cartItem.pricingUnit || fallbackPUnit;
                    let itemTotal = calculateItemTotal(product.price, pUnit, cartItem.amount, cartItem.reqUnit);
                    subtotal += itemTotal;
                    
                    html += \`
                        <div class="bg-lowest rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 ghost-border ambient-shadow relative mb-4">
                            <img src="\${product.img}" alt="\${product.name}" class="w-24 h-24 object-cover rounded-xl bg-low shrink-0">
                            <div class="flex-grow text-center sm:text-left">
                                <h3 class="font-headline text-lg font-bold">\${product.name}</h3>
                                <p class="text-primary font-bold mt-1">Base Price: $\${product.price.toFixed(2)} per \${pUnit}</p>
                            </div>
                            <div class="flex items-center gap-2 bg-low px-3 py-2 rounded-xl shrink-0 border border-outline">
                                <button onclick="changeQty(\${idx}, -1)" class="text-gray-500 hover:text-primary font-bold text-xl w-6 h-6 flex items-center justify-center">-</button>
                                <input type="number" onchange="directUpdateQty(\${idx}, this.value)" value="\${cartItem.amount}" step="any" min="0.1" class="font-bold w-16 text-center bg-transparent border-none outline-none appearance-none px-1">
                                <span class="font-bold text-sm text-gray-500 text-left w-8">\${cartItem.reqUnit}</span>
                                <button onclick="changeQty(\${idx}, 1)" class="text-gray-500 hover:text-primary font-bold text-xl w-6 h-6 flex items-center justify-center">+</button>
                            </div>
                            <div class="shrink-0 w-24 text-center sm:text-right font-headline font-bold text-lg text-primary">
                                $\${itemTotal.toFixed(2)}
                            </div>
                            <button onclick="removeItem(\${idx})" class="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove item">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    \`;
                }
            });

            cartItemsDiv.innerHTML = html;

            const DELIVERY_FEE = 5.00;
            const SERVICE_CHARGE = 2.00;
            const TAX_RATE = 0.08;

            let tax = subtotal * TAX_RATE;
            let total = subtotal + tax + DELIVERY_FEE + SERVICE_CHARGE;

            subtotalElement.innerText = '$' + subtotal.toFixed(2);
            taxElement.innerText = '$' + tax.toFixed(2);
            document.getElementById('summary-delivery').innerText = '$' + DELIVERY_FEE.toFixed(2);
            document.getElementById('summary-service').innerText = '$' + SERVICE_CHARGE.toFixed(2);
            totalElement.innerText = '$' + total.toFixed(2);
        }
        function changeQty`;
content = content.replace(loadCartRegex, newLoadCart);

// Replace changeQty, directUpdateQty, removeItem
content = content.replace(/function changeQty[\s\S]*?function removeItem.*?\}\s*\}/, `function changeQty(idx, delta) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            if(cart[idx]) {
                let step = 1;
                if (cart[idx].reqUnit === 'g' || cart[idx].reqUnit === 'ml') step = 50;
                else if (cart[idx].reqUnit === 'kg' || cart[idx].reqUnit === 'L') step = 0.5;
                
                cart[idx].amount += (delta * step);
                cart[idx].amount = parseFloat(cart[idx].amount.toFixed(2));
                
                if (cart[idx].amount <= 0) cart.splice(idx, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                loadCart();
            }
        }

        function directUpdateQty(idx, val) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            if(cart[idx]) {
                let num = parseFloat(val);
                if(num > 0) {
                    cart[idx].amount = num;
                } else {
                    cart.splice(idx, 1);
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                loadCart();
            }
        }

        function removeItem(idx) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart.splice(idx, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            loadCart();
        }`);
fs.writeFileSync('cart.html', content, 'utf8');
