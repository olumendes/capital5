import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOpenFinance } from '../hooks/useOpenFinance';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useOpenFinance();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Erro de autorização: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Parâmetros de autorização inválidos');
        }

        await handleAuthCallback(code, state);
        
        setStatus('success');
        setMessage('Banco conectado com sucesso!');
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Erro no callback:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro desconhecido');
        
        // Redirecionar para o dashboard após 3 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processando autorização...';
      case 'success':
        return 'Conexão estabelecida!';
      case 'error':
        return 'Erro na conexão';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          {getTitle()}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message || 'Aguarde enquanto processamos sua autorização...'}
        </p>
        
        {status === 'loading' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-sm text-gray-500">
              Conectando com seu banco...
            </p>
          </div>
        )}
        
        {status !== 'loading' && (
          <p className="text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        )}
      </div>
    </div>
  );
}
