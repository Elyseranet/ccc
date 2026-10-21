export interface ILoginRequest {
  email: string
  password: string
}

/** Liste blanche de `PATCH /moi` (A4) : avatar, téléphone, mot de passe. */
export interface IUpdateMeRequest {
  avatarUrl?: string | null
  phone?: string | null
  currentPassword?: string
  newPassword?: string
}
