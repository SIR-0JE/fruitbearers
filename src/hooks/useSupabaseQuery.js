import { useQuery } from '@tanstack/react-query'

/**
 * Custom hook for Supabase queries with built-in timeout and error handling.
 * @param {string[]} queryKey - The unique key for the query
 * @param {Function} queryFn - The function that returns the Supabase promise
 * @param {Object} options - Additional React Query options
 */
export function useSupabaseQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), 10000)
      })

      // Race the Supabase request against the timeout
      try {
        const result = await Promise.race([queryFn(), timeoutPromise])
        
        if (result && result.error) {
          throw new Error(result.error.message || 'An error occurred while fetching data.')
        }
        
        // If the query returns a standard Supabase result, return data.
        // If it returns a raw object (like our stats), return the whole object.
        return (result && Object.prototype.hasOwnProperty.call(result, 'data')) ? result.data : result
      } catch (error) {
        console.error(`Query failed [${queryKey.join(', ')}]:`, error)
        throw error
      }
    },
    ...options,
  })
}
