const fs = require('fs');
let chk = fs.readFileSync('checkout.html', 'utf8');

const pmtReplacement = `                        <!-- Payment Method Toggle -->
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
                                <input type="text" id="chk-cardnum" required placeholder="0000 0000 0000 0000" pattern="\\d{16}" title="Please enter exactly 16 digits" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Expiry Date</label>
                                <input type="text" id="chk-cardexp" required placeholder="MM/YY" pattern="(0[1-9]|1[0-2])/\\d{2}" title="Please enter as MM/YY" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">CVC</label>
                                <input type="text" id="chk-cardcvc" required placeholder="123" pattern="\\d{3,4}" title="Please enter 3 or 4 digit CVC" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                        </div>

                        <button id="submit-btn" type="submit" class="w-full bg-primary text-white text-center py-4 rounded-xl font-bold text-[16px] hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined">lock</span> Pay & Complete Order
                        </button>
                    </form>`;

chk = chk.replace(/<!-- Payment Information \(Dummy\) -->[\s\S]*?<\/form>/, pmtReplacement);

const newFunction = `
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
chk = chk.replace('function processCheckout(event) {', newFunction);

const oldLogic = /event\.preventDefault\(\);\s*\/\/\s*==== FEE CONFIGURATION[\s\S]*?window\.location\.href = 'index\.html\?order=success';/g;

const newLogic = `event.preventDefault();

            const isCard = document.querySelector('input[name="paymentType"]:checked').value === 'card';
            const payString = isCard ? 'Card Payment' : 'Cash on Delivery (COD)';
            const submitBtn = document.getElementById('submit-btn');

            // Button state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="animation: spin 1s linear infinite;">autorenew</span> Processing...';

            setTimeout(() => {
                const DELIVERY_FEE = 5.00;
                const SERVICE_CHARGE = 2.00;
                const TAX_RATE = 0.08;
                
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

                let newOrder = {
                    id: 'ORD' + Math.floor(Math.random() * 100000),
                    date: new Date().toISOString(),
                    status: 'Pending',
                    items: cart,
                    total: subtotal + tax + DELIVERY_FEE + SERVICE_CHARGE,
                    fees: { tax: tax, delivery: DELIVERY_FEE, service: SERVICE_CHARGE },
                    customer: {
                        name: document.getElementById('chk-fname').value + ' ' + document.getElementById('chk-lname').value,
                        phone: document.getElementById('chk-phone').value,
                        email: document.getElementById('chk-email').value,
                        address: document.getElementById('chk-addr').value + ', ' + document.getElementById('chk-city').value + ' ' + document.getElementById('chk-zip').value
                    },
                    paymentMethod: payString
                };

                orders.unshift(newOrder);
                localStorage.setItem('orders', JSON.stringify(orders));
                localStorage.removeItem('cart');

                window.location.href = 'index.html?order=success';
            }, isCard ? 1500 : 800);`;
            
chk = chk.replace(oldLogic, newLogic);
fs.writeFileSync('checkout.html', chk, 'utf8');

// Admin code
let adm = fs.readFileSync('admin.html', 'utf8');

const s1 = '<p><strong>Address:</strong> ${order.customer.address}</p>';
const s2 = s1 + '\\n                    <div class="mt-3"><span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold uppercase tracking-wider border border-yellow-200">Payment: ${order.paymentMethod || "Unknown"}</span></div>';

adm = adm.replace(s1, s2);
fs.writeFileSync('admin.html', adm, 'utf8');
