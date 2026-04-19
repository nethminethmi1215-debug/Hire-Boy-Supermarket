const fs = require('fs');

const calcScript = `
        function calculateItemTotal(productBasePrice, pricingUnit, amount, reqUnit) {
            let cost = 0;
            if (pricingUnit === 'kg') {
                if (reqUnit === 'kg') cost = productBasePrice * amount;
                else if (reqUnit === 'g') cost = productBasePrice * (amount / 1000);
            } else if (pricingUnit === '500g') {
                if (reqUnit === 'kg') cost = productBasePrice * (amount * 2);
                else if (reqUnit === 'g') cost = productBasePrice * (amount / 500);
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

        function calcCardPreview(id) {
            const prods = JSON.parse(localStorage.getItem('products') || '[]');
            const p = prods.find(x => x.id === id);
            if (!p) return;
            const amtBox = document.getElementById('qty-' + id);
            const unitBox = document.getElementById('unit-' + id);
            const previewBox = document.getElementById('prev-price-' + id);
            if (!amtBox || !unitBox || !previewBox) return;

            const amt = parseFloat(amtBox.value) || 0;
            const reqUnit = unitBox.value;
            const fallbackPUnit = p.category.includes('drinks') ? 'L' : (p.category.includes('groceries') ? 'packet' : 'kg');
            const pUnit = p.pricingUnit || fallbackPUnit;

            const cost = calculateItemTotal(p.price, pUnit, amt, reqUnit);
            
            if (amt > 0) {
                previewBox.innerText = 'Total: $' + cost.toFixed(2);
            } else {
                previewBox.innerText = '';
            }
        }
`;

const files = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html'];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    if (!content.includes('function calcCardPreview(id) {')) {
        content = content.replace('function addToCart', calcScript + '\n        function addToCart');
    }

    // Replace the specific card template inside mapping
    const cardTemplateRegex = /grid\.innerHTML = ([a-zA-Z]+)\.map[^<]*<a href="product\.html\?id=\${p\.id}"[\s\S]*?<\/a>\s*`\)\.join\(''\);/g;
    
    // We update the card template string internally
    // Note: To be safe, we rebuild the whole string
    
    const newTemplate = `grid.innerHTML = $1.map(p => {
            let pUnit = p.pricingUnit || (p.category.includes('drinks')?'L': (p.category.includes('groceries')?'packet':'kg'));
            let unitOps = (pUnit === 'kg' || pUnit === '100g' || pUnit === '500g') ? '<option value="kg">kg</option><option value="g">g</option>' : (pUnit === 'L' ? '<option value="L">L</option><option value="ml">ml</option>' : '<option value="packet">pkt</option>');
            let defVal = pUnit === 'packet' || pUnit === 'L' || pUnit === 'kg' ? '1' : '100';
            if (pUnit === '100g') defVal = '500'; // Default 500g for 100g items
            if (pUnit === '500g') defVal = '500';
            
            // Calc initial preview based on default value
            let initialCost = 0;
            if (defVal) {
                let initReq = (pUnit === 'kg' || pUnit==='L' || pUnit === 'packet') ? pUnit : (pUnit === '100g' || pUnit === '500g' ? 'g' : pUnit);
                if (pUnit === 'kg') initReq = 'kg'; // default is 1 kg
                if (pUnit === 'L') initReq = 'L'; // default is 1 L
                initialCost = calculateItemTotal(p.price, pUnit, parseFloat(defVal), initReq);
            }

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
                            <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-1">Base: $\${p.price.toFixed(2)} per \${pUnit}</span>
                        </div>
                        <div class="flex flex-col gap-1" onclick="event.preventDefault()">
                            <div class="flex items-center gap-2">
                                <div class="flex flex-1 items-center border border-outline rounded-lg bg-white overflow-hidden shadow-sm h-8">
                                    <input type="number" id="qty-\${p.id}" oninput="calcCardPreview('\${p.id}')" value="\${defVal}" min="0.1" step="any" class="w-full text-[13px] pl-2 py-1 font-bold outline-none border-none text-gray-800 bg-transparent">
                                    <select id="unit-\${p.id}" onchange="calcCardPreview('\${p.id}')" class="text-[12px] font-bold bg-transparent text-gray-500 outline-none cursor-pointer pr-1">
                                        \${unitOps}
                                    </select>
                                </div>
                                <button onclick="addToCart(event, '\${p.id}')" class="bg-primary text-lowest shrink-0 px-3 h-8 rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                            <div id="prev-price-\${p.id}" class="text-primary font-bold text-sm text-right min-h-[20px]">
                                Total: $\${initialCost.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </a>
            \`;
        }).join('');`;

    content = content.replace(cardTemplateRegex, newTemplate);
    fs.writeFileSync(f, content, 'utf8');
});
