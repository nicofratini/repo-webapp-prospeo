import { defineStore } from 'pinia'

interface Profile {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  super_admin: boolean
  created_at: string
  updated_at: string
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as Profile | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAdmin: (state) => state.profile?.is_admin || state.profile?.super_admin || false,
    isSuperAdmin: (state) => state.profile?.super_admin || false,
    fullName: (state) => state.profile?.full_name ?? 'Utilisateur',
  },

  actions: {
    async fetchProfile() {
      const user = useSupabaseUser()
      const client = useSupabaseClient()
      
      if (!user.value) return

      try {
        this.loading = true
        this.error = null
        
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.value.id)
          .maybeSingle()

        if (error) throw error

        this.profile = data
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Une erreur est survenue'
        console.error('Error fetching profile:', err)
      } finally {
        this.loading = false
      }
    },

    async updateProfile(updates: Partial<Profile>) {
      const user = useSupabaseUser()
      const client = useSupabaseClient()
      
      if (!user.value) return

      try {
        this.loading = true
        this.error = null

        const { data, error } = await client
          .from('profiles')
          .update(updates)
          .eq('id', user.value.id)
          .select()
          .single()

        if (error) throw error

        this.profile = data
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Une erreur est survenue'
        console.error('Error updating profile:', err)
      } finally {
        this.loading = false
      }
    },

    clearProfile() {
      this.profile = null
      this.error = null
    }
  }
})