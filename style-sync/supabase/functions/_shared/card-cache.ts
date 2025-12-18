/**
 * Card Profile Cache Utilities
 * Helper functions to invalidate/refresh card profile cache
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Invalidate card profile cache for a user
 * This forces a fresh recalculation on the next get-card-profile request
 */
export async function invalidateCardProfileCache(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Delete the cached profile - next request will recalculate
  const { error } = await supabase
    .from('user_card_profile')
    .delete()
    .eq('user_id', userId)
  
  if (error) {
    // Log but don't throw - cache invalidation failure shouldn't break the main operation
    console.error('Error invalidating card profile cache:', error)
  } else {
    console.log(`Card profile cache invalidated for user: ${userId}`)
  }
}

/**
 * Invalidate card profile cache by shop_public_id
 */
export async function invalidateCardProfileCacheByPublicId(
  supabaseUrl: string,
  supabaseKey: string,
  shopPublicId: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Delete the cached profile - next request will recalculate
  const { error } = await supabase
    .from('user_card_profile')
    .delete()
    .eq('shop_public_id', shopPublicId)
  
  if (error) {
    console.error('Error invalidating card profile cache:', error)
  } else {
    console.log(`Card profile cache invalidated for shop_public_id: ${shopPublicId}`)
  }
}
