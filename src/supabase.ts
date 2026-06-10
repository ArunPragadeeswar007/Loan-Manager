import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client using Vite environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Profile helper functions
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone?: string | null;
  updated_at?: string;
  created_at?: string;
}

/**
 * Fetches the user profile from the database.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Error fetching profile:', error.message);
    return null;
  }
  return data as Profile;
}

/**
 * Client-side fallback to ensure a profile exists in the database.
 * If the database trigger didn't run, this inserts the profile manually.
 */
export async function ensureUserProfile(userId: string, metadata: any, email?: string): Promise<Profile | null> {
  try {
    const existing = await getProfile(userId);
    if (existing) return existing;

    const fullName = metadata?.full_name || metadata?.name || 'User';
    const avatarUrl = metadata?.avatar_url || null;
    const phone = metadata?.phone || null;

    const newProfile: Omit<Profile, 'updated_at' | 'created_at'> = {
      id: userId,
      full_name: fullName,
      email: email || '',
      avatar_url: avatarUrl,
      phone: phone,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error.message);
      return null;
    }
    return data as Profile;
  } catch (err) {
    console.error('Error in ensureUserProfile:', err);
    return null;
  }
}

/**
 * Updates the user's profile details.
 */
export async function updateProfile(
  userId: string, 
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update profile:', error.message);
    throw error;
  }
  return data as Profile;
}

export interface Loan {
  id: string;
  customer_id: string;
  loan_number: string;
  loan_type: string;
  loan_amount: number;
  tenure: number;
  installment_start_date: string;
  interest_type: 'Fixed' | 'Floating';
  roi: number;
  status: 'Active' | 'Pending' | 'Paid';
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all loans belonging to a customer.
 */
export async function fetchLoans(customerId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loans:', error.message);
    throw error;
  }
  return (data || []) as Loan[];
}

/**
 * Creates a new loan record in the database.
 */
export async function createLoan(
  loan: Omit<Loan, 'id' | 'created_at' | 'updated_at'>
): Promise<Loan> {
  // Proactively ensure the user profile exists in the database to satisfy the foreign key constraint
  try {
    const session = await supabase.auth.getSession();
    const user = session.data.session?.user;
    if (user && user.id === loan.customer_id) {
      await ensureUserProfile(user.id, user.user_metadata, user.email);
    }
  } catch (err) {
    console.warn('Non-fatal: Failed to pre-verify profile existence:', err);
  }

  const { data, error } = await supabase
    .from('loans')
    .insert([loan])
    .select()
    .single();

  if (error) {
    console.error('Error creating loan:', error.message);
    throw error;
  }
  return data as Loan;
}

/**
 * Updates an existing loan record in the database.
 */
export async function updateLoan(
  loanId: string, 
  updates: Partial<Omit<Loan, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', loanId)
    .select()
    .single();

  if (error) {
    console.error('Error updating loan:', error.message);
    throw error;
  }
  return data as Loan;
}

/**
 * Deletes a loan record from the database.
 */
export async function deleteLoan(loanId: string): Promise<void> {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', loanId);

  if (error) {
    console.error('Error deleting loan:', error.message);
    throw error;
  }
}


