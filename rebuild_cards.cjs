const fs = require('fs');

const files = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html'];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // 1. Update the product card template inside renderProds (or renderFeatured)
    const regexTemplate = /grid\.innerHTML = ([a-zA-Z]+)\.map\([^`]*`[\s\S]*?`\)\.join\(''\);/g;
    
    const newTemplate = `grid.innerHTML = $1.map(p => {
            let pUnit = p.pricingUnit || (p.category.includes('drinks')?'L': (p.category.includes('groceries')?'packet':'kg'));
            let unitOps = (pUnit === 'kg' || pUnit === '100g') ? '<option value="kg">kg</option><option value="g">g</option>' : (pUnit === 'L' ? '<option value="L">L</option><option value="ml">ml</option>' : '<option value="packet">pkt</option>');
            let defVal = pUnit === 'packet' || pUnit === 'L' || pUnit === 'kg' ? '1' : '100';
            if (pUnit === '100g') defVal = '500'; // Default 500g for 100g items
            
            return \`
                <a href="product.html?id=\${p.id}" class="bg-lowest rounded-[16px] p-4 border border-outline flex flex-col gap-3 group hover:ambient-shadow transition-shadow pb-3">
                    <div class="w-full aspect-square bg-low rounded-xl flex items-center justify-center overflow-hidden">
                        <img src="\${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="\${p.name}">
                    </div>
                    <div>
                        <h4 class="font-bold text-[15px] mb-1 leading-tight text-gray-900">\${p.name}</h4>
                        <p class="text-[12px] text-gray-500 capitalize">\${p.category.replace(/ /g, ', ')}</p>
                    </div>
                    <div class="flex flex-col gap-2 mt-auto">
                        <div class="flex justify-between items-end">
                            <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-1">Per \${pUnit}</span>
                            <span class="font-[800] text-[18px] text-primary">$\${p.price.toFixed(2)}</span>
                        </div>
                        <div class="flex items-center gap-2" onclick="event.preventDefault()">
                            <div class="flex flex-1 items-center border border-outline rounded-lg bg-white overflow-hidden shadow-sm h-8">
                                <input type="number" id="qty-\${p.id}" value="\${defVal}" min="0.1" step="any" class="w-full text-[13px] pl-2 py-1 font-bold outline-none border-none text-gray-800 bg-transparent">
                                <select id="unit-\${p.id}" class="text-[12px] font-bold bg-transparent text-gray-500 outline-none cursor-pointer pr-1">
                                    \${unitOps}
                                </select>
                            </div>
                            <button onclick="addToCart(event, '\${p.id}')" class="bg-primary text-lowest shrink-0 px-3 h-8 rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors shrink-0">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                            </button>
                        </div>
                    </div>
                </a>
            \`;
        }).join('');`;

    content = content.replace(regexTemplate, newTemplate);

    // 2. Rewrite addToCart function entirely
    const addToCartRegex = /function addToCart\(e, id\) \{[\s\S]*?updateCartCount\(\);\s*\n\s*\}/;
    const newAddToCart = `function addToCart(e, id) {
            if(e) e.preventDefault();
            const prods = JSON.parse(localStorage.getItem('products') || '[]');
            const prod = prods.find(p => p.id === id);
            if(!prod) return;

            const qtyInput = document.getElementById(\`qty-\${id}\`);
            const unitSelect = document.getElementById(\`unit-\${id}\`);
            
            let amount = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
            let fallbackPUnit = prod.category.includes('drinks') ? 'L' : (prod.category.includes('groceries') ? 'packet' : 'kg');
            let selUnit = unitSelect ? unitSelect.value : (prod.pricingUnit === 'packet' || fallbackPUnit === 'packet' ? 'packet' : 'kg');

            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(i => i.id === id && i.reqUnit === selUnit);
            
            if(existing) {
                existing.amount += amount;
            } else {
                cart.push({ ...prod, pricingUnit: prod.pricingUnit || fallbackPUnit, amount: amount, reqUnit: selUnit }); // Note: 'qty' property replaced
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            if(e && e.currentTarget) {
                const btn = e.currentTarget;
                const origHtml = btn.innerHTML;
                btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
                btn.classList.replace('bg-primary', 'bg-emerald-600');
                setTimeout(() => {
                    btn.innerHTML = origHtml;
                    btn.classList.replace('bg-emerald-600', 'bg-primary');
                }, 1000);
            }
        }`;
    content = content.replace(addToCartRegex, newAddToCart);

    // 3. Update updateCartCount to use length instead of sum qty (since mix units)
    const updateCartRegex = /function updateCartCount\(\) \{[\s\S]*?reduce\(\(sum, item\) => sum \+ item\.qty, 0\);[\s\S]*?\}/;
    const newUpdateCart = `function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const countEl = document.getElementById('cart-count');
            if(countEl) countEl.textContent = cart.length; // Number of distinct entries
        }`;
    content = content.replace(updateCartRegex, newUpdateCart);

    fs.writeFileSync(f, content, 'utf8');
});
