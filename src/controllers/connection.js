const mongoose = require('mongoose');
// initializeModels.js
const User = require('../models/user.model');
const Category = require('../models/categories.model');
const PaymentMethod = require('../models/payment.model');
const Expense = require('../models/expenses.model');
const Budget = require('../models/budget.model');
const Products = require('../models/products.model');

const url = 'mongodb+srv://jasezikeye50:Sezikeye%4012@backenddb.vku5w.mongodb.net/?retryWrites=true&w=majority&appName=backenddb';

const mongo = mongoose.connect(url)
    .then(() => {
        
        console.log('Connected to MongoDB!');

        // Import and start the server after connecting to MongoDB
        const app = require('../../index'); // Import the app from server.js
        app.listen(3000, () => {
            console.log('Server running on port: http://localhost:3000/');
        });
        
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
    });

module.exports = mongo;
