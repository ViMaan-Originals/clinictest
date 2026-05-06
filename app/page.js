import { supabase } from './lib/supabase'

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}


console.log('pages loading')