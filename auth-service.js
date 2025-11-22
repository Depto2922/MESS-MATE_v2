// auth-service.js
// Authentication service using Supabase

class AuthService {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentMess = null;
    this.initialized = false;
    
    // Initialize when supabase is available
    if (typeof supabase !== 'undefined') {
      this.initPromise = this.init();
    } else {
      this.initPromise = this.waitForSupabase().then(() => this.init());
    }
  }
  
  async waitForSupabase() {
    let retries = 0;
    while (typeof supabase === 'undefined' && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase failed to load');
    }
  }

  async waitForInit() {
    if (!this.initialized) {
      await this.initPromise;
    }
    return this;
  }

  async init() {
    try {
      this.supabase = supabase;
      
      // Get initial session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        await this.setCurrentUser(session.user);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.setCurrentUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.currentMess = null;
          localStorage.removeItem('currentMess');
        }
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      this.initialized = false;
    }
  }

  async setCurrentUser(user) {
    // Get user profile from database
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    this.currentUser = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || '',
      ...profile
    };

    // Check if user belongs to any mess
    await this.loadUserMess();
  }

  async loadUserMess() {
    if (!this.currentUser) return;

    const { data: membership } = await this.supabase
      .from('mess_members')
      .select(`
        mess_id,
        role,
        messes (id, name)
      `)
      .eq('user_id', this.currentUser.id)
      .single();

    if (membership) {
      this.currentMess = {
        messId: membership.mess_id,
        messName: membership.messes.name,
        role: membership.role
      };
      localStorage.setItem('currentMess', JSON.stringify(this.currentMess));
    }
  }

  async signUp(email, password, name, uniqueId) {
    await this.waitForInit();
    try {
      // First create the auth user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            unique_id: uniqueId
          }
        }
      });

      if (error) throw error;

      // Update the profile with additional info
      if (data.user) {
        await this.supabase
          .from('profiles')
          .update({
            name: name,
            email: email,
            unique_id: uniqueId
          })
          .eq('id', data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signIn(emailOrId, password) {
    await this.waitForInit();
    try {
      // Try to sign in with email first
      let { data, error } = await this.supabase.auth.signInWithPassword({
        email: emailOrId,
        password
      });

      // If failed and input doesn't look like email, try to find user by unique_id
      if (error && !emailOrId.includes('@')) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('email')
          .eq('unique_id', emailOrId)
          .single();

        if (profile) {
          const result = await this.supabase.auth.signInWithPassword({
            email: profile.email,
            password
          });
          data = result.data;
          error = result.error;
        }
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    await this.waitForInit();
    const { error } = await this.supabase.auth.signOut();
    this.currentUser = null;
    this.currentMess = null;
    localStorage.removeItem('currentMess');
    return { error };
  }

  async createMess(messName, messPassword) {
    await this.waitForInit();
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      // Create mess
      const { data: mess, error: messError } = await this.supabase
        .from('messes')
        .insert([{
          name: messName,
          password: messPassword,
          created_by: this.currentUser.id
        }])
        .select()
        .single();

      if (messError) throw messError;

      // Add creator as manager
      const { error: memberError } = await this.supabase
        .from('mess_members')
        .insert([{
          mess_id: mess.id,
          user_id: this.currentUser.id,
          role: 'manager'
        }]);

      if (memberError) throw memberError;

      // Update current mess
      this.currentMess = {
        messId: mess.id,
        messName: mess.name,
        role: 'manager'
      };
      localStorage.setItem('currentMess', JSON.stringify(this.currentMess));

      return { data: mess, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async joinMess(messName, messPassword) {
    await this.waitForInit();
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      // Find mess by name and verify password
      const { data: mess, error: messError } = await this.supabase
        .from('messes')
        .select('*')
        .eq('name', messName)
        .eq('password', messPassword)
        .single();

      if (messError) throw messError;
      if (!mess) throw new Error('Mess not found or incorrect password');

      // Check if already a member
      const { data: existingMember } = await this.supabase
        .from('mess_members')
        .select('*')
        .eq('mess_id', mess.id)
        .eq('user_id', this.currentUser.id)
        .single();

      if (existingMember) {
        // Already a member, just update current mess
        this.currentMess = {
          messId: mess.id,
          messName: mess.name,
          role: existingMember.role
        };
      } else {
        // Add as new member
        const { error: memberError } = await this.supabase
          .from('mess_members')
          .insert([{
            mess_id: mess.id,
            user_id: this.currentUser.id,
            role: 'member'
          }]);

        if (memberError) throw memberError;

        this.currentMess = {
          messId: mess.id,
          messName: mess.name,
          role: 'member'
        };
      }

      localStorage.setItem('currentMess', JSON.stringify(this.currentMess));
      return { data: mess, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentMess() {
    return this.currentMess || JSON.parse(localStorage.getItem('currentMess') || 'null');
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isManager() {
    const mess = this.getCurrentMess();
    return mess && mess.role === 'manager';
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  requireAuthAndMess() {
    if (!this.isAuthenticated() || !this.getCurrentMess()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
}

// Create global auth service instance
const auth = new AuthService();