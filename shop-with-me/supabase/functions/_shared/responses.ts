import { corsHeaders } from './cors.ts'

export function successResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function requireMethod(req: Request, method: string) {
  if (req.method !== method) {
    throw new Error(`Method ${req.method} not allowed. Expected ${method}`)
  }
}

export function validateEnvVars(vars: string[]) {
  const missing = vars.filter(varName => !Deno.env.get(varName))
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

// Rate limiting storage (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, limit = 100, windowMs = 60000) {
  const now = Date.now()
  const key = identifier
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

export function validateInput(data: any, schema: Record<string, (value: any) => boolean>) {
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(data[key])) {
      throw new Error(`Invalid input: ${key}`)
    }
  }
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
}


