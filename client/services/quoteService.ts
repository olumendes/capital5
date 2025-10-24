import { InvestmentType, QuoteResponse } from '@shared/investment-types';

class QuoteService {
  private cache = new Map<string, { data: QuoteResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Buscar cotação atual
  async getCurrentQuote(type: InvestmentType): Promise<QuoteResponse> {
    const cacheKey = `quote_${type}`;
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let quote: QuoteResponse;

      switch (type) {
        case 'bitcoin':
          quote = await this.fetchCryptoQuote('bitcoin');
          break;
        case 'ethereum':
          quote = await this.fetchCryptoQuote('ethereum');
          break;
        case 'dolar':
          quote = await this.fetchCurrencyQuote('USD');
          break;
        case 'euro':
          quote = await this.fetchCurrencyQuote('EUR');
          break;
        case 'ouro':
          quote = await this.fetchCommodityQuote('gold');
          break;
        case 'prata':
          quote = await this.fetchCommodityQuote('silver');
          break;
        case 'tesouro_direto':
        case 'cdb':
        case 'lci_lca':
          // Para títulos de renda fixa, usar valores simulados ou APIs específicas
          quote = await this.fetchFixedIncomeQuote(type);
          break;
        default:
          throw new Error(`Tipo de investimento não suportado: ${type}`);
      }

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: quote,
        timestamp: Date.now()
      });

      return quote;
    } catch (error) {
      console.error(`Erro ao buscar cotação para ${type}:`, error);
      
      // Retornar cotação padrão em caso de erro
      return this.getDefaultQuote(type);
    }
  }

  // Buscar múltiplas cotações
  async getMultipleQuotes(types: InvestmentType[]): Promise<Record<InvestmentType, QuoteResponse>> {
    const promises = types.map(async (type) => {
      const quote = await this.getCurrentQuote(type);
      return [type, quote] as [InvestmentType, QuoteResponse];
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results) as Record<InvestmentType, QuoteResponse>;
  }

  // Buscar cotação de criptomoeda via CoinGecko API (gratuita)
  private async fetchCryptoQuote(coinId: string): Promise<QuoteResponse> {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar cotação crypto: ${response.status}`);
    }

    const data = await response.json();
    const coinData = data[coinId];

    if (!coinData || !coinData.brl) {
      throw new Error(`Dados de cotação inválidos para ${coinId}`);
    }

    return {
      symbol: coinId.toUpperCase(),
      price: coinData.brl,
      change24h: coinData.brl_24h_change || 0,
      lastUpdate: new Date().toISOString()
    };
  }

  // Buscar cotação de moeda via AwesomeAPI (gratuita, brasileira)
  private async fetchCurrencyQuote(currency: string): Promise<QuoteResponse> {
    const response = await fetch(
      `https://economia.awesomeapi.com.br/last/${currency}-BRL`
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar cotação moeda');
    }

    const data = await response.json();
    const currencyData = data[`${currency}BRL`];

    return {
      symbol: currency,
      price: parseFloat(currencyData.bid),
      change24h: parseFloat(currencyData.pctChange),
      lastUpdate: currencyData.create_date
    };
  }

  // Buscar cotação de commodities (simulada - em produção usar APIs reais)
  private async fetchCommodityQuote(commodity: string): Promise<QuoteResponse> {
    // Em produção, usar APIs como MetalAPI, Alpha Vantage, etc.
    // Aqui vamos simular com valores base + variação aleatória
    
    const basePrices = {
      gold: 350, // R$ por grama
      silver: 4.5 // R$ por grama
    };

    const basePrice = basePrices[commodity as keyof typeof basePrices] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variação
    const price = basePrice * (1 + variation);
    
    return {
      symbol: commodity.toUpperCase(),
      price: Math.round(price * 100) / 100,
      change24h: variation * 100,
      lastUpdate: new Date().toISOString()
    };
  }

  // Buscar cotação de renda fixa (simulada)
  private async fetchFixedIncomeQuote(type: InvestmentType): Promise<QuoteResponse> {
    // Para renda fixa, simular rendimento baseado em CDI/Selic
    const yields = {
      tesouro_direto: 1.12, // 112% do CDI
      cdb: 1.08, // 108% do CDI
      lci_lca: 0.95 // 95% do CDI
    };

    const cdiRate = 11.25; // Taxa CDI atual (simulada)
    const annualYield = cdiRate * (yields[type] || 1);
    const dailyYield = annualYield / 365;
    
    return {
      symbol: type.toUpperCase(),
      price: 1 + (dailyYield / 100), // Valor unitário baseado no rendimento diário
      change24h: dailyYield,
      lastUpdate: new Date().toISOString()
    };
  }

  // Cotação padrão em caso de erro
  private getDefaultQuote(type: InvestmentType): QuoteResponse {
    const defaultPrices = {
      bitcoin: 420000, // Preço aproximado atual do Bitcoin em BRL
      ethereum: 22000,  // Preço aproximado atual do Ethereum em BRL
      dolar: 5.20,
      euro: 5.65,
      ouro: 350,
      prata: 4.5,
      tesouro_direto: 1.0,
      cdb: 1.0,
      lci_lca: 1.0
    };

    return {
      symbol: type.toUpperCase(),
      price: defaultPrices[type] || 1,
      change24h: 0,
      lastUpdate: new Date().toISOString()
    };
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const quoteService = new QuoteService();
