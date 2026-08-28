const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. PDF uploads might fail.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
