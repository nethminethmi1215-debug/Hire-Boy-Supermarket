const fs = require('fs');

// ==== 1. Fix checkout.html ====
let checkoutHtml = fs.readFileSync('checkout.html', 'utf8');

const paymentHtmlReplacement = `
                        <!-- Payment Method Toggle -->
                        <h2 class="font-headline text-2xl font-bold mb-6">Payment Method</h2>
                        <div class="flex gap-4 mb-6">
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="paymentType" value="card" class="peer sr-only" checked onchange="togglePayment()">
                                <div class="p-4 border border-outline rounded-xl peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-center justify-center gap-2 font-bold text-gray-700 peer-checked:text-primary">
                                    <span class="material-symbols-outlined">credit_card</span> Card Payment
                                </div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="paymentType" value="cod" class="peer sr-only" onchange="togglePayment()">
                                <div class="p-4 border border-outline rounded-xl peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-center justify-center gap-2 font-bold text-gray-700 peer-checked:text-primary">
                                    <span class="material-symbols-outlined">payments</span> Cash on Delivery
                                </div>
                            </label>
                        </div>

                        <!-- Card Details -->
                        <div id="card-details-block" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Card Number</label>
                                <input type="text" id="chk-cardnum" required placeholder="0000 0000 0000 0000" pattern="\\\\d{16}" title="Please enter exactly 16 digits" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Expiry Date</label>
                                <input type="text" id="chk-cardexp" required placeholder="MM/YY" pattern="(0[1-9]|1[0-2])\\\\/[0-9]{2}" title="Please enter as MM/YY" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">CVC</label>
                                <input type="text" id="chk-cardcvc" required placeholder="123" pattern="\\\\d{3,4}" title="Please enter 3 or 4 digit CVC" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                        </div>

                        <button id="submit-btn" type="submit" class="w-full bg-primary text-white text-center py-4 rounded-xl font-bold text-[16px] hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined">lock</span> Complete Order
                        </button>
                    </form>
`;

// Clean replacement
if(checkoutHtml.includes('<!-- Payment Information (Dummy) -->')) {
    checkoutHtml = checkoutHtml.replace(/<!-- Payment Information \(Dummy\) -->[\s\S]*?<\/form>/, paymentHtmlReplacement.trim() + '\\n                    </form>');
}


// Add JS for toggling payment and handling processing
const jsUpdates = `
        function togglePayment() {
            const isCard = document.querySelector('input[name="paymentType"]:checked').value === 'card';
            const cardBlock = document.getElementById('card-details-block');
            const cardInputs = cardBlock.querySelectorAll('input');
            const btn = document.getElementById('submit-btn');

            if (isCard) {
                cardBlock.style.display = 'grid';
                cardInputs.forEach(input => input.required = true);
                btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Pay & Complete Order';
            } else {
                cardBlock.style.display = 'none';
                cardInputs.forEach(input => { input.required = false; input.value = ''; });
                btn.innerHTML = '<span class="material-symbols-outlined">local_shipping</span> Complete Order (COD)';
            }
        }

        function processCheckout(event) {
`;

checkoutHtml = checkoutHtml.replace('function processCheckout(event) {', jsUpdates);

const submitLogicRegex = /event\.preventDefault\(\);[\s\S]*?window\.location\.href = 'index\.html\?order=success';/
const newSubmitLogic = `event.preventDefault();

            const isCard = document.querySelector('input[name="paymentType"]:checked').value === 'card';
            const payString = isCard ? 'Paid via Card' : 'Cash on Delivery (COD)';
            const submitBtn = document.getElementById('submit-btn');

            // Form validation ensures everything is filled properly before reaching here due to HTML5 validation.
            // Change button state to simulate processing
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="animation: spin 1s linear infinite;">autorenew</span> Processing...';

            setTimeout(() => {
                // ==== FEE CONFIGURATION (Ensure this matches the above) ====
                const DELIVERY_FEE = 5.00;
                const SERVICE_CHARGE = 2.00;
                const TAX_RATE = 0.08;
                
                // Record Order
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                let products = JSON.parse(localStorage.getItem('products')) || [];
                
                let subtotal = 0;
                cart.forEach(item => {
                    let product = products.find(p => p.id === item.id);
                    if(product) {
                        let fallbackPUnit = product.category.includes('drinks') ? 'L' : (product.category.includes('groceries') ? 'packet' : 'kg');
                        let pUnit = item.pricingUnit || fallbackPUnit;
                        subtotal += calculateItemTotal(product.price, pUnit, item.amount, item.reqUnit);
                    }
                });
                let tax = subtotal * TAX_RATE;

                const fname = document.getElementById('chk-fname').value;
                const lname = document.getElementById('chk-lname').value;
                const phone = document.getElementById('chk-phone').value;
                const email = document.getElementById('chk-email').value;
                const addr = document.getElementById('chk-addr').value;
                const city = document.getElementById('chk-city').value;
                const zip = document.getElementById('chk-zip').value;

                let newOrder = {
                    id: 'ORD' + Math.floor(Math.random() * 100000),
                    date: new Date().toISOString(),
                    status: 'Pending',
                    items: cart,
                    total: subtotal + tax + DELIVERY_FEE + SERVICE_CHARGE,
                    fees: {
                        tax: tax,
                        delivery: DELIVERY_FEE,
                        service: SERVICE_CHARGE
                    },
                    customer: {
                        name: fname + ' ' + lname,
                        phone: phone,
                        email: email,
                        address: addr + ', ' + city + ' ' + zip
                    },
                    paymentMethod: payString // <--- ADDED
                };

                orders.unshift(newOrder);
                localStorage.setItem('orders', JSON.stringify(orders));
                localStorage.removeItem('cart');

                // Simulate payment success and redirect
                window.location.href = 'index.html?order=success';
            }, isCard ? 1500 : 800); // Wait longer for card processing`;

if(checkoutHtml.match(submitLogicRegex)) {
    checkoutHtml = checkoutHtml.replace(submitLogicRegex, newSubmitLogic);
}

fs.writeFileSync('checkout.html', checkoutHtml, 'utf8');

// ==== 2. Fix admin.html ====
let adminHtml = fs.readFileSync('admin.html', 'utf8');

const looseRegex = /<p><strong>Address:<\/strong> \$\{order\.customer\.address\}<\/p>\\s*`;/;
const looseReplacement = '<p><strong>Address:</strong> ${order.customer.address}</p>\\n                    <div class="mt-2"><span class="inline-block px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded font-bold uppercase tracking-wide">Payment: ${order.paymentMethod || \\'Unknown\\'}</span></div>\\n                `;';
// wait, '\\'' caused the issue above, because it escaped in standard string parsing?
// Let's use backticks and double quotes carefully so no \\' is needed.

const safeReplacement = \`
                    <p><strong>Address:</strong> \${order.customer.address}</p>
                    <div class="mt-2"><span class="inline-block px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded font-bold uppercase tracking-wide">Payment: \${order.paymentMethod || 'Unknown'}</span></div>
                \`;\`;

adminHtml = adminHtml.replace(/<p><strong>Address:<\/strong> \$\{order\.customer\.address\}<\/p>\\s*\`\;/, safeReplacement);

fs.writeFileSync('admin.html', adminHtml, 'utf8');
console.log("Updated checkout.html and admin.html with payment methods and validation delays!");
