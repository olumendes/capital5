import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para o dashboard do Capital
    const timer = setTimeout(() => {
      navigate('/capital');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Capital</h1>
        <p className="text-lg text-blue-700 mb-8">Controle Financeiro Pessoal</p>

        <div className="flex items-center justify-center gap-3">
          <svg
            className="animate-spin h-6 w-6 text-blue-600"
            viewBox="0 0 50 50"
          >
            <circle
              className="opacity-30"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
            />
            <circle
              className="text-blue-600"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset="75"
            />
          </svg>
          <span className="text-blue-700">Carregando seu dashboard...</span>
        </div>
      </div>
    </div>
  );
}
