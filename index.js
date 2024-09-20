const express = require('express');
const session = require('express-session');
const mongo = require('./src/controllers/connection');
const path = require('path');
const User = require('./src/models/user.model');
const users = require('./src/routes/users');
const logout=require('./src/routes/logout')
const login = require('./src/routes/login');
const categoryRoute=require('./src/routes/category')
const Category=require('./src/models/categories.model')
const expenseRoute=require('./src/routes/expenses');
const Expense = require('./src/models/expenses.model');
const productsRoute=require('./src/routes/productsRoutes')
const Product = require('./src/models/products.model');
const PaymentMethod = require('./src/models/payment.model');
const Budget = require('./src/models/budget.model');
const paymentRoute=require('./src/routes/paymentmethod')
const budgetRoute=require('./src/routes/budget')
const nodemailer = require('nodemailer');

const dashboardUpdatedDatAFiltered=require('./src/routes/dashboardUpdateData');
const { appendFile } = require('fs');
const app = express();

// Add this middleware to handle the _method query
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Route handlers
app.use('/api/users', users);
app.use('/api/login', login);
app.use('/api/logout', logout);
app.use('/api/category',categoryRoute)
app.use('/api/expense',expenseRoute)
app.use('/api/products',productsRoute)
app.use('/api/payments',paymentRoute)
app.use('/api/budgets',budgetRoute)
app.use('/api/dashboard/category',dashboardUpdatedDatAFiltered)




// Serve register.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html')); // Adjust the path as needed
});

app.post('/api/send-advice', async (req, res) => {
  const { name, senderEmail, recipientEmail, message } = req.body;
console.log('recipient is:',recipientEmail)
  // Validate recipient email before proceeding
  if (!recipientEmail || recipientEmail.trim() === '') {
    return res.status(400).json({ message: 'Recipient email is required' });
  }

  // Create a transporter object with your Gmail credentials and app password
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: senderEmail, // Sender's Gmail address from form
          pass: 'ogea ptqw iuvs mred', // Your App Password for Nodemailer
      },
  });

  // Setup email data
  const mailOptions = {
      from: senderEmail, // Sender's email
      to: recipientEmail, // Recipient's email
      subject: `Advice from ${name}`,
      text: message,
  };

  try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send email' });
  }
});






app.get('/api/dashboard', async (req, res) => {
  if (req.session.user) {
      try {
          const userId = req.session.user._id;
          const categoryCount = await Category.countDocuments({ user_id: userId }); // Count categories for the user
          const categories = await Category.find({ user_id: userId }); // Fetch categories for the user

          // Fetch necessary data concurrently, filtering by user_id
          const [
              totalProductPrice,
              totalExpenseAmount,
              users // Fetch users here
          ] = await Promise.all([
              Product.aggregate([
                  { $match: { user_id: userId } }, // Filter by user_id
                  { $group: { _id: null, totalPrice: { $sum: '$price' } } }
              ]),
              Expense.aggregate([
                  { $match: { user_id: userId } }, // Filter by user_id
                  { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
              ]),
              User.find() // Fetch all users
          ]);

          const totalProductPriceValue = totalProductPrice.length > 0 ? totalProductPrice[0].totalPrice : 0;
          const totalExpenseAmountValue = totalExpenseAmount.length > 0 ? totalExpenseAmount[0].totalAmount : 0;
          const totalRevenueValue = totalProductPriceValue - totalExpenseAmountValue;

          // Set session data
          req.session.totalProductPrice = totalProductPriceValue;
          req.session.totalExpenseAmount = totalExpenseAmountValue;
          req.session.totalRevenue = totalRevenueValue;
          req.session.categoryCount = categoryCount;
          req.session.categories = categories; // Set categories in session
          req.session.users = users; // Set users in session

          // Render the dashboard view with the fetched data
          res.render('dashboard', {
              user: req.session.user,
              userId,
              totalProductPrice: req.session.totalProductPrice,
              totalExpenseAmount: req.session.totalExpenseAmount,
              totalRevenue: req.session.totalRevenue,
              categoryCount: req.session.categoryCount,
              categories: req.session.categories,
              users: req.session.users // Pass users to EJS
          });
      } catch (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  } else {
      req.session.message = 'Please log in to access the dashboard.';
      res.redirect('/api/login');
  }
});



app.get('/view/users-list', async (req, res) => {
  if (req.session.user) {
    try {
      const userId = req.session.user._id; // Assuming user ID is stored in session
      const users = await User.find(); // Replace with your actual function to fetch users
      
      res.render('viewAllUsers', {
        user: req.session.user,
        users: users, // Pass users data to the EJS template
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    req.session.message = 'Please log in to access the dashboard.';
    res.redirect('/api/login');
  }
});

app.get('/view/update-user/:userId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(400).json({ message: 'User Not Authenticated. Try to Login' });
    }

    const { userId } = req.params;
    const userExist = await User.findById(userId);

    if (!userExist) {
      return res.status(401).json({ message: 'User Not Found In DB Model' });
    }

    req.session.user = userExist; // This line updates the session user to the user being edited.
    
    res.render('userUpdationForm', { user: req.session.user }); // Fixed: changed `this.render` to `res.render`
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error!!' });
  }
});









app.get('/api/update/:userId', async (req, res) => {
  const { userId } = req.params; // Extract userId from params

  if (req.session.user) {
    try {
      // Fetch the user details using the userId
      const userExist = await User.findById(userId);

      if (!userExist) {
        return res.status(404).json({ message: 'User not found!' });
      }

      // Store the user data in the session
      req.session.userData = {
        _id:userExist._id,
        username: userExist.username, // Fix typo
        email: userExist.email,
        password: userExist.password
      };

      // Render the 'update' view with the user data
      res.render('updateUser', { usersdata: req.session.userData }); // Ensure 'update.ejs' exists in your views folder
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    req.session.message = 'Please log in to access the dashboard.';
    res.redirect('/api/login');
  }
});


// Category Form Route
app.get('/api/category-form/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
   // Render the category form with the userId
    res.render('addCategoryForm', { userId});
  } catch (error) {
    console.error('Error rendering category form:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Route to get all categories for the logged-in user and store them in session
app.get('/view/category', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
      const userId = req.session.user._id;

      // Fetch all categories for the logged-in user from the database
      const categories = await Category.find({ user_id: userId });

      // Store the categories in the session
      req.session.categories = categories;

      // Render the category form (or view) with the categories
      res.render('viewCategories', { categories,userId });
  } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Error fetching categories.' });
  }
});



app.get('/view/add-expense/:userId/:categoryId', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const userId = req.params.userId;
    const categoryId = req.params.categoryId;

    // Fetch expenses for the user
    const expenses = await Expense.find({ user_id: userId });

    // Fetch categories for the logged-in user only
    const categories = await Category.find({ user_id: userId });

    // Fetch the specific category for the logged-in user
    const selectedCategory = await Category.findOne({ _id: categoryId, user_id: userId });

    if (selectedCategory) {
      // Set session variables
      req.session.userId = userId;
      req.session.categoryId = categoryId;
      req.session.categoryName = selectedCategory.category_name; // Store only the name
      console.log('Name is:', req.session.categoryName);
      console.log('Category ID is:', categoryId);
    } else {
      return res.status(404).json({ message: 'Category not found for the user.' });
    }

    // Render the add expense form view with the expenses and categories data
    res.render('addExpenseForm', {
      expenses,
      userId,
      categoryId,
      categories,
      categoryName: req.session.categoryName // Pass category name to view
    });
  } catch (error) {
    console.error('Error fetching expenses or category:', error);
    res.status(500).json({ message: 'Error fetching expenses or category.' });
  }
});


app.get('/view/expense', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const userId = req.session.user._id;

    // Fetch all expenses for the logged-in user from the database
    const expenses = await Expense.find({ user_id: userId });
    // Fetch categories for the logged-in user
    const categories = await Category.find({ user_id: userId });

    // Store the expenses in the session
    req.session.expenses = expenses;

    // Render the expense view with the fetched expenses and categories
    res.render('viewExpense', { expenses, userId, categories });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses.' });
  }
});



app.get('/api/expense/:user_id/:category_id/:_id', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
      const { user_id, category_id, _id } = req.params;

      // Fetch the specific expense for the logged-in user from the database
      const expense = await Expense.findOne({ user_id, category_id, _id });

      if (!expense) {
          return res.status(404).json({ message: 'Expense not found.' });
      }

      // Store the expense in the session
      req.session.expenses = [expense]; // Storing as an array for consistency

      // Render the expense view with the fetched expense
      res.render('updateExpense', { expenses: [expense] });
  } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({ message: 'Error fetching expense.' });
  }
});


app.get('/view/add-product', async (req, res) => {
  // Ensure the user is logged in
  if (!req.session.user) {
    return res.redirect('/api/login'); // Redirect to login if not authenticated
  }

  const userId = req.session.user._id.toString();
  const categoryId = req.query.categoryId || ''; // Get categoryId from query parameters or default to an empty string

  // Store categoryId in the session
  req.session.categoryId = categoryId;

  try {
    // Fetch products for the logged-in user (if needed for the form)
    const products = await Product.find({ user_id: userId });

    // Fetch all categories for the logged-in user
    const categories = await Category.find({ user_id: userId });

    // Render the add product form with products, categories, and user details
    res.render('addProductForm', { 
      products, 
      userId, 
      categoryId,
      categories // Pass categories to the view
    });
  
  } catch (error) {
    console.error('Error fetching products or categories:', error);
    res.status(500).json({ message: 'Error fetching products or categories.' });
  }
});





app.get('/view/products/:userId/list', async (req, res) => {
  const { userId } = req.params;
  const categoryId = req.query.categoryId; // Get categoryId from query parameters

  // Ensure the user is logged in
  if (!req.session.user) {
    return res.redirect('/api/login'); // Redirect to login if not authenticated
  }

  // Check if the userId from the parameters matches the logged-in user
  if (req.session.user._id.toString() !== userId) {
    return res.status(403).json({ message: 'Unauthorized access.' });
  }

  // Set categoryId in session (optional, based on your application logic)
  req.session.categoryId = categoryId;

  try {
    // Fetch the list of products based on userId and categoryId
    const query = { user_id: userId };
    if (categoryId) {
      query.category_id = categoryId; // Apply category filter if categoryId is provided
    }

    const products = await Product.find(query);

    // Render the view with the fetched products
    res.render('viewproducts', {
      products,     // Pass the products to the view
      userId,       // Pass the userId to the view (if needed)
      categoryId    // Pass the categoryId to the view (if needed)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products.' });
  }
});





app.get('/view/products/:productId/:userId/edit', async (req, res) => {
  const { userId, productId } = req.params;

  // Ensure the userId from the parameters matches the logged-in user
  if (!req.session.user || req.session.user._id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access.' });
  }

  try {
      // Fetch the specific product based on userId and productId
      const product = await Product.findOne({
          _id: productId,
          user_id: userId
      });

      // Check if the product is found
      if (!product) {
          return res.status(404).json({ message: 'Product not found.' });
      }

      // Render the view with the fetched product
      res.render('update-product', {
          product,  // Pass the product to the view
          userId    // Pass the userId to the view (if needed)
      });
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product.' });
  }
});

// Route to render the addPayment.ejs view
app.get('/view/add-payment', (req, res) => {
  // Check if user is logged in by verifying the existence of session user ID
  if (!req.session || !req.session.user || !req.session.user._id) {
      return res.redirect('/api/login'); // Redirect to login if user is not logged in
  }

  const userId = req.session.user._id; // Get userId from session

  // Render the addPayment.ejs view and pass the userId
  res.render('addPayment', { userId });
});

app.get('/view/payments', async (req, res) => {
  // Check if user is logged in by verifying the existence of session user ID
  if (!req.session || !req.session.user || !req.session.user._id) {
    return res.redirect('/api/login'); // Redirect to login if user is not logged in
  }

  const userId = req.session.user._id; // Get userId from session

  try {
    // Fetch payments for the logged-in user
    const payments = await PaymentMethod.find({ user_id: userId }).exec(); // Added exec() for better handling

    if (!payments.length) {
      console.warn('No payments found for user:', userId);
    }

    // Render the view and pass the payments data
    res.render('viewPayments', { payments });
  } catch (error) {
    console.error('Failed to retrieve payments:', error);
    return res.status(500).json({ message: 'Server error while retrieving payments' });
  }
});


// Render update payment page
app.get('/view/update-payment/:id', async (req, res) => {
  const paymentId = req.params.id;

  try {
      // Fetch payment method details
      const payment = await PaymentMethod.findById(paymentId);

      if (!payment) {
          return res.status(404).render('404', { message: 'Payment method not found' }); // Render a 404 page or similar
      }

      // Render the update payment page with the payment data
      res.render('update-payment', { payment });
  } catch (error) {
      console.error('Failed to retrieve payment method for update', error);
      res.status(500).render('500', { message: 'Server error while retrieving payment method' }); // Render a 500 page or similar
  }
});

// Route to render the add budget form
app.get('/view/add-budget', async (req, res) => {
  try {
      // Get user ID from the session
      const userId = req.session.user._id;

      // Fetch categories associated with the user
      const categories = await Category.find({ user_id: userId });

      // Fetch the selected category ID from the query parameters if available
      const categoryId = req.query.categoryId || ''; // Use an empty string as default

      // Render the add-budget.ejs view and pass userId, categories, and categoryId to the template
      res.render('add-budget', { userId: userId, categories: categories, categoryId: categoryId });
  } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).send('Internal Server Error');
  }
});


// Route to view all budgets for the logged-in user
app.get('/view/budget-list', async (req, res) => {
  try {
      if (!req.session.user) {
          return res.redirect('/api/login'); // Redirect to login if not logged in
      }

      const userId = req.session.user._id;

      // Fetch budgets for the logged-in user
      const budgets = await Budget.find({ user_id: userId });

      // Store the budget data in the session (optional)
      req.session.budgets = budgets;

      // Render a view to display the budgets
      res.render('viewBudget', { budgets });
  } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).send('Server Error');
  }
});

// Route to render the Update Budget form
app.get('/view/update-budget/:budgetId', async (req, res) => {
  try {
      if (!req.session.user) {
          return res.redirect('/api/login'); // Redirect to login if not logged in
      }

      const userId = req.session.user._id;
      const budgetId = req.params.budgetId;

      // Find the budget by ID
      const budget = await Budget.findOne({ _id: budgetId, user_id: userId });

      if (!budget) {
          return res.status(404).send('Budget not found');
      }

      // Pass the budget data and any additional data (like categories) to the EJS template
      const categories = await Category.find({ user_id: userId }); // Assuming you have a Category model
      res.render('update-budget', { budget, categories });
  } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).send('Internal Server Error');
  }
});



app.get('/report', async (req, res) => {
  try {
      if (req.session.user) {
          const userId = req.session.user._id;

          // Fetch all data related to the logged-in user
          const user = await User.findById(userId);
          const expenses = await Expense.find({ user_id: userId }).populate('category_id');
          const categories = await Category.find({ user_id: userId });
          const products = await Product.find({ user_id: userId }).populate('category_id');
          const budgets = await Budget.find({ user_id: userId }).populate('category_id');
          const paymentMethods = await PaymentMethod.find({ user_id: userId });

          // Render the report view with fetched data
          res.render('report', { user, expenses, categories, products, budgets, paymentMethods });
      } else {
          // If the user is not logged in, redirect to the login page
          res.redirect('/login');
      }
  } catch (error) {
      console.error('Error fetching report data:', error);
      res.status(500).send('Error fetching report data');
  }
});


app.get('/settings', async (req, res) => {
  if (req.session.user) {
    try {
      const userId = req.session.user.id;
      const user = await User.findById(userId);  // Fetch logged-in user
      const users = await User.find();           // Fetch all users

      // Render the settings view, passing the logged-in user's details and all users
      res.render('settings', { user: req.session.user, users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/login'); // Redirect if not logged in
  }
});

module.exports = app;
