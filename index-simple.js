// index-simple.js
// Simplified dashboard functionality

let authService = null;
let dataService = null;

// Wait for dependencies
async function waitForDependencies() {
  let attempts = 0;
  while (attempts < 100) {
    if (typeof supabase !== 'undefined' && typeof auth !== 'undefined' && typeof dataService !== 'undefined') {
      authService = auth;
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard loading...');
  
  const loaded = await waitForDependencies();
  if (!loaded) {
    alert('Failed to load application. Please refresh the page.');
    return;
  }
  
  // Wait for services to initialize
  if (authService.waitForInit) {
    await authService.waitForInit();
  }
  if (dataService.waitForInit) {
    await dataService.waitForInit();
  }
  
  // Check authentication
  if (!authService.isAuthenticated() || !authService.getCurrentMess()) {
    window.location.href = 'login.html';
    return;
  }
  
  initializeDashboard();
});

function initializeDashboard() {
  console.log('Initializing dashboard...');
  
  // Load user info
  loadUserInfo();
  
  // Setup forms
  setupDepositForm();
  setupDebtForm();
  setupNoticeForm();
  setupReviewForm();
  
  // Load data
  loadMembersOverview();
  loadNotices();
  loadReviews();
  
  console.log('Dashboard initialized');
}

function loadUserInfo() {
  const user = authService.getCurrentUser();
  const mess = authService.getCurrentMess();
  
  if (user && mess) {
    const nameEl = document.getElementById('current-user-name');
    const emailEl = document.getElementById('current-user-email');
    const roleEl = document.getElementById('current-user-role');
    const messEl = document.getElementById('current-mess-id');
    
    if (nameEl) nameEl.textContent = user.name || 'N/A';
    if (emailEl) emailEl.textContent = user.email || 'N/A';
    if (roleEl) roleEl.textContent = mess.role || 'member';
    if (messEl) messEl.textContent = mess.messName || 'N/A';
  }
}

async function loadMembersOverview() {
  try {
    const members = await dataService.getMembers();
    const listEl = document.getElementById('members-overview-list');
    
    if (listEl && members) {
      listEl.innerHTML = members.map(member => 
        `<li>${member.name} (${member.role})</li>`
      ).join('');
    }
  } catch (error) {
    console.error('Failed to load members:', error);
  }
}

function setupDepositForm() {
  const form = document.getElementById('deposit-form');
  const memberSelect = document.getElementById('deposit-member');
  const viewHistoryBtn = document.getElementById('view-deposit-history');
  
  // Load members for deposit form
  loadMembersForSelect(memberSelect);
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const memberId = memberSelect.value;
      const amount = document.getElementById('deposit-amount').value;
      const date = document.getElementById('deposit-date').value;
      
      if (!memberId || !amount || !date) {
        alert('Please fill all fields.');
        return;
      }
      
      try {
        await dataService.addDeposit({ memberId, amount: parseFloat(amount), date });
        alert('Deposit added successfully!');
        form.reset();
      } catch (error) {
        alert('Failed to add deposit: ' + error.message);
      }
    });
  }
  
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      window.location.href = 'deposits.html';
    });
  }
}

function setupDebtForm() {
  const form = document.getElementById('debt-form');
  const fromSelect = document.getElementById('debt-from');
  
  // Load members for debt form
  loadMembersForSelect(fromSelect);
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fromId = fromSelect.value;
      const amount = document.getElementById('debt-amount').value;
      
      if (!fromId || !amount) {
        alert('Please fill all fields.');
        return;
      }
      
      try {
        await dataService.addDebtRequest({ fromId, amount: parseFloat(amount) });
        alert('Debt request added successfully!');
        form.reset();
        loadDebtRequests();
      } catch (error) {
        alert('Failed to add debt request: ' + error.message);
      }
    });
  }
  
  // Load debt requests
  loadDebtRequests();
}

async function loadDebtRequests() {
  try {
    const requests = await dataService.getDebtRequests();
    const countEl = document.getElementById('debt-request-count');
    const listEl = document.getElementById('debt-requests-list');
    
    if (countEl) {
      countEl.textContent = requests.filter(r => r.status === 'pending').length;
    }
    
    if (listEl) {
      const pendingRequests = requests.filter(r => r.status === 'pending');
      listEl.innerHTML = pendingRequests.map(request => 
        `<div style="margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 3px;">
          ${request.fromName} → You: $${request.amount}
        </div>`
      ).join('');
    }
  } catch (error) {
    console.error('Failed to load debt requests:', error);
  }
}

function setupNoticeForm() {
  const section = document.getElementById('notice');
  const textarea = section?.querySelector('textarea');
  const button = section?.querySelector('button');
  
  if (button && textarea) {
    button.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        alert('Please enter a notice.');
        return;
      }
      
      try {
        await dataService.addNotice(text);
        alert('Notice posted successfully!');
        textarea.value = '';
        loadNotices();
      } catch (error) {
        alert('Failed to post notice: ' + error.message);
      }
    });
  }
}

async function loadNotices() {
  try {
    const notices = await dataService.getNotices();
    const ticker = document.querySelector('.ticker-track');
    
    if (ticker && notices.length > 0) {
      ticker.innerHTML = notices.map(notice => 
        `<span style="margin-right: 50px;">${notice.text} - ${notice.authorName}</span>`
      ).join('');
    }
  } catch (error) {
    console.error('Failed to load notices:', error);
  }
}

function setupReviewForm() {
  const form = document.getElementById('review-form');
  const timeInput = document.getElementById('review-time');
  
  // Set current time
  if (timeInput) {
    timeInput.value = new Date().toLocaleString();
  }
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('review-name').value.trim();
      const university = document.getElementById('review-university').value.trim();
      const text = document.getElementById('review-text').value.trim();
      
      if (!name || !university || !text) {
        alert('Please fill all fields.');
        return;
      }
      
      try {
        await dataService.addReview({ name, university, text });
        alert('Review submitted successfully!');
        form.reset();
        if (timeInput) timeInput.value = new Date().toLocaleString();
        loadReviews();
      } catch (error) {
        alert('Failed to submit review: ' + error.message);
      }
    });
  }
}

async function loadReviews() {
  try {
    const reviews = await dataService.getReviews();
    const container = document.getElementById('reviews-list');
    
    if (container && reviews) {
      container.innerHTML = reviews.slice(0, 6).map(review => 
        `<div class="testimonial-card">
          <p>"${review.text}"</p>
          <div class="testimonial-author">
            <strong>${review.name}</strong><br>
            <small>${review.university}</small>
          </div>
        </div>`
      ).join('');
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

async function loadMembersForSelect(selectElement) {
  if (!selectElement) return;
  
  try {
    const members = await dataService.getMembers();
    selectElement.innerHTML = '<option value="">Select member</option>' + 
      members.map(member => 
        `<option value="${member.id}">${member.name}</option>`
      ).join('');
  } catch (error) {
    console.error('Failed to load members for select:', error);
  }
}