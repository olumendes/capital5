import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!loginForm.email || !loginForm.password) {
      return;
    }

    const success = await login({
      email: loginForm.email,
      password: loginForm.password
    });

    if (success) {
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      return;
    }

    const success = await register({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password
    });

    if (success) {
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Capital</h1>
          </div>
          <p className="text-gray-600 mt-2">Controle Financeiro Pessoal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-center">
              Entre ou crie uma conta para sincronizar seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Sua senha"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !loginForm.email || !loginForm.password}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name">Nome</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-confirm">Confirmar Senha</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme sua senha"
                      required
                    />
                    {registerForm.password && registerForm.confirmPassword && 
                     registerForm.password !== registerForm.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">Senhas não conferem</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={
                      isLoading || 
                      !registerForm.name || 
                      !registerForm.email || 
                      !registerForm.password ||
                      registerForm.password !== registerForm.confirmPassword
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info adicional */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>✅ Dados sincronizados na nuvem</p>
          <p>🔒 Acesso seguro de qualquer dispositivo</p>
          <p>📱 Funciona offline após primeiro acesso</p>
        </div>
      </div>
    </div>
  );
}
