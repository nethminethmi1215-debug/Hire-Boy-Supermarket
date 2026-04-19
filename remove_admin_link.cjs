const fs = require('fs');

const files = [
    'index.html', 'vegetables.html', 'drinks.html', 
    'groceries.html', 'organic.html', 'product.html', 
    'cart.html', 'checkout.html'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Remove the Admin button from the navigations, carefully avoiding to remove the cart
    const adminRegex = /<a href="admin\.html".*?<\/a>/s;
    content = content.replace(adminRegex, '');

    fs.writeFileSync(f, content, 'utf8');
});
