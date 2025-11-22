// script-supabase.js
// Updated script to use Supabase instead of localStorage

// Wait for services to be ready
let servicesReady = false;
const waitForServices = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (typeof auth !== 'undefined' && typeof dataService !== 'undefined') {
        servicesReady = true;
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

// Auth helpers (updated to use Supabase)
function isAuthenticated() { return auth.isAuthenticated(); }
function getCurrentUser() { return auth.getCurrentUser(); }
function getCurrentMess() { return auth.getCurrentMess(); }
function requireAuthAndMess() { return auth.requireAuthAndMess(); }
function logout() { auth.signOut(); }
function isManagerRole() { return auth.isManager(); }

// Utility functions
function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;'
  })[s]);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Member Management Functionality
async function initMemberManagement() {
  await waitForServices();
  
  const memberContainer = document.querySelector('.member-container');
  if (!memberContainer) return;

  if (!requireAuthAndMess()) return;

  console.log('Member management initialized');

  // Update UI based on role
  const isManager = isManagerRole();
  const removeInfoCard = document.querySelector('.member-form');
  if (removeInfoCard) {
    const headingEl = removeInfoCard.querySelector('h2');
    const paragraphEl = removeInfoCard.querySelector('p');
    if (isManager) {
      if (headingEl) headingEl.textContent = 'Remove Member';
      if (paragraphEl) paragraphEl.textContent = 'Select a member from the list below and click Delete.';
    } else {
      if (headingEl) headingEl.textContent = 'Remove Member (Manager Only)';
      if (paragraphEl) paragraphEl.textContent = 'This feature is only available to the mess manager.';
    }
  }

  // Add member form (manager only)
  const memberForm = document.getElementById('member-form');
  if (memberForm) {
    if (!isManager) {
      memberForm.style.display = 'none';
    } else {
      memberForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('member-name').value;
        const email = document.getElementById('member-email').value;
        const phone = document.getElementById('member-phone').value;
        const notes = document.getElementById('member-notes').value;

        if (!name || !email) {
          alert('Please fill all required fields');
          return;
        }

        try {
          // Note: Adding members requires them to sign up first
          // This is a limitation of the current design
          alert('Members must sign up and join the mess using the mess name and password.');
          memberForm.reset();
        } catch (error) {
          console.error('Error adding member:', error);
          alert('Error adding member: ' + error.message);
        }
      });
    }
  }

  await updateMembersList();
}

async function updateMembersList() {
  const membersContainer = document.getElementById('members-container');
  if (!membersContainer) return;

  try {
    const members = await dataService.getMembers();
    const currentUser = getCurrentUser();
    const isManager = isManagerRole();

    membersContainer.innerHTML = '';

    if (members.length === 0) {
      membersContainer.innerHTML = '<p>No members added yet.</p>';
      return;
    }

    members.forEach(member => {
      const initials = member.name.split(' ').map(n => n[0]).join('');
      const isSelf = currentUser && member.email === currentUser.email;
      const memberItem = document.createElement('div');
      memberItem.className = 'member-item';
      memberItem.innerHTML = `
        <div class="member-info">
          <div class="member-avatar">${initials}</div>
          <div>
            <h3>${member.name}</h3>
            <p>${member.email}</p>
          </div>
        </div>
        <div class="member-actions">
          ${isManager && !isSelf ? `<button class="delete-btn" data-id="${member.id}">Remove</button>` : ''}
        </div>
      `;
      membersContainer.appendChild(memberItem);
    });

    // Add delete functionality (manager only)
    document.querySelectorAll('#members-container .delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        await deleteMember(id);
      });
    });
  } catch (error) {
    console.error('Error loading members:', error);
    membersContainer.innerHTML = '<p>Error loading members.</p>';
  }
}

async function deleteMember(id) {
  if (!isManagerRole()) {
    alert('Only the manager can remove members.');
    return;
  }
  
  if (!confirm('Are you sure you want to remove this member?')) return;

  try {
    await dataService.removeMember(id);
    await updateMembersList();
  } catch (error) {
    console.error('Error removing member:', error);
    alert('Error removing member: ' + error.message);
  }
}

// Expense Tracker Functionality
async function initExpenseTracker() {
  await waitForServices();
  
  const expenseContainer = document.querySelector('.expense-container');
  if (!expenseContainer) return;

  console.log('Expense tracker initialized');

  // Populate member select dropdown
  const memberSelect = document.getElementById('member-select');
  if (memberSelect) {
    try {
      const members = await dataService.getMembers();
      memberSelect.innerHTML = '<option value="">Select Member</option>';
      if (members.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No members added yet";
        option.disabled = true;
        memberSelect.appendChild(option);
      } else {
        members.forEach(member => {
          const option = document.createElement('option');
          option.value = member.id;
          option.textContent = member.name;
          memberSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  // Add expense form submission
  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!isManagerRole()) { 
        alert('Only the manager can add or edit bazar cost'); 
        return; 
      }

      const date = document.getElementById('expense-date').value;
      const amount = parseFloat(document.getElementById('expense-amount').value);
      const description = document.getElementById('expense-description').value;
      const category = document.getElementById('expense-category').value;

      if (!date || !amount || !description) {
        alert('Please fill all required fields');
        return;
      }

      try {
        const editingId = expenseForm.dataset.editingId || null;
        if (editingId) {
          await dataService.updateExpense(editingId, { date, amount, description, category });
          delete expenseForm.dataset.editingId;
          const submitBtn = expenseForm.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Add Expense';
        } else {
          await dataService.addExpense({ date, amount, description, category });
        }

        await updateExpenseList();
        await updateExpenseSummary();
        expenseForm.reset();
      } catch (error) {
        console.error('Error saving expense:', error);
        alert('Error saving expense: ' + error.message);
      }
    });
  }

  // Add meal count form submission
  const mealCountForm = document.getElementById('meal-count-form');
  if (mealCountForm) {
    mealCountForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const date = document.getElementById('meal-date').value;
      const memberId = document.getElementById('member-select').value;
      const breakfast = parseInt(document.getElementById('breakfast').value) || 0;
      const lunch = parseInt(document.getElementById('lunch').value) || 0;
      const dinner = parseInt(document.getElementById('dinner').value) || 0;

      if (!date || !memberId) {
        alert('Please select date and member');
        return;
      }

      const currentUser = getCurrentUser();
      const isManager = isManagerRole();
      
      // Check permissions
      if (!isManager && memberId !== currentUser.id) {
        alert('Members can only add their own meals');
        return;
      }

      try {
        const editingId = mealCountForm.dataset.editingId || null;
        if (editingId) {
          if (!isManager) { 
            alert('Only the manager can edit meals'); 
            return; 
          }
          await dataService.updateMealCount(editingId, {
            date, memberId, breakfast, lunch, dinner
          });
          delete mealCountForm.dataset.editingId;
          const submitBtn = mealCountForm.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Add Meal Count';
        } else {
          await dataService.addMealCount({
            date, memberId, breakfast, lunch, dinner
          });
        }

        await updateMealCountList();
        await updateExpenseSummary();
        mealCountForm.reset();
      } catch (error) {
        console.error('Error saving meal count:', error);
        alert('Error saving meal count: ' + error.message);
      }
    });
  }

  // Shared expense form
  const sharedForm = document.getElementById('shared-expense-form');
  if (sharedForm) {
    sharedForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!isManagerRole()) { 
        alert('Only the manager can add or edit shared cost'); 
        return; 
      }

      const date = document.getElementById('shared-expense-date').value;
      const amount = parseFloat(document.getElementById('shared-expense-amount').value);
      const description = document.getElementById('shared-expense-description').value;
      const category = document.getElementById('shared-expense-category').value;

      if (!date || !amount || !description) { 
        alert('Please fill all required fields'); 
        return; 
      }

      try {
        const editingId = sharedForm.dataset.editingId || null;
        if (editingId) {
          await dataService.updateSharedExpense(editingId, { date, amount, description, category });
          delete sharedForm.dataset.editingId;
          const submitBtn = sharedForm.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Add Shared Cost';
        } else {
          await dataService.addSharedExpense({ date, amount, description, category });
        }

        await updateSharedExpenseList();
        await updateExpenseSummary();
        sharedForm.reset();
      } catch (error) {
        console.error('Error saving shared expense:', error);
        alert('Error saving shared expense: ' + error.message);
      }
    });
  }

  // Initialize UI
  await updateExpenseList();
  await updateSharedExpenseList();
  await updateMealCountList();
  await updateExpenseSummary();
}

async function updateExpenseList() {
  const expenseList = document.getElementById('expense-list');
  if (!expenseList) return;

  try {
    const expenses = await dataService.getExpenses();
    expenseList.innerHTML = '';

    expenses.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(expense.date)}</td>
        <td>${expense.description}</td>
        <td>${expense.category}</td>
        <td>${expense.amount} BDT</td>
        <td>
          <button class="edit-btn" data-id="${expense.id}">Edit</button>
          <button class="delete-btn" data-id="${expense.id}">Delete</button>
        </td>
      `;
      expenseList.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('#expense-list .edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditExpense(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('#expense-list .delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        await deleteExpense(this.getAttribute('data-id'));
      });
    });
  } catch (error) {
    console.error('Error loading expenses:', error);
    expenseList.innerHTML = '<tr><td colspan="5">Error loading expenses</td></tr>';
  }
}

async function updateSharedExpenseList() {
  const listEl = document.getElementById('shared-expense-list');
  if (!listEl) return;

  try {
    const shared = await dataService.getSharedExpenses();
    listEl.innerHTML = '';

    if (!shared.length) {
      listEl.innerHTML = '<tr><td colspan="5">No shared expenses yet.</td></tr>';
      return;
    }

    shared.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(item.date)}</td>
        <td>${item.description}</td>
        <td>${item.category}</td>
        <td>${item.amount} BDT</td>
        <td>
          <button class="edit-btn" data-id="${item.id}">Edit</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </td>
      `;
      listEl.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('#shared-expense-list .edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditSharedExpense(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('#shared-expense-list .delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        await deleteSharedExpense(this.getAttribute('data-id'));
      });
    });
  } catch (error) {
    console.error('Error loading shared expenses:', error);
    listEl.innerHTML = '<tr><td colspan="5">Error loading shared expenses</td></tr>';
  }
}

async function updateMealCountList() {
  const mealCountList = document.getElementById('meal-count-list');
  if (!mealCountList) return;

  try {
    const mealCounts = await dataService.getMealCounts();
    mealCountList.innerHTML = '';

    mealCounts.forEach(mealCount => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(mealCount.date)}</td>
        <td>${mealCount.memberName}</td>
        <td>${mealCount.breakfast}</td>
        <td>${mealCount.lunch}</td>
        <td>${mealCount.dinner}</td>
        <td>${mealCount.total}</td>
        <td>
          <button class="edit-btn" data-id="${mealCount.id}">Edit</button>
          <button class="delete-btn" data-id="${mealCount.id}">Delete</button>
        </td>
      `;
      mealCountList.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('#meal-count-list .edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditMealCount(this.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('#meal-count-list .delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        await deleteMealCount(this.getAttribute('data-id'));
      });
    });
  } catch (error) {
    console.error('Error loading meal counts:', error);
    mealCountList.innerHTML = '<tr><td colspan="7">Error loading meal counts</td></tr>';
  }
}

async function updateExpenseSummary() {
  const totalExpensesEl = document.getElementById('total-expenses');
  const totalMealsEl = document.getElementById('total-meals');
  const mealRateEl = document.getElementById('meal-rate');

  if (!totalExpensesEl || !totalMealsEl || !mealRateEl) return;

  try {
    const expenses = await dataService.getExpenses();
    const shared = await dataService.getSharedExpenses();
    const mealCounts = await dataService.getMealCounts();

    const totalMealExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalSharedCost = shared.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalMeals = mealCounts.reduce((sum, m) => sum + m.total, 0);
    const mealRate = totalMeals > 0 ? (totalMealExpenses / totalMeals) : 0;

    totalExpensesEl.textContent = `${totalMealExpenses.toFixed(2)} BDT`;
    totalMealsEl.textContent = String(totalMeals);
    mealRateEl.textContent = `${mealRate.toFixed(2)} BDT`;

    // Update other summary elements
    updateMessCostSummary(totalMealExpenses, totalSharedCost, totalMeals, mealRate);
  } catch (error) {
    console.error('Error updating expense summary:', error);
  }
}

function updateMessCostSummary(totalMealExpenses, totalSharedCost, totalMeals, mealRate) {
  const totalCost = totalMealExpenses + totalSharedCost;
  
  const setText = (id, v) => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = v; 
  };
  
  setText('mess-total-meal-cost', `${totalMealExpenses.toFixed(2)} BDT`);
  setText('mess-total-shared-cost', `${totalSharedCost.toFixed(2)} BDT`);
  setText('mess-total-cost', `${totalCost.toFixed(2)} BDT`);
  setText('mess-total-meals', String(totalMeals));
  setText('mess-meal-rate', `${mealRate.toFixed(2)} BDT`);
}

// Edit functions
async function startEditExpense(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can edit bazar cost'); 
    return; 
  }
  
  try {
    const expenses = await dataService.getExpenses();
    const exp = expenses.find(e => e.id === id);
    const form = document.getElementById('expense-form');
    if (!exp || !form) return;

    document.getElementById('expense-date').value = exp.date;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-description').value = exp.description;
    document.getElementById('expense-category').value = exp.category;

    form.dataset.editingId = id;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Expense';
  } catch (error) {
    console.error('Error loading expense for edit:', error);
  }
}

async function deleteExpense(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can delete bazar cost'); 
    return; 
  }
  
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    await dataService.deleteExpense(id);
    await updateExpenseList();
    await updateExpenseSummary();
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Error deleting expense: ' + error.message);
  }
}

// Similar functions for shared expenses and meal counts...
async function startEditSharedExpense(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can edit shared cost'); 
    return; 
  }
  
  try {
    const shared = await dataService.getSharedExpenses();
    const item = shared.find(e => e.id === id);
    const form = document.getElementById('shared-expense-form');
    if (!item || !form) return;

    document.getElementById('shared-expense-date').value = item.date;
    document.getElementById('shared-expense-amount').value = item.amount;
    document.getElementById('shared-expense-description').value = item.description;
    document.getElementById('shared-expense-category').value = item.category;

    form.dataset.editingId = id;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Shared Cost';
  } catch (error) {
    console.error('Error loading shared expense for edit:', error);
  }
}

async function deleteSharedExpense(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can delete shared cost'); 
    return; 
  }
  
  if (!confirm('Are you sure you want to delete this shared expense?')) return;

  try {
    await dataService.deleteSharedExpense(id);
    await updateSharedExpenseList();
    await updateExpenseSummary();
  } catch (error) {
    console.error('Error deleting shared expense:', error);
    alert('Error deleting shared expense: ' + error.message);
  }
}

async function startEditMealCount(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can edit meals'); 
    return; 
  }
  
  try {
    const mealCounts = await dataService.getMealCounts();
    const mc = mealCounts.find(m => m.id === id);
    const form = document.getElementById('meal-count-form');
    if (!mc || !form) return;

    document.getElementById('meal-date').value = mc.date;
    document.getElementById('member-select').value = mc.memberId;
    document.getElementById('breakfast').value = mc.breakfast;
    document.getElementById('lunch').value = mc.lunch;
    document.getElementById('dinner').value = mc.dinner;

    form.dataset.editingId = id;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Meal Count';
  } catch (error) {
    console.error('Error loading meal count for edit:', error);
  }
}

async function deleteMealCount(id) {
  if (!isManagerRole()) { 
    alert('Only the manager can delete meals'); 
    return; 
  }
  
  if (!confirm('Are you sure you want to delete this meal count?')) return;

  try {
    await dataService.deleteMealCount(id);
    await updateMealCountList();
    await updateExpenseSummary();
  } catch (error) {
    console.error('Error deleting meal count:', error);
    alert('Error deleting meal count: ' + error.message);
  }
}

// Notice Board Functionality
async function initNoticeBoard() {
  await waitForServices();
  
  const noticeSection = document.getElementById('notice');
  if (!noticeSection) return;

  console.log('Notice board initialized');

  const noticeTextarea = noticeSection.querySelector('textarea');
  const postButton = noticeSection.querySelector('button');

  let noticesContainer = noticeSection.querySelector('.notices-container');
  if (!noticesContainer) {
    noticesContainer = document.createElement('div');
    noticesContainer.className = 'notices-container';
    noticeSection.appendChild(noticesContainer);
  }

  postButton.addEventListener('click', async function() {
    const noticeText = noticeTextarea.value.trim();

    if (!noticeText) {
      alert('Please enter a notice before posting');
      return;
    }

    try {
      await dataService.addNotice(noticeText);
      await updateNoticesDisplay();
      noticeTextarea.value = '';
    } catch (error) {
      console.error('Error posting notice:', error);
      alert('Error posting notice: ' + error.message);
    }
  });

  await updateNoticesDisplay();
}

async function updateNoticesDisplay() {
  const noticeSection = document.getElementById('notice');
  if (!noticeSection) return;

  const noticesContainer = noticeSection.querySelector('.notices-container');
  if (!noticesContainer) return;

  try {
    const notices = await dataService.getNotices();
    noticesContainer.innerHTML = '';

    if (notices.length === 0) {
      noticesContainer.innerHTML = '<p class="no-notices">No notices posted yet.</p>';
      return;
    }

    notices.forEach(notice => {
      const noticeItem = document.createElement('div');
      noticeItem.className = 'notice-item';
      noticeItem.innerHTML = `
        <div class="notice-content">
          <p>${escapeHtml(notice.text)}</p>
          <div class="notice-meta">
            <span class="notice-date">${notice.date} at ${notice.time}</span>
            ${notice.authorName ? `<span class="notice-author">by ${escapeHtml(notice.authorName)}</span>` : ''}
          </div>
        </div>
        <button class="delete-notice-btn" data-id="${notice.id}">
          <i class="fas fa-trash"></i>
        </button>
      `;
      noticesContainer.appendChild(noticeItem);
    });

    // Add delete functionality
    document.querySelectorAll('.delete-notice-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        await deleteNotice(id);
      });
    });

    initNoticeTicker(notices);
  } catch (error) {
    console.error('Error loading notices:', error);
    noticesContainer.innerHTML = '<p>Error loading notices.</p>';
  }
}

function initNoticeTicker(notices = []) {
  const ticker = document.getElementById('notice-ticker');
  if (!ticker) return;
  
  let track = ticker.querySelector('.ticker-track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'ticker-track';
    ticker.appendChild(track);
  }
  
  const texts = notices.length ? notices.map(n => n.text) : ['No notices posted yet'];
  const joined = texts.join(' • ');
  track.innerHTML = `${escapeHtml(joined)} \u00A0\u00A0 ${escapeHtml(joined)}`;
  
  void track.offsetWidth;
  const distancePx = track.offsetWidth * 2;
  const pxPerSec = 140;
  const duration = distancePx / pxPerSec;
  track.style.animationDuration = `${duration}s`;
}

async function deleteNotice(id) {
  if (!confirm('Are you sure you want to delete this notice?')) return;

  try {
    await dataService.deleteNotice(id);
    await updateNoticesDisplay();
  } catch (error) {
    console.error('Error deleting notice:', error);
    alert('Error deleting notice: ' + error.message);
  }
}

// Reviews functionality
async function initReviews() {
  await waitForServices();
  
  const reviewSection = document.getElementById('reviews');
  if (!reviewSection) return;

  const form = document.getElementById('review-form');
  const nameInput = document.getElementById('review-name');
  const uniInput = document.getElementById('review-university');
  const timeInput = document.getElementById('review-time');
  const textInput = document.getElementById('review-text');

  if (timeInput) {
    timeInput.value = formatDateTime(new Date());
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!nameInput.value || !uniInput.value || !textInput.value) {
        alert('Please fill in your name, university, and review.');
        return;
      }

      try {
        const editingId = form.dataset.editingId || null;
        if (editingId) {
          await dataService.updateReview(editingId, {
            name: nameInput.value,
            university: uniInput.value,
            text: textInput.value
          });
          delete form.dataset.editingId;
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Submit Review';
        } else {
          await dataService.addReview({
            name: nameInput.value,
            university: uniInput.value,
            text: textInput.value
          });
        }

        form.reset();
        if (timeInput) timeInput.value = formatDateTime(new Date());
        await updateReviewsDisplay();
      } catch (error) {
        console.error('Error saving review:', error);
        alert('Error saving review: ' + error.message);
      }
    });
  }

  await updateReviewsDisplay();
}

async function updateReviewsDisplay() {
  const list = document.getElementById('reviews-list');
  if (!list) return;

  try {
    const reviews = await dataService.getReviews();
    const currentUser = getCurrentUser();

    list.innerHTML = '';
    if (reviews.length === 0) {
      list.innerHTML = '<p>No reviews yet.</p>';
      return;
    }

    reviews.forEach(r => {
      const timeStr = formatDateTime(new Date(r.updatedAt || r.createdAt));
      const item = document.createElement('div');
      
      const isOwner = currentUser && r.authorEmail === currentUser.id;
      item.className = 'review-item' + (isOwner ? ' own-review' : '');
      item.innerHTML = `
        <div class="review-header">
          <strong>${escapeHtml(r.name)}</strong> • <span>${escapeHtml(r.university)}</span>
          <span class="review-time">${timeStr}</span>
        </div>
        <p class="review-text">${escapeHtml(r.text)}</p>
        <div class="review-actions">
          ${isOwner ? `<button class="edit-review" data-id="${r.id}">Edit</button>` : ''}
          ${isOwner ? `<button class="delete-review" data-id="${r.id}">Delete</button>` : ''}
        </div>
      `;
      list.appendChild(item);
    });

    // Add event listeners
    document.querySelectorAll('#reviews-list .edit-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        startEditReview(id);
      });
    });

    document.querySelectorAll('#reviews-list .delete-review').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await deleteReview(id);
      });
    });
  } catch (error) {
    console.error('Error loading reviews:', error);
    list.innerHTML = '<p>Error loading reviews.</p>';
  }
}

async function startEditReview(id) {
  try {
    const reviews = await dataService.getReviews();
    const r = reviews.find(x => x.id === id);
    const form = document.getElementById('review-form');
    if (!r || !form) return;

    const currentUser = getCurrentUser();
    if (!currentUser || r.authorEmail !== currentUser.id) {
      alert('You can only edit your own review.');
      return;
    }

    const nameInput = document.getElementById('review-name');
    const uniInput = document.getElementById('review-university');
    const textInput = document.getElementById('review-text');
    const timeInput = document.getElementById('review-time');

    nameInput.value = r.name || '';
    uniInput.value = r.university || '';
    textInput.value = r.text || '';
    if (timeInput) timeInput.value = formatDateTime(new Date());

    form.dataset.editingId = id;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Review';
  } catch (error) {
    console.error('Error loading review for edit:', error);
  }
}

async function deleteReview(id) {
  if (!confirm('Are you sure you want to delete this review?')) return;

  try {
    await dataService.deleteReview(id);
    await updateReviewsDisplay();

    // Reset form if it was editing the deleted review
    const form = document.getElementById('review-form');
    if (form && form.dataset.editingId === id) {
      form.reset();
      delete form.dataset.editingId;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Submit Review';
      const timeInput = document.getElementById('review-time');
      if (timeInput) timeInput.value = formatDateTime(new Date());
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Error deleting review: ' + error.message);
  }
}

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  await waitForServices();
  
  // Initialize modules based on current page
  if (document.querySelector('.member-container')) {
    await initMemberManagement();
  }
  
  if (document.querySelector('.expense-container')) {
    await initExpenseTracker();
  }
  
  if (document.getElementById('notice')) {
    await initNoticeBoard();
  }
  
  if (document.getElementById('reviews')) {
    await initReviews();
  }
});