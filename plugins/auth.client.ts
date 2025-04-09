import { useNuxtApp, useSupabaseUser, useRuntimeConfig } from '#imports'
import { useProfileStore } from '~/stores/profile'

// Enhanced utility function for exponential backoff with jitter
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 100))

// Enhanced Supabase client initialization check
const waitForSupabase = async (nuxtApp: any, maxAttempts = 15, initialDelay = 1000) => {
  let lastError = null
  
  // Get runtime config to check Supabase credentials
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseKey) {
    return { 
      success: false, 
      error: new Error('Supabase credentials not found in runtime config') 
    }
  }
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (nuxtApp.$supabase?.auth) {
        // Test the connection with a basic query
        const { error } = await nuxtApp.$supabase.from('profiles').select('id').limit(1)
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

export default defineNuxtPlugin(async (nuxtApp) => {
  // Ensure we only run this on client side
  if (!process.client) {
    return
  }

  try {
    // Get runtime config to verify Supabase credentials
    const config = useRuntimeConfig()
    if (!config.public.supabaseUrl || !config.public.supabaseKey) {
      throw new Error('Supabase credentials not found in runtime config')
    }

    // Enhanced Supabase initialization with better error handling
    const { success, error: initError } = await waitForSupabase(nuxtApp)
    if (!success) {
      console.error('Supabase initialization error:', initError)
      throw new Error('Failed to initialize Supabase client: ' + (initError?.message || 'Unknown error'))
    }

    const { $supabase } = nuxtApp

    // Initialize auth with enhanced retry mechanism
    const initAuth = async (retries = 5, initialDelay = 1000) => {
      let lastError = null
      
      for (let i = 0; i < retries; i++) {
        try {
          const { data: { session }, error } = await $supabase.auth.getSession()
          
          if (error) {
            if (error.message.includes('refresh_token_not_found')) {
              await $supabase.auth.signOut()
              return null
            }
            
            if (error.status === 429) {
              const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
              await wait(delay)
              continue
            }
            
            lastError = error
            throw error
          }
          
          return session
        } catch (error) {
          console.error('Session initialization error:', error)
          lastError = error
          
          if (i === retries - 1) {
            throw lastError
          }
          
          const delay = Math.min(initialDelay * Math.pow(2, i), 10000)
          await wait(delay)
        }
      }
    }

    // Initialize session
    await initAuth()
    
    const user = useSupabaseUser()
    const profileStore = useProfileStore()

    // Enhanced user change handler
    watch(user, async (newUser, oldUser) => {
      try {
        if (newUser) {
          await profileStore.fetchProfile()
        } else {
          profileStore.clearProfile()
          
          if (oldUser) {
            await $supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Error handling user change:', error)
        await $supabase.auth.signOut()
        profileStore.clearProfile()
      }
    }, { immediate: true })

    // Enhanced auth state change listener
    $supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          profileStore.clearProfile()
        } else if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out')
          await $supabase.auth.signOut()
          profileStore.clearProfile()
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        profileStore.clearProfile()
      }
    })

  } catch (error) {
    console.error('Auth plugin initialization error:', error)
    throw error
  }
})