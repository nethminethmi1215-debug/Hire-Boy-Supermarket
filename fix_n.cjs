const fs = require('fs');

const htmlFiles = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html', 'product.html', 'cart.html', 'checkout.html', 'admin.html'];

htmlFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Find literal \n
    content = content.replace(/\\n<\/body>/g, '\\n</body>');
    fs.writeFileSync(f, content, 'utf8');
});
