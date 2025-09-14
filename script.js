document.addEventListener('DOMContentLoaded', () => {
    // Page switching
    const homeLink = document.getElementById('home-link');
    const summaryLink = document.getElementById('summary-link');
    const calculatorPage = document.getElementById('calculator-page');
    const summaryPage = document.getElementById('summary-page');

    // Theme switcher
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Form elements
    const expenseForm = document.getElementById('expense-form');
    const expenseDescription = document.getElementById('expense-description');
    const expenseAmount = document.getElementById('expense-amount');
    const expenseCategory = document.getElementById('expense-category');
    const expenseDate = document.getElementById('expense-date');
    const expenseList = document.getElementById('expense-list');

    // Summary elements
    const totalExpenseEl = document.getElementById('total-expense');
    const topCategoryEl = document.getElementById('top-category');
    const spendingPunEl = document.getElementById('spending-pun');
    const summaryMonthYearEl = document.getElementById('summary-month-year');
    
    // Charts
    let categoryPieChart;
    let dailyBarChart;

    // Data store
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // --- INITIALIZATION ---
    function init() {
        // Set default date to today
        expenseDate.valueAsDate = new Date();
        
        // Load and apply theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        body.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';

        // Render initial data
        renderExpenses();
        updateSummary();
    }
    
    // --- THEME SWITCHER ---
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        // Re-render charts for new theme
        updateSummary();
    });

    // --- NAVIGATION ---
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        calculatorPage.classList.add('active');
        summaryPage.classList.remove('active');
        homeLink.classList.add('active');
        summaryLink.classList.remove('active');
    });

    summaryLink.addEventListener('click', (e) => {
        e.preventDefault();
        summaryPage.classList.add('active');
        calculatorPage.classList.remove('active');
        summaryLink.classList.add('active');
        homeLink.classList.remove('active');
        updateSummary(); // Always update summary when viewing the page
    });

    // --- EXPENSE HANDLING ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newExpense = {
            id: Date.now(),
            description: expenseDescription.value,
            amount: parseFloat(expenseAmount.value),
            category: expenseCategory.value,
            date: expenseDate.value,
        };

        expenses.push(newExpense);
        saveAndRender();
        expenseForm.reset();
        expenseDate.valueAsDate = new Date(); // Reset date to today after submission
    });

    expenseList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            expenses = expenses.filter(expense => expense.id !== id);
            saveAndRender();
        }
    });

    function saveAndRender() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
    }

    function renderExpenses() {
        expenseList.innerHTML = '';
        if (expenses.length === 0) {
            expenseList.innerHTML = '<li>No expenses logged yet. Add one above!</li>';
            return;
        }

        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="expense-item-details">
                    <span class="expense-description">${expense.description}</span>
                    <span class="expense-category-date">${expense.category} · ${new Date(expense.date).toLocaleDateString()}</span>
                </div>
                <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                <button class="delete-btn" data-id="${expense.id}">🗑️</button>
            `;
            expenseList.appendChild(li);
        });
    }

    // --- SUMMARY & CHARTS ---
    function updateSummary() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        summaryMonthYearEl.textContent = now.toLocaleString('default', { month: 'long', year: 'long' });

        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalExpenseEl.textContent = `$${total.toFixed(2)}`;

        // Category breakdown
        const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        // Top category
        let topCategory = 'N/A';
        let maxAmount = 0;
        for (const category in categoryTotals) {
            if (categoryTotals[category] > maxAmount) {
                maxAmount = categoryTotals[category];
                topCategory = category;
            }
        }
        topCategoryEl.textContent = topCategory;

        // Spending Pun
        spendingPunEl.textContent = getSpendingPun(total);
        
        // Update charts
        renderPieChart(categoryTotals);
        renderBarChart(monthlyExpenses);
    }
    
    function getSpendingPun(total) {
        if (total === 0) return "Just getting started? Let's make it rain... responsibly.";
        if (total < 100) return "Looking good! Your wallet is practically singing.";
        if (total < 500) return "Making it happen! You're an economic engine.";
        if (total < 1000) return "Are you treating yourself? Because you should.";
        if (total < 2000) return "Your credit card is getting a workout. Hope it's been stretching!";
        return "Wow, a true patron of the economy! Your transactions are legendary.";
    }

    function renderPieChart(categoryData) {
        const ctx = document.getElementById('category-pie-chart').getContext('2d');
        const isDarkMode = body.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#e2e8f0' : '#1a202c';

        const data = {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#4A55E0', '#F6AD55', '#48BB78', '#ED8936', '#38B2AC', '#9F7AEA', '#ECC94B'],
                borderColor: isDarkMode ? '#2d3748' : '#ffffff',
                borderWidth: 2,
            }]
        };
        
        if (categoryPieChart) {
            categoryPieChart.destroy();
        }

        categoryPieChart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor
                        }
                    }
                }
            }
        });
    }

    function renderBarChart(monthlyExpenses) {
        const ctx = document.getElementById('daily-bar-chart').getContext('2d');
        const isDarkMode = body.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#e2e8f0' : '#1a202c';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const dailyTotals = Array(daysInMonth).fill(0);
        
        monthlyExpenses.forEach(expense => {
            const day = new Date(expense.date).getDate() - 1; // 0-indexed
            dailyTotals[day] += expense.amount;
        });

        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const data = {
            labels: labels,
            datasets: [{
                label: 'Daily Spending',
                data: dailyTotals,
                backgroundColor: 'rgba(74, 85, 224, 0.6)',
                borderColor: '#4A55E0',
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
        
        if (dailyBarChart) {
            dailyBarChart.destroy();
        }

        dailyBarChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: 'transparent' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Run on load
    init();
});