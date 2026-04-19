const fs = require('fs');

const files = [
    'index.html', 'vegetables.html', 'drinks.html', 
    'groceries.html', 'organic.html'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Pattern to match grid.innerHTML assignment inside both renderFeatured and renderProds
    // It captures everything from grid.innerHTML = ... up to join('');
    const regex = /grid\.innerHTML = [a-zA-Z]+\.map\(p => `[\s\S]*?`\)\.join\(''\);/g;
    
    const newTemplate = `grid.innerHTML = prodsList.map(p => \`\n                <a href="product.html?id=\${p.id}" class="bg-lowest rounded-[16px] p-4 border border-outline flex flex-col gap-3 group hover:ambient-shadow transition-shadow pb-3">\n                    <div class="w-full aspect-square bg-low rounded-xl flex items-center justify-center overflow-hidden">\n                        <img src="\${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="\${p.name}">\n                    </div>\n                    <div>\n                        <h4 class="font-bold text-[15px] mb-1 leading-tight text-gray-900">\${p.name}</h4>\n                        <p class="text-[12px] text-gray-500 capitalize">\${p.category.replace(/ /g, ', ')}</p>\n                    </div>\n                    <div class="flex justify-between items-center mt-1">\n                        <div class="font-[800] text-[18px] text-primary">$\${p.price.toFixed(2)}</div>\n                        <button onclick="addToCart(event, '\${p.id}')" class="bg-primary text-lowest w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors">\n                            <span class="material-symbols-outlined text-[20px] pointer-events-none">add</span>\n                        </button>\n                    </div>\n                </a>\n            \`).join('');`;
    
    content = content.replace(regex, match => {
        // We need to keep the original array variable name
        let arrNameMatch = match.match(/grid\.innerHTML = ([a-zA-Z]+)\.map/);
        let arrName = arrNameMatch ? arrNameMatch[1] : 'filtered';
        return newTemplate.replace('prodsList', arrName);
    });

    fs.writeFileSync(f, content, 'utf8');
});
