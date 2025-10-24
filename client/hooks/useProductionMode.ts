import { useState, useEffect } from 'react';
import { getCookie, setCookie } from '../utils/cookies';

const PRODUCTION_MODE_KEY = 'capital_production_mode';

export function useProductionMode() {
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar configuração do cookie
    const savedMode = getCookie(PRODUCTION_MODE_KEY);
    if (savedMode === 'true') {
      setIsProductionMode(true);
    }
    setIsLoading(false);
  }, []);

  const toggleProductionMode = (enabled: boolean) => {
    setIsProductionMode(enabled);
    setCookie(PRODUCTION_MODE_KEY, enabled.toString(), 365);
    
    // Forçar reload da página para aplicar mudanças no Open Finance
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const resetProductionMode = () => {
    setIsProductionMode(false);
    setCookie(PRODUCTION_MODE_KEY, 'false', 365);
    
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return {
    isProductionMode,
    isLoading,
    toggleProductionMode,
    resetProductionMode
  };
}
