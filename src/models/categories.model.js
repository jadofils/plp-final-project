const mongoose = require('mongoose');
const User = require('./user.model');

const categorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    category_name: {
        type: String,
        required: true        
    },
    description: {
        type: String,
        required: false // Optional, remove if description is always required
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    update_at: {
        type: Date,
        default: Date.now
    }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
