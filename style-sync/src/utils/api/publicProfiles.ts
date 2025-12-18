/**
 * Public Profiles API Client
 * Handles fetching public profiles
 */

import { apiRequestJson } from '../apiClient'

export interface PublicProfile {
  id: string
  shop_public_id: string
  username: string
  display_name: string
  profile_pic: string
  bio: string
  interests: string[]
  is_public: boolean
  created_at: string
}

interface GetPublicProfilesResponse {
  profiles: PublicProfile[]
}

/**
 * Get list of public profiles excluding current user and existing friends
 */
export async function getPublicProfiles(): Promise<PublicProfile[]> {
  const response = await apiRequestJson<GetPublicProfilesResponse>('get-public-profiles', {
    method: 'GET'
  })
  return response.profiles
}





