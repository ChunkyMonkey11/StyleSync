import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts'

interface JWTPayload {
  publicId: string
  userState: string
  exp: number
  iat: number
}

export async function createJWT(
  publicId: string,
  userState: string,
  secret: string,
  days: number
): Promise<string> {
  const payload: JWTPayload = {
    publicId,
    userState,
    exp: getNumericDate(days * 24 * 60 * 60), // days to seconds
    iat: getNumericDate(new Date()),
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HS256' },
    false,
    ['sign']
  )

  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key)
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HS256' },
      false,
      ['verify']
    )

    const payload = await verify(token, key)
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}


