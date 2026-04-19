const fs = require('fs');

const formRegex = /<h2 class="font-headline text-2xl font-bold mb-6">Shipping Information<\/h2>[\s\S]*?<!-- Payment Information/;

const newForm = `<h2 class="font-headline text-2xl font-bold mb-6">Shipping Information</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">First Name</label>
                                <input type="text" id="chk-fname" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Last Name</label>
                                <input type="text" id="chk-lname" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Phone Number</label>
                                <input type="tel" id="chk-phone" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                                <input type="email" id="chk-email" class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Address</label>
                                <input type="text" id="chk-addr" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">City</label>
                                <input type="text" id="chk-city" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-600 mb-2">Postal Code</label>
                                <input type="text" id="chk-zip" required class="w-full bg-low border border-outline rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            </div>
                        </div>

                        <!-- Payment Information`;

let checkout = fs.readFileSync('checkout.html', 'utf8');
checkout = checkout.replace(formRegex, newForm);

const processRegex = /orders\.push\(\{[\s\S]*?id: 'ORD-' \+ Math.floor\(Math\.random\(\) \* 1000000\),/
const checkoutProcessAdd = `const fname = document.getElementById('chk-fname').value;
            const lname = document.getElementById('chk-lname').value;
            const phone = document.getElementById('chk-phone').value;
            const email = document.getElementById('chk-email').value;
            const addr = document.getElementById('chk-addr').value;
            const city = document.getElementById('chk-city').value;
            const zip = document.getElementById('chk-zip').value;

            orders.push({
                id: 'ORD-' + Math.floor(Math.random() * 1000000),
                customer: {
                    name: fname + ' ' + lname,
                    phone: phone,
                    email: email,
                    address: addr + ', ' + city + ' ' + zip
                },`;

checkout = checkout.replace(processRegex, checkoutProcessAdd);
fs.writeFileSync('checkout.html', checkout, 'utf8');

// Admin panel updates
let admin = fs.readFileSync('admin.html', 'utf8');

const orderModalBodyRegex = /<h2 id="modal-order-id" class="font-headline text-2xl font-bold text-gray-900"><\/h2>\s*<p id="modal-order-date" class="text-gray-500 text-sm mt-1"><\/p>/;
const orderModalReplace = `<h2 id="modal-order-id" class="font-headline text-2xl font-bold text-gray-900"></h2>
                <p id="modal-order-date" class="text-gray-500 text-sm mt-1"></p>
                <div id="modal-order-customer" class="mt-4 p-4 bg-low rounded-xl text-sm text-gray-700"></div>`;

admin = admin.replace(orderModalBodyRegex, orderModalReplace);

const viewOrderRegex = /document\.getElementById\('modal-order-date'\)\.innerText = new Date\(order\.date\)\.toLocaleString\(\);/;
const customerInject = `document.getElementById('modal-order-date').innerText = new Date(order.date).toLocaleString();
            
            if (order.customer) {
                document.getElementById('modal-order-customer').innerHTML = \`
                    <p><strong>Customer:</strong> \${order.customer.name}</p>
                    <p><strong>Phone:</strong> <a href="tel:\${order.customer.phone}" class="text-primary hover:underline">\${order.customer.phone}</a></p>
                    <p><strong>Address:</strong> \${order.customer.address}</p>
                \`;
                document.getElementById('modal-order-customer').classList.remove('hidden');
            } else {
                document.getElementById('modal-order-customer').classList.add('hidden');
            }
`;

admin = admin.replace(viewOrderRegex, customerInject);

// Add 500g to Admin Product select
admin = admin.replace('<option value="100g">100 Grams (100g)</option>', '<option value="100g">100 Grams (100g)</option>\n                                <option value="500g">500 Grams (500g)</option>');

fs.writeFileSync('admin.html', admin, 'utf8');
