// index-supabase.js
// Updated index functionality using Supabase

document.addEventListener('DOMContentLoaded', async function() {
  // Wait for services to be ready
  await new Promise(resolve => {
    const checkServices = () => {
      if (typeof auth !== 'undefined' && typeof dataService !== 'undefined') {
        resolve();
      } else {
        setTimeout(checkServices, 100);
      }
    };
    checkServices();
  });

  // Redirect to login if not authenticated or mess not selected
  if (!auth.requireAuthAndMess()) {
    return;
  }

  // Get Started button scrolls to dashboard
  const getStartedBtn = document.getElementById('get-started-btn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function() {
      const dashboardSection = document.getElementById('dashboard');
      if (dashboardSection) {
        dashboardSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Show current user info in hero section
  const heroContent = document.querySelector('.hero-content');
  const user = auth.getCurrentUser();
  const mess = auth.getCurrentMess();
  if (heroContent && user && mess) {
    const info = document.createElement('p');
    info.style.marginTop = '0.5rem';
    info.style.color = 'var(--text-muted)';
    info.textContent = `Logged in as ${user.name} (${mess.role}) — Mess: ${mess.messName}`;
    heroContent.appendChild(info);
  }

  // Add logout link in navbar
  const navbar = document.querySelector('.navbar nav');
  if (navbar) {
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#logout';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      await auth.signOut();
      window.location.href = 'login.html';
    });
    navbar.appendChild(logoutBtn);
  }

  // Populate profile info
  const nameEl = document.getElementById('current-user-name');
  const emailEl = document.getElementById('current-user-email');
  const roleEl = document.getElementById('current-user-role');
  const messEl = document.getElementById('current-mess-id');
  
  if (user && mess) {
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = mess.role;
    if (messEl) messEl.textContent = mess.messName;
  }

  // Populate members overview
  await updateMembersOverview();

  // Initialize dashboard modules
  await initDeposits();
  await initDebtTracker();
  await initNoticeBoard();
  await initReviews();
});

async function updateMembersOverview() {
  const listEl = document.getElementById('members-overview-list');
  if (!listEl) return;

  try {
    const members = await dataService.getMembers();
    listEl.innerHTML = '';
    
    if (members.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No members added yet.';
      listEl.appendChild(li);
    } else {
      members.forEach(m => {
        const li = document.createElement('li');
        li.textContent = `${m.name} — ${m.email}`;
        listEl.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error loading members overview:', error);
    const li = document.createElement('li');
    li.textContent = 'Error loading members.';
    listEl.appendChild(li);
  }
}

// Deposits functionality for dashboard
async function initDeposits() {
  const depositForm = document.getElementById('deposit-form');
  if (!depositForm) return;

  // Populate member dropdown
  const memberSelect = document.getElementById('deposit-member');
  if (memberSelect) {
    try {
      const members = await dataService.getMembers();
      memberSelect.innerHTML = '<option value="">Select member</option>';
      
      if (members.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.textContent = 'No members yet';
        memberSelect.appendChild(opt);
      } else {
        members.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = `${m.name} (${m.email})`;
          memberSelect.appendChild(opt);
        });
      }
    } catch (error) {
      console.error('Error loading members for deposits:', error);
    }
  }

  // Default date to today
  const dateInput = document.getElementById('deposit-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // View deposit history button
  const historyBtn = document.getElementById('view-deposit-history');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      window.location.href = 'deposits.html';
    });
  }

  // Handle deposit form submission
  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.isManager()) { 
      alert('Only the manager can add or edit deposits'); 
      return; 
    }

    const memberId = memberSelect ? memberSelect.value : '';
    const amount = parseFloat(document.getElementById('deposit-amount').value || '0');
    const date = document.getElementById('deposit-date').value || new Date().toISOString().split('T')[0];

    if (!memberId) { 
      alert('Please select a member'); 
      return; 
    }
    if (!amount || amount <= 0) { 
      alert('Please enter a valid amount'); 
      return; 
    }

    try {
      const editingId = depositForm.dataset.editingId || null;
      if (editingId) {
        await dataService.updateDeposit(editingId, {
          memberId: memberId,
          amount: amount,
          date: date
        });
        delete depositForm.dataset.editingId;
        const submitBtn = depositForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add Deposit';
      } else {
        await dataService.addDeposit({
          memberId: memberId,
          amount: amount,
          date: date
        });
      }

      depositForm.reset();
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      
      // Update any deposit tables if they exist
      if (typeof updateDepositsTable === 'function') {
        await updateDepositsTable();
      }
    } catch (error) {
      console.error('Error saving deposit:', error);
      alert('Error saving deposit: ' + error.message);
    }
  });
}

// Debt tracker functionality for dashboard
async function initDebtTracker() {
  const debtForm = document.getElementById('debt-form');
  if (!debtForm) return;

  console.log('Debt tracker initialized');

  // Populate member select (payer only)
  const fromSel = document.getElementById('debt-from');
  if (fromSel) {
    try {
      const members = await dataService.getMembers();
      fromSel.innerHTML = '<option value="">From whom money was received</option>';
      
      members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.email})`;
        fromSel.appendChild(opt);
      });
    } catch (error) {
      console.error('Error loading members for debt tracker:', error);
    }
  }

  // Add debt request form submission
  debtForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fromId = fromSel ? fromSel.value : '';
    const amountVal = parseFloat(document.getElementById('debt-amount').value) || 0;
    
    if (!fromId || !amountVal || amountVal <= 0) { 
      alert('Please select member and enter a valid amount'); 
      return; 
    }

    try {
      await dataService.addDebtRequest({
        fromId: fromId,
        amount: amountVal,
        date: new Date().toISOString().split('T')[0]
      });

      // Update UI
      await updateDebtRequestsUI();
      
      // Reset form
      e.target.reset();
    } catch (error) {
      console.error('Error creating debt request:', error);
      alert('Error creating debt request: ' + error.message);
    }
  });

  // Initialize UI
  await updateDebtRequestsUI();
}

async function updateDebtRequestsUI() {
  const container = document.getElementById('debt-requests');
  if (!container) return;
  
  const countEl = document.getElementById('debt-request-count');
  const listEl = document.getElementById('debt-requests-list');

  try {
    const requests = await dataService.getDebtRequests();
    const currentUser = auth.getCurrentUser();
    
    // Filter pending requests where current user is involved
    const pending = requests.filter(r => 
      r.status === 'pending' && 
      (r.fromId === currentUser.id || r.toId === currentUser.id)
    );

    if (countEl) countEl.textContent = String(pending.length);
    
    if (listEl) {
      listEl.innerHTML = '';
      
      pending.forEach(r => {
        const row = document.createElement('div');
        row.innerHTML = `
          <div>${escapeHtml(r.fromName)} → ${escapeHtml(r.toName)} • ${r.amount} BDT • ${escapeHtml(r.date)}</div>
          <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
            ${r.fromId === currentUser.id ? `
              <button class="accept-debt" data-id="${r.id}">Accept</button>
              <button class="reject-debt" data-id="${r.id}">Reject</button>
            ` : ''}
          </div>
        `;
        listEl.appendChild(row);
      });

      // Add event listeners
      document.querySelectorAll('.accept-debt').forEach(btn => {
        btn.addEventListener('click', async function() {
          await acceptDebtRequest(this.getAttribute('data-id'));
        });
      });

      document.querySelectorAll('.reject-debt').forEach(btn => {
        btn.addEventListener('click', async function() {
          await rejectDebtRequest(this.getAttribute('data-id'));
        });
      });
    }
  } catch (error) {
    console.error('Error loading debt requests:', error);
    if (countEl) countEl.textContent = '0';
    if (listEl) listEl.innerHTML = '<div>Error loading debt requests</div>';
  }
}

async function acceptDebtRequest(id) {
  try {
    // Update request status
    await dataService.updateDebtRequest(id, { status: 'accepted' });
    
    // Get the request details
    const requests = await dataService.getDebtRequests();
    const request = requests.find(r => r.id === id);
    
    if (request) {
      // Add deposits for both parties
      await dataService.addDeposit({
        memberId: request.toId,
        amount: request.amount,
        date: request.date
      });
      
      await dataService.addDeposit({
        memberId: request.fromId,
        amount: -request.amount,
        date: request.date
      });
    }

    await updateDebtRequestsUI();
  } catch (error) {
    console.error('Error accepting debt request:', error);
    alert('Error accepting debt request: ' + error.message);
  }
}

async function rejectDebtRequest(id) {
  try {
    await dataService.updateDebtRequest(id, { status: 'denied' });
    await updateDebtRequestsUI();
  } catch (error) {
    console.error('Error rejecting debt request:', error);
    alert('Error rejecting debt request: ' + error.message);
  }
}

// Utility function for HTML escaping
function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;'
  })[s]);
}