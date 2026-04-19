const fs = require('fs');

let content = fs.readFileSync('cart.html', 'utf8');

// The replacement corruption started on line 189: "subtotalElement.innerText = '(id, delta) {"
// We should replace everything from "cartItemsDiv.innerHTML = html;" to "</script>" at the bottom, 
// and rewrite it cleanly.

const badRegex = /cartItemsDiv\.innerHTML = html;[\s\S]*?loadCart\(\);\s*<\/script>/;

const cleanCode = `cartItemsDiv.innerHTML = html;

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

        function changeQty(idx, delta) {
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
        }

        // Initialize display
        updateCartCount();
        loadCart();
    </script>`;

content = content.replace(badRegex, cleanCode);

// Remove duplicate closing body tags: html tag too
content = content.replace(/<\/body>\n<\/html>[\s\S]*$/, '</body>\n</html>');

fs.writeFileSync('cart.html', content, 'utf8');
