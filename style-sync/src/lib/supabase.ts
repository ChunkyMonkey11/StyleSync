import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fhyisvyhahqxryanjnby.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeWlzdnloYWhxeHJ5YW5qbmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjAzOTcsImV4cCI6MjA3NTMzNjM5N30.DFLt0-mhYUIOyCOD_ElBvb7kNdkxUu4z-HTpdCVbQzE'

export const supabase = createClient(supabaseUrl, supabaseKey)