import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://sqyoendjnqevkqzidynv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeW9lbmRqbnFldmtxemlkeW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzQxNTIsImV4cCI6MjA4ODY1MDE1Mn0.jJAsnRNpygXUwoV8Cq13Av31toQfxRBByCc6Q3Y30-8'
)
