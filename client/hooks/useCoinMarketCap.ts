import { useState, useEffect, useCallback } from "react";

export interface CryptoPriceData {
  symbol: string;
  name: string;
  price: number;
  priceUSD: number;
  priceBRL: number;
  change24h: number;
  lastUpdated: string;
}

const API_KEY = "94d4a907464a4b79ba039952eff85bb5";
const BASE_URL = "https://pro-api.coinmarketcap.com/v1";
// Fallback CORS proxy for development/testing
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

export function useCoinMarketCap(symbol: string = "BTC") {
  const [data, setData] = useState<CryptoPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbol}&convert=BRL,USD`;

      // Try direct fetch first
      let response: Response | null = null;
      try {
        response = await fetch(url, {
          headers: {
            "X-CMC_PRO_API_KEY": API_KEY,
            Accepts: "application/json",
          },
        });
      } catch (directError) {
        // If direct fetch fails (CORS), try with CORS proxy
        console.warn("Direct fetch failed, trying CORS proxy...");
        try {
          response = await fetch(CORS_PROXY + url, {
            headers: {
              "X-CMC_PRO_API_KEY": API_KEY,
              Accepts: "application/json",
            },
          });
        } catch (proxyError) {
          throw new Error(
            "Não foi possível conectar à API de preços. Tente novamente mais tarde.",
          );
        }
      }

      if (!response || !response.ok) {
        throw new Error(
          `API Error: ${response?.status || "Unknown"} ${response?.statusText || ""}`,
        );
      }

      const result = await response.json();

      if (!result.data || !result.data[symbol]) {
        throw new Error("Símbolo não encontrado");
      }

      const cryptoData = result.data[symbol];
      const quoteData = cryptoData.quote;

      setData({
        symbol,
        name: cryptoData.name,
        price: quoteData.BRL?.price || 0,
        priceUSD: quoteData.USD?.price || 0,
        priceBRL: quoteData.BRL?.price || 0,
        change24h: quoteData.BRL?.percent_change_24h || 0,
        lastUpdated: cryptoData.last_updated || new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar preço do Bitcoin";
      setError(message);
      console.error("CoinMarketCap API Error:", err);
      // Silently fail - this is a non-critical feature
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrice();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const refresh = useCallback(() => {
    fetchPrice();
  }, [fetchPrice]);

  return { data, loading, error, refresh };
}
