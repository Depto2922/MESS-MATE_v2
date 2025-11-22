// data-service.js
// Data service layer for database operations

class DataService {
  constructor() {
    this.supabase = supabase;
  }

  // Helper to get current mess ID
  getCurrentMessId() {
    const mess = auth.getCurrentMess();
    return mess ? mess.messId : null;
  }

  // Helper to get current user ID
  getCurrentUserId() {
    const user = auth.getCurrentUser();
    return user ? user.id : null;
  }

  // Members operations
  async getMembers() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('mess_members')
      .select(`
        *,
        profiles (id, name, email, phone)
      `)
      .eq('mess_id', messId);

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(member => ({
      id: member.profiles.id,
      name: member.profiles.name,
      email: member.profiles.email,
      phone: member.profiles.phone,
      role: member.role,
      joinDate: member.joined_at?.split('T')[0]
    }));
  }

  async removeMember(memberId) {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { error } = await this.supabase
      .from('mess_members')
      .delete()
      .eq('mess_id', messId)
      .eq('user_id', memberId);

    if (error) throw error;
    return true;
  }

  // Expenses operations
  async getExpenses() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('mess_id', messId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addExpense(expenseData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('expenses')
      .insert([{
        ...expenseData,
        mess_id: messId,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateExpense(id, updates) {
    const { data, error } = await this.supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteExpense(id) {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Shared expenses operations
  async getSharedExpenses() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('shared_expenses')
      .select('*')
      .eq('mess_id', messId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addSharedExpense(expenseData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('shared_expenses')
      .insert([{
        ...expenseData,
        mess_id: messId,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSharedExpense(id, updates) {
    const { data, error } = await this.supabase
      .from('shared_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSharedExpense(id) {
    const { error } = await this.supabase
      .from('shared_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Meal counts operations
  async getMealCounts() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('meal_counts')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('mess_id', messId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(meal => ({
      id: meal.id,
      date: meal.date,
      memberId: meal.user_id,
      memberName: meal.profiles.name,
      memberEmail: meal.profiles.email,
      breakfast: meal.breakfast,
      lunch: meal.lunch,
      dinner: meal.dinner,
      total: meal.total
    }));
  }

  async addMealCount(mealData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('meal_counts')
      .insert([{
        mess_id: messId,
        user_id: mealData.memberId,
        date: mealData.date,
        breakfast: mealData.breakfast,
        lunch: mealData.lunch,
        dinner: mealData.dinner,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMealCount(id, updates) {
    const { data, error } = await this.supabase
      .from('meal_counts')
      .update({
        user_id: updates.memberId,
        date: updates.date,
        breakfast: updates.breakfast,
        lunch: updates.lunch,
        dinner: updates.dinner
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMealCount(id) {
    const { error } = await this.supabase
      .from('meal_counts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Tasks operations
  async getTasks() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        assigned_profile:profiles!tasks_assigned_to_fkey (name, email)
      `)
      .eq('mess_id', messId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      assignedTo: task.assigned_profile.name,
      dueDate: task.due_date,
      status: task.status,
      createdDate: task.created_at?.split('T')[0]
    }));
  }

  async addTask(taskData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    // Find user ID by name
    const members = await this.getMembers();
    const assignedMember = members.find(m => m.name === taskData.assignedTo);
    if (!assignedMember) throw new Error('Assigned member not found');

    const { data, error } = await this.supabase
      .from('tasks')
      .insert([{
        mess_id: messId,
        name: taskData.name,
        description: taskData.description,
        assigned_to: assignedMember.id,
        due_date: taskData.dueDate,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id, updates) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id) {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Deposits operations
  async getDeposits() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('deposits')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('mess_id', messId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(deposit => ({
      id: deposit.id,
      memberId: deposit.user_id,
      memberName: deposit.profiles.name,
      memberEmail: deposit.profiles.email,
      amount: deposit.amount,
      date: deposit.date
    }));
  }

  async addDeposit(depositData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('deposits')
      .insert([{
        mess_id: messId,
        user_id: depositData.memberId,
        amount: depositData.amount,
        date: depositData.date,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDeposit(id, updates) {
    const { data, error } = await this.supabase
      .from('deposits')
      .update({
        user_id: updates.memberId,
        amount: updates.amount,
        date: updates.date
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDeposit(id) {
    const { error } = await this.supabase
      .from('deposits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Notices operations
  async getNotices() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('notices')
      .select(`
        *,
        profiles (name)
      `)
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(notice => ({
      id: notice.id,
      text: notice.text,
      date: notice.created_at?.split('T')[0],
      time: new Date(notice.created_at).toLocaleTimeString(),
      authorName: notice.profiles.name
    }));
  }

  async addNotice(text) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('notices')
      .insert([{
        mess_id: messId,
        text: text,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNotice(id) {
    const { error } = await this.supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Reviews operations (global)
  async getReviews() {
    const { data, error } = await this.supabase
      .from('reviews')
      .select(`
        *,
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(review => ({
      id: review.id,
      name: review.name,
      university: review.university,
      text: review.text,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      authorEmail: review.created_by // Store user ID as authorEmail for compatibility
    }));
  }

  async addReview(reviewData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('reviews')
      .insert([{
        name: reviewData.name,
        university: reviewData.university,
        text: reviewData.text,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateReview(id, updates) {
    const { data, error } = await this.supabase
      .from('reviews')
      .update({
        name: updates.name,
        university: updates.university,
        text: updates.text
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteReview(id) {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Debt requests operations
  async getDebtRequests() {
    const messId = this.getCurrentMessId();
    if (!messId) throw new Error('No mess selected');

    const { data, error } = await this.supabase
      .from('debt_requests')
      .select(`
        *,
        from_profile:profiles!debt_requests_from_user_id_fkey (name, email),
        to_profile:profiles!debt_requests_to_user_id_fkey (name, email)
      `)
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match existing format
    return data.map(request => ({
      id: request.id,
      fromId: request.from_user_id,
      toId: request.to_user_id,
      fromName: request.from_profile.name,
      fromEmail: request.from_profile.email,
      toName: request.to_profile.name,
      toEmail: request.to_profile.email,
      amount: request.amount,
      date: request.date,
      status: request.status
    }));
  }

  async addDebtRequest(requestData) {
    const messId = this.getCurrentMessId();
    const userId = this.getCurrentUserId();
    if (!messId || !userId) throw new Error('Authentication required');

    const { data, error } = await this.supabase
      .from('debt_requests')
      .insert([{
        mess_id: messId,
        from_user_id: requestData.fromId,
        to_user_id: userId, // Current user is the receiver
        amount: requestData.amount,
        date: requestData.date || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDebtRequest(id, updates) {
    const { data, error } = await this.supabase
      .from('debt_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Create global data service instance
const dataService = new DataService();