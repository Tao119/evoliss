import { signIn, signOut } from 'next-auth/react'

export type LoginParams = {
  email: string
  password: string
}

export const signin = async (params: LoginParams) => {
  const { email, password } = params

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  return result
}


export const signout = async () => {
  await signOut({ redirect: false })
}