const fs = require('fs');
let chk = fs.readFileSync('checkout.html', 'utf8');

const processCheckoutRegex = /function processCheckout\(event\) \{[\s\S]*\}\s*\n\s*\/\/\s*Initialize display/;

const newProcessCheckout = `function processCheckout(event) {
            event.preventDefault();

            // Validate form natively (HTML5 validation does this automatically, but we can enforce it here)
            const form = document.getElementById('checkout-form');
            if(!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const isCard = document.querySelector('input[name="paymentType"]:checked').value === 'card';
            const payString = isCard ? 'Paid via Card' : 'Cash on Delivery (COD)';
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
                    paymentMethod: payString,
                    fees: {
                        delivery: DELIVERY_FEE,
                        service: SERVICE_CHARGE,
                        tax: tax,
                        subtotal: subtotal,
                        total: subtotal + tax + DELIVERY_FEE + SERVICE_CHARGE
                    },
                    customer: {
                        name: fname + ' ' + lname,
                        phone: phone,
                        email: email,
                        address: addr + ', ' + city + ' ' + zip
                    }
                };

                orders.push(newOrder); // or unshift
                localStorage.setItem('orders', JSON.stringify(orders));
                localStorage.setItem('cart', JSON.stringify([]));
                updateCartCount();

                // Show Success Modal
                let modal = document.getElementById('success-modal');
                let modalContent = document.getElementById('success-modal-content');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                
                // tiny delay for animation
                setTimeout(() => {
                    modalContent.classList.remove('scale-95');
                    modalContent.classList.add('scale-100');
                }, 10);
            }, isCard ? 1500 : 800); // simulate processing wait
        }

        // Initialize display`;

chk = chk.replace(processCheckoutRegex, newProcessCheckout);
fs.writeFileSync('checkout.html', chk, 'utf8');

