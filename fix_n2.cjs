const fs = require('fs');
const htmlFiles = ['index.html', 'vegetables.html', 'drinks.html', 'groceries.html', 'organic.html', 'product.html', 'cart.html', 'checkout.html', 'admin.html'];

htmlFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace('\\n</body>', '\\n</body>'); // replaces the literal \n with an actual newline!
    // Wait, replacing '\\n</body>' with '\\n</body>'? That's no-op in JS string syntax.
    // To replace literal backslash and n:
    content = content.replace('\\\\n</body>', '\\n</body>'); 
    
    // Actually, maybe it is easier to replace `\\n</body>` string with just `</body>`.
    content = content.replace(/\\n<\/body>/g, '</body>');
    fs.writeFileSync(f, content, 'utf8');
});
