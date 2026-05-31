

let transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
let pageHistory = [{ page: 1 }]; 

function initApp() {
    const selector = document.getElementById('monthSelector');
    if (!selector.value) {
        let now = new Date();
        selector.value = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0');
    }
    if (!document.getElementById('dateIn').value) {
        let d = new Date();
        document.getElementById('dateIn').value = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }
    renderSummary();
    renderGroupLists();
    
    // Dropdown စာရင်းဟောင်းကြီးတွေ အောက်ကို ဆင်းမလာအောင် ပိတ်လိုက်ခြင်း
    const nameInput = document.getElementById('nameIn');
    const noteInput = document.getElementById('noteIn');
    if(nameInput) nameInput.setAttribute('autocomplete', 'on'); 
    if(noteInput) noteInput.setAttribute('autocomplete', 'on');

    window.history.replaceState({ step: 1 }, "");
}

function navigateTo(pageState) {
    pageHistory.push(pageState);
    window.history.pushState({ step: pageHistory.length }, "");
    renderCurrentState();
}

window.onpopstate = function(event) {
    if (pageHistory.length > 1) {
        pageHistory.pop();
        renderCurrentState();
    }
};

function renderCurrentState() {
    const currentState = pageHistory[pageHistory.length - 1];
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page' + currentState.page).classList.add('active');
    
    if (currentState.page === 1) {
        renderSummary();
        renderGroupLists();
    } else if (currentState.page === 2) {
        if (currentState.type === 'firstLevel') buildFirstLevel(currentState.filterType, currentState.value);
        else if (currentState.type === 'typePage') buildTypePage(currentState.viewType);
        else if (currentState.type === 'finalLevel') buildFinalLevel(currentState.filterType, currentState.value, currentState.viewType);
        else if (currentState.type === 'monthlyBalancePage') buildMonthlyBalancePage();
    }
}

function addNewTransaction() {
    const dateStr = document.getElementById('dateIn').value.trim();
    const name = document.getElementById('nameIn').value.trim();
    const note = document.getElementById('noteIn').value.trim();
    const amount = parseInt(document.getElementById('amountIn').value);
    const type = document.getElementById('typeIn').value;

    if(dateStr && name && amount) {
        const parts = dateStr.split('/');
        let monthKey = (parts.length === 3) ? parts[2] + "-" + parts[1].padStart(2, '0') : "";
        transactions.push({ id: Date.now(), date: dateStr, monthKey: monthKey, name: name, type: type, amount: amount, note: note });
        saveData();
        clearFields();
        alert("စာရင်းသွင်းပြီးပါပြီ");
    } else { alert("အချက်အလက်ပြည့်စုံစွာဖြည့်ပါ"); }
}

function saveData() {
    localStorage.setItem('myTransactions', JSON.stringify(transactions));
    renderCurrentState();
}

function renderSummary() {
    const m = document.getElementById('monthSelector').value;
    const currentData = transactions.filter(t => t.monthKey === m);
    const inc = currentData.filter(t => t.type === 'income').reduce((s,t)=> s+t.amount, 0);
    const exp = currentData.filter(t => t.type === 'expense').reduce((s,t)=> s+t.amount, 0);
    document.getElementById('totalIncome').innerText = inc.toLocaleString();
    document.getElementById('totalExpense').innerText = exp.toLocaleString();
    if(document.getElementById('monthBalance')) document.getElementById('monthBalance').innerText = (inc - exp).toLocaleString();
    const allInc = transactions.filter(t => t.type === 'income').reduce((s,t)=> s+t.amount, 0);
    const allExp = transactions.filter(t => t.type === 'expense').reduce((s,t)=> s+t.amount, 0);
    if(document.getElementById('mainOverallBalance')) document.getElementById('mainOverallBalance').innerText = (allInc - allExp).toLocaleString();
}

function renderGroupLists() {
    const m = document.getElementById('monthSelector').value;
    const data = transactions.filter(t => t.monthKey === m);
    const names = [...new Set(data.map(t => t.name))];
    document.getElementById('memberListContainer').innerHTML = names.map(n => {
        const sum = data.filter(t => t.name === n).reduce((s,t)=> s + (t.type==='income'?t.amount:-t.amount), 0);
        return `<div class="list-item" onclick="showFirstLevel('name', '${n}')"><span>${n}</span><b>${sum.toLocaleString()}</b></div>`;
    }).join('') || '<p style="text-align:center;padding:10px;color:#888;">မရှိပါ။</p>';
    const notes = [...new Set(data.map(t => t.note).filter(n => n !== ""))];
    document.getElementById('noteListContainer').innerHTML = notes.map(n => {
        const sum = data.filter(t => t.note === n).reduce((s,t)=> s+t.amount, 0);
        return `<div class="list-item" onclick="showFirstLevel('note', '${n}')"><span>${n}</span><b>${sum.toLocaleString()}</b></div>`;
    }).join('') || '<p style="text-align:center;padding:10px;color:#888;">မရှိပါ။</p>';
}

function showFirstLevel(filterType, value) { navigateTo({ page: 2, type: 'firstLevel', filterType: filterType, value: value }); }
function showTypePage(type) { navigateTo({ page: 2, type: 'typePage', viewType: type }); }
function showFinalLevel(filterType, value, type) { navigateTo({ page: 2, type: 'finalLevel', filterType: filterType, value: value, viewType: type }); }

function buildFirstLevel(filterType, value) {
    const m = document.getElementById('monthSelector').value;
    const data = transactions.filter(t => t.monthKey === m && t[filterType] === value);
    document.getElementById('detailTitle').innerText = value;
    const types = [...new Set(data.map(t => t.type))];
    document.getElementById('detailListContents').innerHTML = types.map(type => {
        const typeSum = data.filter(t => t.type === type).reduce((s,t)=> s+t.amount, 0);
        return `<div class="list-item" onclick="showFinalLevel('${filterType}', '${value}', '${type}')"><span>${type === 'income' ? 'ဝင်ငွေ' : 'ထွက်ငွေ'}</span><b>${typeSum.toLocaleString()}</b></div>`;
    }).join('');
}

function buildTypePage(type) {
    const m = document.getElementById('monthSelector').value;
    const data = transactions.filter(t => t.monthKey === m && t.type === type);
    const grouped = data.reduce((acc, t) => { acc[t.name] = (acc[t.name] || 0) + t.amount; return acc; }, {});
    document.getElementById('detailTitle').innerText = type === 'income' ? "ဝင်ငွေစာရင်း" : "ထွက်ငွေစာရင်း";
    document.getElementById('detailListContents').innerHTML = Object.keys(grouped).map(name => {
        return `<div class="list-item" onclick="showFinalLevel('name', '${name}', '${type}')"><span>${name}</span><b>${grouped[name].toLocaleString()}</b></div>`;
    }).join('') || '<p style="text-align:center;padding:40px;">မရှိပါ။</p>';
}

function buildFinalLevel(filterType, value, type) {
    const m = document.getElementById('monthSelector').value;
    const data = transactions.filter(t => t.monthKey === m && t[filterType] === value && t.type === type);
    document.getElementById('detailTitle').innerText = value + " (" + (type==='income'?'ဝင်ငွေ':'ထွက်ငွေ') + ")";
    document.getElementById('detailListContents').innerHTML = data.map(t => `
        <div class="detail-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>ရက်စွဲ: <b>${t.date}</b></span>
                <b style="color:${t.type==='income'?'green':'red'}">${t.amount.toLocaleString()}</b>
            </div>
            <div style="margin: 8px 0; font-size: 14px; color: #666;">မှတ်ချက်: ${t.note || '-'}</div>
            <div class="btn-group">
                <button class="del-btn" style="width:100%;" onclick="deleteItem(${t.id})">ဖျက်ရန်</button>
            </div>
        </div>
    `).join('');
}

function showMonthlyBalances() { navigateTo({ page: 2, type: 'monthlyBalancePage' }); }

function buildMonthlyBalancePage() {
    document.getElementById('detailTitle').innerText = "လအလိုက် လက်ကျန်စာရင်းများ";
    const allMonths = [...new Set(transactions.map(t => t.monthKey))].filter(m => m !== "").sort().reverse();
    document.getElementById('detailListContents').innerHTML = allMonths.map(m => {
        const monthData = transactions.filter(t => t.monthKey === m);
        const inc = monthData.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
        const exp = monthData.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
        const balance = inc - exp;
        return `<div class="list-item"><span>${m}</span><b>${balance.toLocaleString()}</b></div>`;
    }).join('') || '<p style="text-align:center;padding:40px;">မရှိပါ။</p>';
}

function deleteItem(id) {
    if(confirm("ဖျက်မှာ သေချာပါသလား?")) { 
        transactions = transactions.filter(t => t.id !== id); 
        saveData(); 
        goBack(); 
    }
}

function clearFields() { document.getElementById('nameIn').value = ''; document.getElementById('noteIn').value = ''; document.getElementById('amountIn').value = ''; }

window.onload = initApp;
