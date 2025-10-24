import { CloudflareEnv, User } from '@shared/database-types';

// Função para hash de password (simples para demo, use bcrypt em produção)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt-secret-key');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para verificar password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Função para criar JWT token
export async function createJWT(user: User, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const secretKey = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${message}.${encodedSignature}`;
}

// Função para verificar JWT token
export async function verifyJWT(token: string, secret: string): Promise<User | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verificar assinatura
    const message = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const secretKey = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature + '='.repeat((4 - encodedSignature.length % 4) % 4)), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    
    if (!isValid) {
      return null;
    }

    // Decodificar payload
    const payload = JSON.parse(atob(encodedPayload + '='.repeat((4 - encodedPayload.length % 4) % 4)));
    
    // Verificar expiração
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      created_at: '',
      updated_at: ''
    };
  } catch (error) {
    console.error('Erro ao verificar JWT:', error);
    return null;
  }
}

// Middleware para autenticação
export async function authenticateRequest(request: Request, env: CloudflareEnv): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await verifyJWT(token, env.JWT_SECRET);
}

// Função para gerar ID único
export function generateId(): string {
  return crypto.randomUUID();
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar senha
export function isValidPassword(password: string): boolean {
  // Mínimo 6 caracteres
  return password.length >= 6;
}

// Resposta de erro padrão
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    }
  );
}

// Resposta de erro de validação
export function validationErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    }
  );
}

// Resposta de sucesso
export function successResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({ success: true, data, message }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    }
  );
}

// Resposta de erro interno
export function errorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    }
  );
}
