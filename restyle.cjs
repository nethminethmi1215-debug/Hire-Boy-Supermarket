const fs = require('fs');

const files = [
    'index.html', 'vegetables.html', 'drinks.html', 
    'groceries.html', 'organic.html', 'product.html', 
    'cart.html', 'checkout.html', 'admin.html'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // 1. Update Tailwind config & basic styles
    content = content.replace(
        /colors: { primary: '#0b6b1d'.*?}/,
        "colors: { primary: '#10b981', 'primary-dark': '#059669', secondary: '#fbbf24', surface: '#f9fafb', lowest: '#ffffff', low: '#f3f4f6', outline: '#e5e7eb', text: '#1f2937', 'text-light': '#6b7280' }"
    );
    content = content.replace(
        /fontFamily: { headline: \['Plus Jakarta Sans'.*?}/,
        "fontFamily: { headline: ['Inter', '-apple-system', 'sans-serif'], body: ['Inter', '-apple-system', 'sans-serif'] }"
    );
    
    content = content.replace(/'Plus Jakarta Sans'/g, "'Inter'");
    content = content.replace(/background-color: #f9f9f9/g, "background-color: #f9fafb");
    content = content.replace(/color: #1a1c1c/g, "color: #1f2937");
    content = content.replace(/rgba\(191,202,185,0.15\)/g, "#e5e7eb");
    content = content.replace(/box-shadow: 0 12px 32px rgba\(26,28,28,0.06\)/g, "box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)");
    content = content.replace(/h1, h2, h3, h4, h5, h6.*?}/, "h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif; letter-spacing: -0.02em; }");

    // 2. Navigation header layout
    content = content.replace(
        'class="bg-lowest/80 backdrop-blur-2xl sticky top-0 z-50 ambient-shadow"',
        'class="bg-lowest sticky top-0 z-50 border-b border-outline flex items-center h-[72px]"'
    );
    content = content.replace(
        'class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"',
        'class="max-w-7xl w-full mx-auto px-10 flex justify-between items-center"'
    );
    content = content.replace(
        /class="text-2xl font-black text-primary flex items-center gap-2"/,
        'class="text-[24px] font-[800] text-primary flex items-center gap-[12px] uppercase tracking-[-1px]"'
    );
    content = content.replace(
        /<span class="material-symbols-outlined"(.*?)>eco<\/span>/,
        '<span style="background: var(--primary, #10b981); color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 20px" class="material-symbols-outlined">eco</span>'
    );

    // Links update
    content = content.replace(/font-headline font-bold text-gray-600/g, 'font-semibold text-[14px] text-gray-800');
    content = content.replace(/font-headline font-bold text-primary/g, 'font-semibold text-[14px] text-primary');
    
    // Cart update
    const cartRegex = /<a href="cart\.html".*?<\/a>/s;
    content = content.replace(cartRegex, 
        `<a href="cart.html" class="flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-outline font-semibold text-sm hover:border-primary transition-colors text-gray-800">
                    <span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                    Cart (<span id="cart-count">0</span>)
                </a>`
    );

    // Sidebar admin link fix (if any issue)
    content = content.replace(
        /class="text-xs font-semibold bg-low hover:bg-outline px-3 py-1\.5 rounded-full text-gray-600 flex items-center gap-1 transition-colors"/,
        'class="text-xs font-semibold bg-low hover:bg-outline px-4 py-2 rounded-full text-gray-600 flex items-center gap-1 transition-colors"'
    );

    fs.writeFileSync(f, content, 'utf8');
});
