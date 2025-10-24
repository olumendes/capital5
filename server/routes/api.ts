import { CloudflareEnv, ApiResponse, PaginatedResponse } from '@shared/database-types';
import { DatabaseService } from '../services/database';
import { 
  authenticateRequest, 
  unauthorizedResponse, 
  validationErrorResponse,
  successResponse,
  errorResponse
} from '../utils/auth';

export async function handleAPI(request: Request, env: CloudflareEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Autenticação obrigatória para todas as rotas da API
  const user = await authenticateRequest(request, env);
  if (!user) {
    return unauthorizedResponse();
  }

  const db = new DatabaseService(env.DB);

  try {
    // ========== CATEGORIAS ==========
    if (path === '/api/categories') {
      if (method === 'GET') {
        const categories = await db.getCategories(user.id);
        return successResponse(categories);
      }

      if (method === 'POST') {
        const body = await request.json();
        if (!body.name || !body.type) {
          return validationErrorResponse('Nome e tipo são obrigatórios');
        }

        const category = await db.createCategory(user.id, body);
        return successResponse(category, 'Categoria criada com sucesso');
      }
    }

    if (path.startsWith('/api/categories/') && method === 'DELETE') {
      const categoryId = path.split('/')[3];
      const deleted = await db.deleteCategory(user.id, categoryId);
      
      if (!deleted) {
        return errorResponse('Categoria não encontrada ou não pode ser deletada', 404);
      }

      return successResponse(null, 'Categoria deletada com sucesso');
    }

    // ========== TRANSAÇÕES ==========
    if (path === '/api/transactions') {
      if (method === 'GET') {
        const filters = {
          start_date: url.searchParams.get('start_date') || undefined,
          end_date: url.searchParams.get('end_date') || undefined,
          type: url.searchParams.get('type') as any || undefined,
          category_id: url.searchParams.get('category_id') || undefined,
          source: url.searchParams.get('source') as any || undefined,
          min_amount: url.searchParams.get('min_amount') ? parseFloat(url.searchParams.get('min_amount')!) : undefined,
          max_amount: url.searchParams.get('max_amount') ? parseFloat(url.searchParams.get('max_amount')!) : undefined,
          search: url.searchParams.get('search') || undefined,
          page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1,
          limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50
        };

        const { transactions, total } = await db.getTransactions(user.id, filters);
        
        const response: PaginatedResponse<any> = {
          success: true,
          data: transactions,
          pagination: {
            page: filters.page!,
            limit: filters.limit!,
            total,
            pages: Math.ceil(total / filters.limit!)
          }
        };

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        const body = await request.json();
        
        if (!body.type || !body.category_id || !body.description || !body.amount || !body.date) {
          return validationErrorResponse('Campos obrigatórios: type, category_id, description, amount, date');
        }

        const transactionData = {
          type: body.type,
          category_id: body.category_id,
          description: body.description,
          amount: parseFloat(body.amount),
          date: body.date,
          source: body.source || 'manual',
          source_details: body.source_details ? JSON.stringify(body.source_details) : undefined,
          tags: body.tags ? JSON.stringify(body.tags) : undefined
        };

        const transaction = await db.createTransaction(user.id, transactionData);
        return successResponse(transaction, 'Transação criada com sucesso');
      }
    }

    if (path.startsWith('/api/transactions/')) {
      const transactionId = path.split('/')[3];

      if (method === 'PUT') {
        const body = await request.json();
        
        const updates: any = {};
        if (body.type) updates.type = body.type;
        if (body.category_id) updates.category_id = body.category_id;
        if (body.description) updates.description = body.description;
        if (body.amount) updates.amount = parseFloat(body.amount);
        if (body.date) updates.date = body.date;
        if (body.source) updates.source = body.source;
        if (body.source_details) updates.source_details = JSON.stringify(body.source_details);
        if (body.tags) updates.tags = JSON.stringify(body.tags);

        const updated = await db.updateTransaction(user.id, transactionId, updates);
        
        if (!updated) {
          return errorResponse('Transação não encontrada', 404);
        }

        return successResponse(null, 'Transação atualizada com sucesso');
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteTransaction(user.id, transactionId);
        
        if (!deleted) {
          return errorResponse('Transação não encontrada', 404);
        }

        return successResponse(null, 'Transação deletada com sucesso');
      }
    }

    // ========== INVESTIMENTOS ==========
    if (path === '/api/investments') {
      if (method === 'GET') {
        const filters = {
          type: url.searchParams.get('type') || undefined,
          broker: url.searchParams.get('broker') || undefined
        };

        const investments = await db.getInvestments(user.id, filters);
        return successResponse(investments);
      }

      if (method === 'POST') {
        const body = await request.json();
        
        if (!body.name || !body.type || !body.purchase_date || !body.purchase_price || !body.quantity) {
          return validationErrorResponse('Campos obrigatórios: name, type, purchase_date, purchase_price, quantity');
        }

        const investmentData = {
          name: body.name,
          type: body.type,
          purchase_date: body.purchase_date,
          purchase_price: parseFloat(body.purchase_price),
          quantity: parseFloat(body.quantity),
          current_price: body.current_price ? parseFloat(body.current_price) : undefined,
          broker: body.broker || undefined,
          notes: body.notes || undefined
        };

        const investment = await db.createInvestment(user.id, investmentData);
        return successResponse(investment, 'Investimento criado com sucesso');
      }
    }

    if (path.startsWith('/api/investments/')) {
      const investmentId = path.split('/')[3];

      if (method === 'PUT') {
        const body = await request.json();
        
        const updates: any = {};
        if (body.name) updates.name = body.name;
        if (body.type) updates.type = body.type;
        if (body.purchase_date) updates.purchase_date = body.purchase_date;
        if (body.purchase_price) updates.purchase_price = parseFloat(body.purchase_price);
        if (body.quantity) updates.quantity = parseFloat(body.quantity);
        if (body.current_price !== undefined) updates.current_price = body.current_price ? parseFloat(body.current_price) : null;
        if (body.broker !== undefined) updates.broker = body.broker;
        if (body.notes !== undefined) updates.notes = body.notes;

        const updated = await db.updateInvestment(user.id, investmentId, updates);
        
        if (!updated) {
          return errorResponse('Investimento não encontrado', 404);
        }

        return successResponse(null, 'Investimento atualizado com sucesso');
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteInvestment(user.id, investmentId);
        
        if (!deleted) {
          return errorResponse('Investimento não encontrado', 404);
        }

        return successResponse(null, 'Investimento deletado com sucesso');
      }
    }

    // ========== OBJETIVOS ==========
    if (path === '/api/goals') {
      if (method === 'GET') {
        const filters = {
          status: url.searchParams.get('status') as any || undefined
        };

        const goals = await db.getGoals(user.id, filters);
        return successResponse(goals);
      }

      if (method === 'POST') {
        const body = await request.json();
        
        if (!body.title || !body.target_amount) {
          return validationErrorResponse('Campos obrigatórios: title, target_amount');
        }

        const goalData = {
          title: body.title,
          target_amount: parseFloat(body.target_amount),
          target_date: body.target_date || undefined,
          description: body.description || undefined,
          status: body.status || 'active'
        };

        const goal = await db.createGoal(user.id, goalData);
        return successResponse(goal, 'Objetivo criado com sucesso');
      }
    }

    if (path.startsWith('/api/goals/')) {
      const goalId = path.split('/')[3];

      if (method === 'PUT') {
        const body = await request.json();
        
        const updates: any = {};
        if (body.title) updates.title = body.title;
        if (body.target_amount) updates.target_amount = parseFloat(body.target_amount);
        if (body.current_amount !== undefined) updates.current_amount = parseFloat(body.current_amount);
        if (body.target_date !== undefined) updates.target_date = body.target_date;
        if (body.description !== undefined) updates.description = body.description;
        if (body.status) updates.status = body.status;

        const updated = await db.updateGoal(user.id, goalId, updates);
        
        if (!updated) {
          return errorResponse('Objetivo não encontrado', 404);
        }

        return successResponse(null, 'Objetivo atualizado com sucesso');
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteGoal(user.id, goalId);
        
        if (!deleted) {
          return errorResponse('Objetivo não encontrado', 404);
        }

        return successResponse(null, 'Objetivo deletado com sucesso');
      }
    }

    // ========== DIVISÃO FINANCEIRA ==========
    if (path === '/api/budget/divisions') {
      if (method === 'GET') {
        const divisions = await db.getBudgetDivisions(user.id);
        return successResponse(divisions);
      }

      if (method === 'POST') {
        const body = await request.json();
        
        if (!body.name || !body.percentage) {
          return validationErrorResponse('Campos obrigatórios: name, percentage');
        }

        const divisionData = {
          name: body.name,
          percentage: parseFloat(body.percentage),
          color: body.color || undefined,
          description: body.description || undefined,
          sort_order: body.sort_order || 0
        };

        const division = await db.createBudgetDivision(user.id, divisionData);
        return successResponse(division, 'Divisão criada com sucesso');
      }
    }

    if (path.startsWith('/api/budget/divisions/')) {
      const divisionId = path.split('/')[4];

      if (method === 'PUT') {
        const body = await request.json();
        
        const updates: any = {};
        if (body.name) updates.name = body.name;
        if (body.percentage !== undefined) updates.percentage = parseFloat(body.percentage);
        if (body.color !== undefined) updates.color = body.color;
        if (body.description !== undefined) updates.description = body.description;
        if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

        const updated = await db.updateBudgetDivision(user.id, divisionId, updates);
        
        if (!updated) {
          return errorResponse('Divisão não encontrada', 404);
        }

        return successResponse(null, 'Divisão atualizada com sucesso');
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteBudgetDivision(user.id, divisionId);
        
        if (!deleted) {
          return errorResponse('Divisão não encontrada', 404);
        }

        return successResponse(null, 'Divisão deletada com sucesso');
      }
    }

    // ========== CATEGORIAS DE ORÇAMENTO ==========
    if (path === '/api/budget/categories') {
      if (method === 'GET') {
        const divisionId = url.searchParams.get('division_id') || undefined;
        const categories = await db.getBudgetCategories(user.id, divisionId);
        return successResponse(categories);
      }

      if (method === 'POST') {
        const body = await request.json();
        
        if (!body.division_id || !body.name || !body.allocated_amount) {
          return validationErrorResponse('Campos obrigatórios: division_id, name, allocated_amount');
        }

        const categoryData = {
          division_id: body.division_id,
          name: body.name,
          allocated_amount: parseFloat(body.allocated_amount),
          icon: body.icon || undefined,
          color: body.color || undefined
        };

        const category = await db.createBudgetCategory(user.id, categoryData);
        return successResponse(category, 'Categoria de orçamento criada com sucesso');
      }
    }

    if (path.startsWith('/api/budget/categories/')) {
      const categoryId = path.split('/')[4];

      if (method === 'PUT') {
        const body = await request.json();
        
        const updates: any = {};
        if (body.name) updates.name = body.name;
        if (body.allocated_amount !== undefined) updates.allocated_amount = parseFloat(body.allocated_amount);
        if (body.spent_amount !== undefined) updates.spent_amount = parseFloat(body.spent_amount);
        if (body.icon !== undefined) updates.icon = body.icon;
        if (body.color !== undefined) updates.color = body.color;

        const updated = await db.updateBudgetCategory(user.id, categoryId, updates);
        
        if (!updated) {
          return errorResponse('Categoria de orçamento não encontrada', 404);
        }

        return successResponse(null, 'Categoria de orçamento atualizada com sucesso');
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteBudgetCategory(user.id, categoryId);
        
        if (!deleted) {
          return errorResponse('Categoria de orçamento não encontrada', 404);
        }

        return successResponse(null, 'Categoria de orçamento deletada com sucesso');
      }
    }

    return errorResponse('Rota não encontrada', 404);

  } catch (error) {
    console.error('Erro na API:', error);
    return errorResponse('Erro interno do servidor');
  }
}
