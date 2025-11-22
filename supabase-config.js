// supabase-config.js
// Supabase configuration and initialization

// Supabase project credentials
const SUPABASE_URL = 'https://czfdfdgzsaefuzkallyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZmRmZGd6c2FlZnV6a2FsbHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxOTEsImV4cCI6MjA3OTQxMzE5MX0.D2mFQKBsMMOjkH1wR7yQYb2UxuFJlSFACRGWAKT_VXU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database service layer
class DatabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // Auth methods
  async signUp(email, password, userData) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Mess operations
  async createMess(messData) {
    const { data, error } = await this.supabase
      .from('messes')
      .insert([messData])
      .select();
    return { data, error };
  }

  async getMess(messId) {
    const { data, error } = await this.supabase
      .from('messes')
      .select('*')
      .eq('id', messId)
      .single();
    return { data, error };
  }

  async joinMess(messId, userId) {
    const { data, error } = await this.supabase
      .from('mess_members')
      .insert([{ mess_id: messId, user_id: userId, role: 'member' }])
      .select();
    return { data, error };
  }

  // Member operations
  async getMessMembers(messId) {
    const { data, error } = await this.supabase
      .from('mess_members')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('mess_id', messId);
    return { data, error };
  }

  // Expense operations
  async addExpense(expenseData) {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert([expenseData])
      .select();
    return { data, error };
  }

  async getExpenses(messId) {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('mess_id', messId)
      .order('date', { ascending: false });
    return { data, error };
  }

  async updateExpense(id, updates) {
    const { data, error } = await this.supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async deleteExpense(id) {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    return { error };
  }

  // Meal count operations
  async addMealCount(mealData) {
    const { data, error } = await this.supabase
      .from('meal_counts')
      .insert([mealData])
      .select();
    return { data, error };
  }

  async getMealCounts(messId) {
    const { data, error } = await this.supabase
      .from('meal_counts')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('mess_id', messId)
      .order('date', { ascending: false });
    return { data, error };
  }

  async updateMealCount(id, updates) {
    const { data, error } = await this.supabase
      .from('meal_counts')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async deleteMealCount(id) {
    const { error } = await this.supabase
      .from('meal_counts')
      .delete()
      .eq('id', id);
    return { error };
  }

  // Task operations
  async addTask(taskData) {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert([taskData])
      .select();
    return { data, error };
  }

  async getTasks(messId) {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('mess_id', messId)
      .order('due_date', { ascending: true });
    return { data, error };
  }

  async updateTask(id, updates) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async deleteTask(id) {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    return { error };
  }

  // Deposit operations
  async addDeposit(depositData) {
    const { data, error } = await this.supabase
      .from('deposits')
      .insert([depositData])
      .select();
    return { data, error };
  }

  async getDeposits(messId) {
    const { data, error } = await this.supabase
      .from('deposits')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('mess_id', messId)
      .order('date', { ascending: false });
    return { data, error };
  }

  async updateDeposit(id, updates) {
    const { data, error } = await this.supabase
      .from('deposits')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async deleteDeposit(id) {
    const { error } = await this.supabase
      .from('deposits')
      .delete()
      .eq('id', id);
    return { error };
  }

  // Notice operations
  async addNotice(noticeData) {
    const { data, error } = await this.supabase
      .from('notices')
      .insert([noticeData])
      .select();
    return { data, error };
  }

  async getNotices(messId) {
    const { data, error } = await this.supabase
      .from('notices')
      .select(`
        *,
        profiles (name)
      `)
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async deleteNotice(id) {
    const { error } = await this.supabase
      .from('notices')
      .delete()
      .eq('id', id);
    return { error };
  }

  // Review operations
  async addReview(reviewData) {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert([reviewData])
      .select();
    return { data, error };
  }

  async getReviews() {
    const { data, error } = await this.supabase
      .from('reviews')
      .select(`
        *,
        profiles (name)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async updateReview(id, updates) {
    const { data, error } = await this.supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async deleteReview(id) {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    return { error };
  }
}

// Create global database service instance
const db = new DatabaseService();

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear any cached data
    localStorage.removeItem('currentMess');
    window.location.href = 'login.html';
  }
});