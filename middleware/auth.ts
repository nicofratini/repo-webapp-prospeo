import { useSupabaseUser, useSupabaseClient } from '#imports'
import { navigateTo } from '#app'

// Enhanced utility function for exponential backoff with jitter
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 100))

// Enhanced Supabase client initialization check
const waitForSupabase = async (supabase: any, maxAttempts = 15, initialDelay = 1000) => {
  let lastError = null
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (supabase?.auth) {
        // Test the connection with a basic query
        const { error } = await supabase.from('profiles').select('id').limit(1)
        if (!error) {
          return { success: true, error: null }
        }
        lastError = error
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed to initialize Supabase:`, error)
      lastError = error
    }
    
    // Exponential backoff with max delay of 10 seconds
    const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
    await wait(delay)
  }
  
  return { success: false, error: lastError }
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run auth checks on client side
  if (process.server) {
    return
  }

  try {
    const supabase = useSupabaseClient()
    
    // Enhanced Supabase initialization with better error handling
    const { success, error: initError } = await waitForSupabase(supabase)
    if (!success) {
      console.error('Supabase initialization error:', initError)
      return navigateTo('/auth/login')
    }
    
    // Get current session with enhanced retry mechanism
    const getSession = async (retries = 5, initialDelay = 1000) => {
      let lastError = null
      
      for (let i = 0; i < retries; i++) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            if (error.message.includes('refresh_token_not_found')) {
              await supabase.auth.signOut()
              return { session: null, error }
            }
            
            if (error.status === 429) {
              const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
              await wait(delay)
              continue
            }
            
            lastError = error
            throw error
          }
          
          return { session, error: null }
        } catch (error) {
          console.error('Session fetch error:', error)
          lastError = error
          
          if (i === retries - 1) {
            return { session: null, error: lastError }
          }
          
          const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
          await wait(delay)
        }
      }
      return { session: null, error: new Error('Max retries reached') }
    }

    const { session, error: sessionError } = await getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError.message)
      return navigateTo('/auth/login')
    }

    // Protected route checks
    if (!session && (to.path.startsWith('/dashboard') || to.path.startsWith('/admin'))) {
      return navigateTo('/auth/login')
    }

    // Auth page handling with enhanced error recovery
    if (session && to.path.startsWith('/auth/')) {
      try {
        const user = useSupabaseUser()
        
        if (!user.value?.id || typeof user.value.id !== 'string' || user.value.id.trim() === '') {
          console.warn('Invalid or missing user ID')
          await supabase.auth.signOut()
          return navigateTo('/auth/login')
        }

        // Enhanced profile fetch with retry mechanism
        const getProfile = async (retries = 5, initialDelay = 1000) => {
          let lastError = null
          
          for (let i = 0; i < retries; i++) {
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('is_admin, super_admin')
                .eq('id', user.value.id)
                .maybeSingle()
              
              if (error) {
                if (error.code === '429') {
                  const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
                  await wait(delay)
                  continue
                }
                lastError = error
                throw error
              }
              
              return { profile: data, error: null }
            } catch (error) {
              console.error('Profile fetch error:', error)
              lastError = error
              
              if (i === retries - 1) {
                return { profile: null, error: lastError }
              }
              
              const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
              await wait(delay)
            }
          }
          return { profile: null, error: new Error('Max retries reached') }
        }

        const { profile, error: profileError } = await getProfile()

        if (profileError) {
          console.error('Profile fetch error:', profileError.message)
          return navigateTo('/auth/login')
        }

        if (!profile) {
          console.warn('Profile not found')
          await supabase.auth.signOut()
          return navigateTo('/auth/login')
        }

        // Access control checks
        if (to.path.startsWith('/admin') && !profile.super_admin) {
          console.warn('Unauthorized access attempt to admin area')
          return navigateTo('/dashboard')
        }

        // Role-based redirection
        const targetPath = profile.super_admin ? '/admin' : '/dashboard'
        
        if (to.path.startsWith('/auth/') && to.path !== targetPath) {
          return navigateTo(targetPath)
        }
      } catch (error) {
        console.error('Profile check error:', error)
        await supabase.auth.signOut()
        return navigateTo('/auth/login')
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return navigateTo('/auth/login')
  }
})