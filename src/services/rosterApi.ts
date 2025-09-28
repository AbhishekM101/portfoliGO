import { supabase } from '@/integrations/supabase/client';

// ML Model API endpoints
const GROWTH_API_URL = 'http://localhost:5001';
const RISK_API_URL = 'http://localhost:5002';
const VALUE_API_URL = 'http://localhost:5003';

// Popular stocks to populate
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 
  'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'SPOT',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA',
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'DHR', 'ABT',
  'KO', 'PEP', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT'
];

/**
 * Fetch stock data from Financial Modeling Prep API
 */
async function fetchStockData(symbol: string) {
  try {
    console.log(`📊 Fetching ${symbol} data from Financial Modeling Prep API...`);
    
    // Use proxy endpoints to avoid CORS issues
    const [profileResponse, quoteResponse] = await Promise.all([
      fetch(`${GROWTH_API_URL}/api/fmp/profile/${symbol}`),
      fetch(`${GROWTH_API_URL}/api/fmp/quote/${symbol}`)
    ]);

    // Check if API calls were successful
    if (!profileResponse.ok || !quoteResponse.ok) {
      console.log(`⚠️ API calls failed (${profileResponse.status}, ${quoteResponse.status}), using mock data for ${symbol}`);
      throw new Error('API calls failed');
    }

    const [profileData, quoteData] = await Promise.all([
      profileResponse.json(),
      quoteResponse.json()
    ]);

    if (!profileData || profileData.length === 0 || !quoteData || quoteData.length === 0) {
      console.log(`⚠️ API returned empty data for ${symbol}, using mock data`);
      throw new Error(`No data found for ${symbol}`);
    }

    const profile = profileData[0];
    const quote = quoteData[0];

    console.log('✅ Real API data fetched successfully');
    return {
      symbol: symbol.toUpperCase(),
      company: profile.companyName || profile.name || 'Unknown Company',
      sector: profile.sector || 'Unknown',
      price: quote.price || 0,
      marketCap: quote.marketCap || 0,
      volume: quote.volume || 0,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.log(`⚠️ Using mock data for ${symbol} due to API error:`, error);
    
    // Return mock data for AAPL
    const mockData = {
      'AAPL': {
        symbol: 'AAPL',
        company: 'Apple Inc.',
        sector: 'Technology',
        price: 175.43,
        marketCap: 2800000000000,
        volume: 45000000,
        change: 2.3,
        changePercent: 1.33,
        lastUpdated: new Date().toISOString()
      }
    };
    
    return mockData[symbol.toUpperCase()] || {
      symbol: symbol.toUpperCase(),
      company: `${symbol.toUpperCase()} Company`,
      sector: 'Technology',
      price: 100,
      marketCap: 1000000000,
      volume: 1000000,
      change: 1.0,
      changePercent: 1.0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get ML scores from Flask servers
 */
async function getMLScores(symbol: string) {
  try {
    console.log(`🤖 Getting ML scores for ${symbol}...`);
    
    const [growthResponse, riskResponse, valueResponse] = await Promise.all([
      fetch(`${GROWTH_API_URL}/api/growth/${symbol}`),
      fetch(`${RISK_API_URL}/api/risk/${symbol}`),
      fetch(`${VALUE_API_URL}/api/value/${symbol}`)
    ]);

    const [growthData, riskData, valueData] = await Promise.all([
      growthResponse.json(),
      riskResponse.json(),
      valueResponse.json()
    ]);

    if (growthData.error || riskData.error || valueData.error) {
      throw new Error(`ML API error: ${growthData.error || riskData.error || valueData.error}`);
    }

    return {
      growthScore: growthData.growthScore || 50,
      riskScore: riskData.riskScore || 50,
      valueScore: valueData.valueScore || 50,
      riskCategory: riskData.riskCategory || 'Medium Risk'
    };
  } catch (error) {
    console.error(`❌ Error getting ML scores for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Calculate total score from ML scores
 */
function calculateTotalScore(growthScore: number, riskScore: number, valueScore: number): number {
  return Math.round((growthScore * 0.4) + (valueScore * 0.3) + (riskScore * 0.3));
}

/**
 * Store stock data in Supabase database
 */
async function storeStockData(stockData: any) {
  try {
    console.log(`💾 Storing ${stockData.symbol} in database...`);
    
    const { data, error } = await supabase
      .from('stocks')
      .upsert(stockData, { onConflict: 'symbol' })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error storing stock data:`, error);
    throw error;
  }
}

/**
 * Main function to process a stock symbol
 */
export async function processStock(symbol: string) {
  try {
    console.log(`\n🚀 Processing ${symbol}...`);
    console.log('='.repeat(50));
    
    // Step 1: Fetch stock data from API
    const stockData = await fetchStockData(symbol);
    console.log('✅ Stock data fetched:', {
      symbol: stockData.symbol,
      company: stockData.company,
      sector: stockData.sector,
      price: stockData.price
    });
    
    // Step 2: Get ML scores from Flask servers
    const mlScores = await getMLScores(symbol);
    console.log('✅ ML scores received:', mlScores);
    
    // Step 3: Calculate total score
    const totalScore = calculateTotalScore(
      mlScores.growthScore,
      mlScores.riskScore,
      mlScores.valueScore
    );
    console.log(`✅ Total score calculated: ${totalScore}`);
    
    // Step 4: Combine all data
    const completeStockData = {
      symbol: stockData.symbol,
      company: stockData.company,
      sector: stockData.sector,
      total_score: totalScore,
      growth_score: mlScores.growthScore,
      value_score: mlScores.valueScore,
      risk_score: mlScores.riskScore,
      change: stockData.change,
      change_percent: stockData.changePercent,
      draft_position: 0,
      price: stockData.price,
      market_cap: stockData.marketCap,
      volume: stockData.volume,
      last_updated: stockData.lastUpdated,
      risk_category: mlScores.riskCategory
    };
    
    console.log('✅ Complete stock data prepared:', {
      symbol: completeStockData.symbol,
      company: completeStockData.company,
      total_score: completeStockData.total_score,
      growth_score: completeStockData.growth_score,
      risk_score: completeStockData.risk_score,
      value_score: completeStockData.value_score
    });
    
    // Step 5: Store in database
    const storedData = await storeStockData(completeStockData);
    console.log('✅ Stock stored in database:', storedData);
    
    console.log('='.repeat(50));
    console.log(`🎉 Successfully processed ${symbol}!`);
    console.log('='.repeat(50));
    
    return storedData;
    
  } catch (error) {
    console.error(`❌ Error processing ${symbol}:`, error);
    throw error;
  }
}

/**
 * Populate database with multiple stocks
 */
export async function populateStocksDatabase(stockSymbols: string[] = POPULAR_STOCKS, batchSize: number = 5) {
  console.log(`🚀 Starting stock population for ${stockSymbols.length} stocks...`);
  console.log('Stocks to process:', stockSymbols.join(', '));
  
  const results = {
    successful: [] as string[],
    failed: [] as { symbol: string, error: string }[],
    total: stockSymbols.length
  };
  
  // Process stocks in batches to avoid overwhelming the APIs
  for (let i = 0; i < stockSymbols.length; i += batchSize) {
    const batch = stockSymbols.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
    
    const batchPromises = batch.map(async (symbol) => {
      try {
        await processStock(symbol);
        results.successful.push(symbol);
        return { symbol, success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ symbol, error: errorMessage });
        return { symbol, success: false, error: errorMessage };
      }
    });
    
    await Promise.all(batchPromises);
    
    // Add delay between batches to be respectful to APIs
    if (i + batchSize < stockSymbols.length) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Stock population completed!');
  console.log(`✅ Successful: ${results.successful.length}/${results.total}`);
  console.log(`❌ Failed: ${results.failed.length}/${results.total}`);
  
  if (results.failed.length > 0) {
    console.log('Failed stocks:', results.failed.map(f => `${f.symbol} (${f.error})`).join(', '));
  }
  
  return results;
}

/**
 * Get all stocks from database
 */
export async function getAllStocks() {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('total_score', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch stocks: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
}

/**
 * Clear all stocks from database
 */
export async function clearStocksDatabase() {
  try {
    const { error } = await supabase
      .from('stocks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error) {
      throw new Error(`Failed to clear stocks: ${error.message}`);
    }
    
    console.log('✅ All stocks cleared from database');
    return true;
  } catch (error) {
    console.error('Error clearing stocks:', error);
    throw error;
  }
}
