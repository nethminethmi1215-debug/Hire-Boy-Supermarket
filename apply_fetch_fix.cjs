const fs = require('fs');
const files = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html', 'product.html', 'cart.html', 'checkout.html', 'admin.html'];

const fixScript = `
    <!-- Fix for environments with fetch getters -->
    <script>
        try {
            const originalFetch = window.fetch;
            Object.defineProperty(window, 'fetch', {
                get: function() { return originalFetch; },
                set: function(val) { console.warn('Intercepted attempt to overwrite window.fetch'); },
                configurable: true
            });
        } catch (e) {
            console.log('Fetch fix applied or failed', e);
        }
    </script>
`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('Fix for environments with fetch getters')) {
        content = content.replace('<head>', '<head>' + fixScript);
        fs.writeFileSync(f, content, 'utf8');
    }
});
