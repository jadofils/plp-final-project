const express = require('express');
const router = express.Router();
const Product = require('../models/products.model');

router.post('/:categoryId/:userId', async (req, res) => {
  const { categoryId, userId } = req.params;
  const { product_name, price, stock } = req.body;

  try {
    // Ensure the user is authenticated and authorized
    if (!req.session.user || req.session.user._id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add product to database
    const newProduct = new Product({
      user_id: userId,
      category_id: categoryId,
      product_name,
      price,
      stock
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully!' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});





// Read all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('user_id').populate('category_id');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Read a single product by ID
router.get('/products/:userId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('user_id');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Update a product by ID
router.put('/:userId/:productId/', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { product_name, price, stock } = req.body;

    // Find the product and update it
    const updatedProduct = await Product.findByIdAndUpdate(
      productId, // Use productId to find the product
      { 
        product_name, 
        price, 
        stock, 
        updated_at: Date.now() 
      },
      { new: true } // Return the updated product
    ).populate('user_id');

    // Check if the product was found and updated
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product belongs to the user
    if (updatedProduct.user_id._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Send the updated product as a response
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete a product by ID
router.delete('/:productId/:userId', async (req, res) => {
  try {
    const { productId, userId } = req.params;

    // Find the product
    const product = await Product.findById(productId).populate('user_id');
    
    // Check if the product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product belongs to the user
    if (product.user_id._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    // Send success response
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
