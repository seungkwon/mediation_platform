export type UserRole = 'buyer' | 'seller'

export interface UserPublic {
  id: string
  name: string
  profile_image_path: string | null
}

export interface UserMe {
  id: string
  email: string
  name: string
  phone: string | null
  profile_image_path: string | null
  is_active: boolean
  created_at: string
  active_role: UserRole
  has_seller_profile: boolean
  is_admin: boolean
}

export interface UserUpdateInput {
  name?: string
  phone?: string | null
  profile_image_path?: string | null
  active_role?: UserRole
}
