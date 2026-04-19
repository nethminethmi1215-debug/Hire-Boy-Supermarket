const fs = require('fs');

let content = fs.readFileSync('admin.html', 'utf8');

// Also inject calculateItemTotal
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
    content = content.replace('function viewOrder(id) {', calculateFunc + '\n        function viewOrder(id) {');
}

// 1. Update the order view modal
// we need to update order items loop inside viewOrder
const loopRegex = /order\.items\.forEach\(item => \{[\s\S]*?\}\);/;
const replaceLoop = `order.items.forEach(item => {
                const itemName = item.name || "Unknown Product";
                const itemImg = item.img || "https://dummyimage.com/100x100/e5e7eb/6b7280.png&text=X";
                const itemPrice = item.price || 0; 
                const fallbackPUnit = itemName.toLowerCase().includes('drink') ? 'L' : (itemName.toLowerCase().includes('grocer')||itemName.toLowerCase().includes('pasta') ? 'packet' : 'kg');
                const pUnit = item.pricingUnit || fallbackPUnit;

                // The item amount now is item.amount instead of item.qty
                const amt = item.amount || item.qty || 1;
                const rUnit = item.reqUnit || '';

                const lineTotal = calculateItemTotal(itemPrice, pUnit, amt, rUnit || pUnit);
                orderTotal += lineTotal;

                modalItemsHtml += \`
                    <tr class="border-b border-outline">
                        <td class="py-3 px-1 flex items-center gap-3">
                            <img src="\${itemImg}" class="w-10 h-10 rounded object-cover bg-surface shrink-0">
                            <div>
                                <span class="font-semibold text-gray-900 text-sm block">\${itemName}</span>
                                <span class="text-[11px] text-gray-500">$\${itemPrice.toFixed(2)} / \${pUnit}</span>
                            </div>
                        </td>
                        <td class="py-3 px-1 text-center font-bold text-gray-700">\${amt} \${rUnit}</td>
                        <td class="py-3 px-1 text-right font-bold text-gray-900">$\${lineTotal.toFixed(2)}</td>
                    </tr>
                \`;
            });`;

content = content.replace(loopRegex, replaceLoop);

// 2. Add Pricing Unit to adding products
const priceDivRegex = /<div>\s*<label class="block text-sm font-semibold text-gray-600 mb-2">Price \(\$\)<\/label>/;
const priceDivReplace = `<div>
                            <label class="block text-sm font-semibold text-gray-600 mb-2">Unit Type for Price</label>
                            <select id="prod-punit" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4">
                                <option value="kg">1 Kilogram (kg)</option>
                                <option value="100g">100 Grams (100g)</option>
                                <option value="L">1 Liter (L)</option>
                                <option value="packet">Packet / Piece</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-600 mb-2">Price ($)</label>`;

if (!content.includes('prod-punit')) {
    content = content.replace(priceDivRegex, priceDivReplace);
}

// 3. Update the `saveProduct` JS to serialize pricingUnit
const saveProd1 = `const img = document.getElementById('prod-img').value;`;
const saveProd1Repl = `const img = document.getElementById('prod-img').value;\n            const pUnit = document.getElementById('prod-punit').value;`;
if(!content.includes("pUnit = document.getElementById('prod-punit').value")) {
    content = content.replace(saveProd1, saveProd1Repl);
}

// updating arrays
content = content.replace(/prods\[existingIndex\] = \{ \.\.\.prods\[existingIndex\], name, category: cat, price, img, desc \};/, `prods[existingIndex] = { ...prods[existingIndex], name, category: cat, price, img, desc, pricingUnit: pUnit };`);
content = content.replace(/prods\.push\(\{ id, name, category: cat, price, img, desc, stock: 100 \}\);/, `prods.push({ id, name, category: cat, price, img, desc, stock: 100, pricingUnit: pUnit });`);

// 4. Update the `editProduct` JS to load pricingUnit
const editProdRegex = /document\.getElementById\('prod-price'\)\.value = prod\.price;/;
if(!content.includes("document.getElementById('prod-punit').value = prod.pricingUnit")) {
    content = content.replace(editProdRegex, `document.getElementById('prod-price').value = prod.price;\n            document.getElementById('prod-punit').value = prod.pricingUnit || 'kg';`);
}

// 5. Enhance Admin rendering to show pricing unit
const tableRowRegex = /<td class="py-4 px-4 font-semibold text-primary">\$[^\n]*?<\/td>/g;
content = content.replace(tableRowRegex, match => {
    return `<td class="py-4 px-4 font-semibold text-primary">$\${p.price.toFixed(2)} <span class="text-xs text-gray-500 font-normal">/ \${p.pricingUnit || 'kg'}</span></td>`;
});

fs.writeFileSync('admin.html', content, 'utf8');
