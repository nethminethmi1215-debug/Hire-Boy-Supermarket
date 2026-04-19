const fs = require('fs');

let content = fs.readFileSync('product.html', 'utf8');

// Also inject calculateItemTotal into product.html just in case, but addToCart here only adds to storage, doesn't need to calculate total.

const priceDisplayRegex = /<h2 class="text-3xl font-headline font-bold text-primary mb-6" id="p-price"><\/h2>/;
content = content.replace(priceDisplayRegex, `<div class="flex items-end mb-6 gap-2">
                            <h2 class="text-3xl font-headline font-bold text-primary" id="p-price"></h2>
                            <span class="text-gray-500 font-bold mb-1" id="p-unit-text"></span>
                        </div>`);

const addToCartContainerRegex = /<div class="flex flex-col gap-2">[\s\S]*?<\/div>[\s\S]*?<button onclick="addToCart\(\)"/;
const newAddToCartC = `<div class="bg-low p-6 rounded-2xl flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-700">Quantity Required</label>
                    <div class="flex items-stretch border-2 border-outline rounded-xl bg-white overflow-hidden max-w-[200px] h-[52px]">
                        <input type="number" id="qty-detail" value="1" min="0.1" step="any" class="w-1/2 px-4 text-center font-bold text-lg outline-none border-r-2 border-outline">
                        <select id="unit-detail" class="w-1/2 text-sm font-bold bg-transparent text-gray-700 outline-none cursor-pointer px-4">
                        </select>
                    </div>
                </div>
                <button onclick="addToCart()"`;
content = content.replace(addToCartContainerRegex, newAddToCartC);

// Update load logic
const loadProdNameRegex = /document\.getElementById\('p-name'\)\.innerText = currentProduct\.name;/;
content = content.replace(loadProdNameRegex, `document.getElementById('p-name').innerText = currentProduct.name;
            
            const pUnit = currentProduct.pricingUnit || (currentProduct.category.includes('drinks')?'L': (currentProduct.category.includes('groceries')?'packet':'kg'));
            document.getElementById('p-unit-text').innerText = 'per ' + pUnit;
            
            const unitS = document.getElementById('unit-detail');
            if(pUnit === 'kg' || pUnit === '100g') {
                unitS.innerHTML = '<option value="kg">kg</option><option value="g">g</option>';
            } else if(pUnit === 'L') {
                unitS.innerHTML = '<option value="L">Liters</option><option value="ml">ml</option>';
            } else {
                unitS.innerHTML = '<option value="packet">packet(s)</option>';
            }
            
            const defVal = (pUnit === 'packet' || pUnit === 'L' || pUnit === 'kg') ? '1' : '500';
            document.getElementById('qty-detail').value = defVal;
`);

// Update add to cart function
const addToCartRegex = /function addToCart\(\) \{[\s\S]*?updateCartCount\(\);\s*/;
const newAddToCart = `function addToCart() {
            if(!currentProduct) return;
            
            let amount = parseFloat(document.getElementById('qty-detail').value) || 1;
            let selUnit = document.getElementById('unit-detail').value;
            let fallbackPUnit = currentProduct.category.includes('drinks') ? 'L' : (currentProduct.category.includes('groceries') ? 'packet' : 'kg');

            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(i => i.id === currentProduct.id && i.reqUnit === selUnit);
            if (existing) {
                existing.amount += amount;
            } else {
                cart.push({ ...currentProduct, pricingUnit: currentProduct.pricingUnit || fallbackPUnit, amount: amount, reqUnit: selUnit });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();`;
content = content.replace(addToCartRegex, newAddToCart);

// Ensure updateCartCount is length based
content = content.replace(/function updateCartCount\(\) \{[\s\S]*?reduce\(\(sum, item\) => sum \+ item\.qty, 0\);[\s\S]*?\}/, `function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const countEl = document.getElementById('cart-count');
            if(countEl) countEl.textContent = cart.length;
        }`);

fs.writeFileSync('product.html', content, 'utf8');
