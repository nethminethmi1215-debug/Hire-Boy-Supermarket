const fs = require('fs');
const files = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html', 'cart.html', 'checkout.html', 'product.html', 'admin.html'];
const badScripts = [];

files.forEach(f => {
    const html = fs.readFileSync(f, 'utf8');
    const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
    if (scripts) {
        scripts.forEach((s, i) => {
            let code = s.replace('<script>', '').replace('</script>', '');
            try {
                new Function(code);
            } catch (e) {
                badScripts.push({ file: f, index: i, error: e.message, code: code.substring(0, 100) + '...' });
            }
        });
    }
});
console.log(JSON.stringify(badScripts, null, 2));
