import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gghrtmvtpqjceuonvuir.supabase.co'
const supabaseAnonKey = 'sb_publishable_Ui6UsoW_idB0wEMSZlIdjg_MvmQAwko'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
