document.addEventListener('DOMContentLoaded', () => {
    // Get the charts element
    const charts = document.getElementById('charts');
    // Get sidebar items
    const customers = document.getElementById('customers');
    const products = document.getElementById('products');
    const category = document.getElementById('category');
    const expenses = document.getElementById('expenses');
    const payments = document.getElementById('payments');
    const budgets = document.getElementById('budgets');
    const reports = document.getElementById('reports');
    const statistics = document.getElementById('statistics');
    const settings = document.getElementById('settings');

    const sideBarList = [
        customers, products, category,
        expenses, payments, budgets,
        reports, statistics, settings
    ];

    // Add click event listeners to each sidebar item
    sideBarList.forEach(item => {
        item.addEventListener('click', () => {
            charts.style.display = 'none';
        });
    });
});


