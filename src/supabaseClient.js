import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://swnhvucgsffugsovesbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bmh2dWNnc2ZmdWdzb3Zlc2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDE3MTYsImV4cCI6MjA2Mjk3NzcxNn0.-_snJ8HJZ78qkMH81eVRYAeQPwou0uBr7kvZHCtuXns';

export const supabase = createClient(supabaseUrl, supabaseKey);
