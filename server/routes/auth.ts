import { CloudflareEnv, UserCreate, UserLogin, AuthResponse } from '@shared/database-types';
import { DatabaseService } from '../services/database';
import { 
  hashPassword, 
  verifyPassword, 
  createJWT, 
  isValidEmail, 
  isValidPassword,
  validationErrorResponse,
  successResponse,
  errorResponse
} from '../utils/auth';

export async function handleAuth(request: Request, env: CloudflareEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  const db = new DatabaseService(env.DB);

  // POST /api/auth/register
  if (path === '/api/auth/register' && request.method === 'POST') {
    try {
      const body: UserCreate = await request.json();
      
      // Validações
      if (!body.email || !body.password) {
        return validationErrorResponse('Email e senha são obrigatórios');
      }

      if (!isValidEmail(body.email)) {
        return validationErrorResponse('Email inválido');
      }

      if (!isValidPassword(body.password)) {
        return validationErrorResponse('Senha deve ter pelo menos 6 caracteres');
      }

      // Verificar se usuário já existe
      const existingUser = await db.getUserByEmail(body.email);
      if (existingUser) {
        return validationErrorResponse('Email já está em uso');
      }

      // Criar usuário
      const passwordHash = await hashPassword(body.password);
      const user = await db.createUser(body.email, passwordHash, body.name);

      // Criar categorias padrão
      await db.createDefaultCategories(user.id);

      // Gerar token
      const token = await createJWT(user, env.JWT_SECRET);

      const response: AuthResponse = {
        success: true,
        user,
        token,
        message: 'Usuário criado com sucesso'
      };

      return successResponse(response);
    } catch (error) {
      console.error('Erro no registro:', error);
      return errorResponse('Erro interno do servidor');
    }
  }

  // POST /api/auth/login
  if (path === '/api/auth/login' && request.method === 'POST') {
    try {
      const body: UserLogin = await request.json();
      
      // Validações
      if (!body.email || !body.password) {
        return validationErrorResponse('Email e senha são obrigatórios');
      }

      // Buscar usuário
      const userWithPassword = await db.getUserByEmail(body.email);
      if (!userWithPassword) {
        return validationErrorResponse('Email ou senha incorretos');
      }

      // Verificar senha
      const isValidPassword = await verifyPassword(body.password, userWithPassword.password_hash);
      if (!isValidPassword) {
        return validationErrorResponse('Email ou senha incorretos');
      }

      // Remover hash da senha da resposta
      const { password_hash, ...user } = userWithPassword;

      // Gerar token
      const token = await createJWT(user, env.JWT_SECRET);

      const response: AuthResponse = {
        success: true,
        user,
        token,
        message: 'Login realizado com sucesso'
      };

      return successResponse(response);
    } catch (error) {
      console.error('Erro no login:', error);
      return errorResponse('Erro interno do servidor');
    }
  }

  // POST /api/auth/verify
  if (path === '/api/auth/verify' && request.method === 'POST') {
    try {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return validationErrorResponse('Token não fornecido');
      }

      const token = authHeader.substring(7);
      const { verifyJWT } = await import('../utils/auth');
      const user = await verifyJWT(token, env.JWT_SECRET);

      if (!user) {
        return validationErrorResponse('Token inválido ou expirado');
      }

      // Buscar dados atualizados do usuário
      const currentUser = await db.getUserById(user.id);
      if (!currentUser) {
        return validationErrorResponse('Usuário não encontrado');
      }

      const response: AuthResponse = {
        success: true,
        user: currentUser,
        message: 'Token válido'
      };

      return successResponse(response);
    } catch (error) {
      console.error('Erro na verificação:', error);
      return errorResponse('Erro interno do servidor');
    }
  }

  return errorResponse('Rota não encontrada', 404);
}
