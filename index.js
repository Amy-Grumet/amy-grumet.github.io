let barChart;
document.querySelectorAll('.editable').forEach(cell => {
    cell.addEventListener('click', function() {
        if (this.querySelector('input')) return;

        let currentValue = this.innerHTML.trim();

        this.innerHTML = `<input type="text" value="${currentValue}" />`;

        let input = this.querySelector('input');
        input.focus();
        input.select();

        input.addEventListener('blur', function() {
            let newValue = input.value.trim();
            cell.innerHTML = newValue;
        });

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                input.blur(); 
            }
        });
    });
});

function addRowBudget() {
    const table = document.getElementById("budgetTable");
    const chartsContainer = document.getElementById("chartsContainer");
    const newRow = table.insertRow(-1); 

    const categoryCell = newRow.insertCell(0);
    const budgetedCell = newRow.insertCell(1);
    const spentCell = newRow.insertCell(2);
    const remainingCell = newRow.insertCell(3);

    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Enter Category';
    categoryCell.appendChild(categoryInput);
    budgetedCell.innerHTML = `<input type="number" placeholder="Enter Amount" step="0.01" class="budgeted-input" oninput="calculateRemaining()">`;
    spentCell.innerHTML = `<input type="number" placeholder="Enter Spent" step="0.01" class="spent-input" oninput="calculateRemaining(); updateBarChart()">`;
    remainingCell.innerHTML = `<span class="remaining-amount">$0.00</span>`;
    categoryCell.querySelector('input').focus();

    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add('chart-wrapper');
    const chartCanvas = document.createElement('canvas');
    chartWrapper.appendChild(chartCanvas);

    chartsContainer.appendChild(chartWrapper);

    newRow.chart = new Chart(chartCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Spent', 'Remaining'],
            datasets: [{
                label: 'Progress',
                data: [0, 100],
                backgroundColor: ['#FF6384', '#36A2EB']
            }]
        },
        options: {
            cutout: '80%', 
            responsive: true,
            maintainAspectRatio: false,
            plugins:{
                title: {
                    display: true,
                    text:'Category',
                    position: 'top',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    newRow.chartWrapper = chartWrapper;
    categoryInput.addEventListener('input', function() {
        const category = categoryInput.value
        newRow.chart.options.plugins.title.text = category;
        newRow.chart.update(); 
    });
}

function addRowPay() {
    const table = document.getElementById("payTable");
    const newRow = table.insertRow(-1);  

    const dateCell = newRow.insertCell(0);
    const amountCell = newRow.insertCell(1);

    dateCell.innerHTML = `<input type="text" placeholder="Enter Date" />`;
    amountCell.innerHTML = `<input type="number" placeholder="Enter Amount" class="pay-input" oninput="updateBarChart()"/>`;

    dateCell.querySelector('input').focus();
    saveUserData();
}

function delRowPay(){
    const table = document.getElementById("payTable");
    if(table.rows.length>1){
        table.deleteRow(-1);
        updateBarChart();
        saveUserData();
    }
}
function delRowBudget(){
    const table = document.getElementById("budgetTable");
    if(table.rows.length>1){
        var lastRow = table.rows[table.rows.length - 1];
        var chartWrapper = lastRow.chartWrapper;
        table.deleteRow(-1);
        saveUserData();
        if (chartWrapper && chartWrapper.parentNode) {
            chartWrapper.parentNode.removeChild(chartWrapper);
        }
    }
    saveUserData();
}
function addRowPurchase(){
    const table = document.getElementById("Purchases");
    const newRow = table.insertRow(-1);
    const itemCell = newRow.insertCell(0);
    const amountCell = newRow.insertCell(1);
    itemCell.innerHTML = `<input type="text" placeholder="Enter item" onblur="saveUserData()"/>`;
    amountCell.innerHTML = `<input type="number" class="amount-input" placeholder="Enter Amount" oninput="calculateTotal(); updateBarChart()"/>`;
    saveUserData();
}

function delRowPurchase(){
    const table = document.getElementById("Purchases");
    if(table.rows.length>1){
        table.deleteRow(-1);
        calculateTotal();
        updateBarChart();
    }
}

function calculateRemaining() {
    const table = document.getElementById("budgetTable");
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const budgetedInput = row.querySelector('.budgeted-input').value;
        const spentInput = row.querySelector('.spent-input').value;

        const budgetedAmount = parseFloat(budgetedInput) || 0;
        const spentAmount = parseFloat(spentInput) || 0;
        const remainingAmount = budgetedAmount - spentAmount;

        row.querySelector('.remaining-amount').textContent = `$${remainingAmount.toFixed(2)}`;

        const spentPercentage = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
        const remainingPercentage = 100 - spentPercentage;

        if (row.chart) {
            row.chart.data.datasets[0].data = [spentPercentage, remainingPercentage];
            row.chart.update();
        }
    }
    saveUserData();
}


function calculateTotal(){
    const table = document.getElementById("Purchases");
    let totalAmount = 0;
    for(let i = 1; i < table.rows.length; i++){
        const row = table.rows[i];
        const amountInput = row.querySelector('.amount-input');
        const purchaseAmount = parseFloat(amountInput.value) || 0;
        totalAmount += purchaseAmount;
    }
    document.getElementById('totalAmountDisplay').textContent = totalAmount.toFixed(2);
    saveUserData();
    return totalAmount;
}

function calculateTableTotal(selector) {
    const inputs = document.querySelectorAll(selector);
    let total = 0;

    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    saveUserData();
    return total;
}

function updateBarChart() {
    const payTotal = calculateTableTotal("#payTable .pay-input");
    const budgetTotal = calculateTableTotal("#budgetTable .spent-input"); 
    const purchaseTotal = calculateTotal();

    const totalSpent = budgetTotal + purchaseTotal;
    const totals = [payTotal, totalSpent];

    if (barChart) {
        barChart.destroy(); 
    }

    const ctx = document.getElementById('comparisonBarChart').getContext('2d');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Pay', 'Total Spent'], 
            datasets: [{
                data: totals, 
                backgroundColor: ['#50C878', '#DC143C'],
                borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false

                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


function saveUserData() {
    const budgetTable = document.getElementById('budgetTable');
    const payTable = document.getElementById('payTable');
    const purchasesTable = document.getElementById('Purchases');

    const budgetData = [];
    const payData = [];
    const purchasesData = [];

    for (let i = 1; i < budgetTable.rows.length; i++) {
        const row = budgetTable.rows[i];
        const category = row.cells[0].querySelector('input').value || '';
        const budgeted = row.cells[1].querySelector('input').value || '';
        const spent = row.cells[2].querySelector('input').value || '';
        budgetData.push({ category, budgeted, spent });
    }

    for (let i = 1; i < payTable.rows.length; i++) {
        const row = payTable.rows[i];
        const date = row.cells[0].querySelector('input').value || '';
        const amount = row.cells[1].querySelector('input').value || '';
        payData.push({ date, amount });
    }

    for (let i = 1; i < purchasesTable.rows.length; i++) {
        const row = purchasesTable.rows[i];
        const item = row.cells[0].querySelector('input').value || '';
        const amount = row.cells[1].querySelector('input').value || '';
        purchasesData.push({ item, amount });
    }

    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    localStorage.setItem('payData', JSON.stringify(payData));
    localStorage.setItem('purchasesData', JSON.stringify(purchasesData));
}

function loadUserData() {
    const budgetData = JSON.parse(localStorage.getItem('budgetData')) || [];
    const payData = JSON.parse(localStorage.getItem('payData')) || [];
    const purchasesData = JSON.parse(localStorage.getItem('purchasesData')) || [];

    budgetData.forEach(item => {
        addRowBudget(); 
        const lastRow = document.getElementById('budgetTable').rows[document.getElementById('budgetTable').rows.length - 1];
        lastRow.cells[0].querySelector('input').value = item.category;
        lastRow.cells[1].querySelector('input').value = item.budgeted;
        lastRow.cells[2].querySelector('input').value = item.spent;
        calculateRemaining(); 
    });

    payData.forEach(item => {
        addRowPay(); 
        const lastRow = document.getElementById('payTable').rows[document.getElementById('payTable').rows.length - 1];
        lastRow.cells[0].querySelector('input').value = item.date;
        lastRow.cells[1].querySelector('input').value = item.amount;
    });

    purchasesData.forEach(item => {
        addRowPurchase(); 
        const lastRow = document.getElementById('Purchases').rows[document.getElementById('Purchases').rows.length - 1];
        lastRow.cells[0].querySelector('input').value = item.item;
        lastRow.cells[1].querySelector('input').value = item.amount;
    });

    calculateRemaining();
    calculateTotal();
    updateBarChart();
}
window.onload = function() {
    loadUserData(); 
};
