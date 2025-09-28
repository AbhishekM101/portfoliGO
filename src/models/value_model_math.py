import pandas as pd
import numpy as np
import requests
import time
import warnings
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
warnings.filterwarnings('ignore')

# Import your API key
from API_KEY import API_KEY

class ValueScoreCalculator:
    """
    A balanced stock scoring model combining value and quality factors.
    Score ranges from 1-100 where 100 = amazing investment, 1 = poor investment.
    
    Weighting (Rebalanced for Quality):
    - PE Ratio: 25% (reduced from 40%)
    - PEG Ratio: 15% (reduced from 20%)
    - Free Cash Flow Yield: 20% (new - rewards cash generation)
    - ROE/Quality: 15% (increased from 10%)
    - Debt/Equity: 10% (reduced from 15%)
    - EPS Growth: 15% (same)
    """
    
    def __init__(self):
        self.api_key = API_KEY
        self.base_url = "https://financialmodelingprep.com/api/v3"
        
        # Rebalanced scoring weights to favor quality compounders
        self.weights = {
            'pe_ratio': 0.25,       # 25% - Still important but not dominant
            'peg_ratio': 0.15,      # 15% - Reduced weight
            'fcf_yield': 0.20,      # 20% - NEW: Rewards cash generation
            'roe_quality': 0.15,    # 15% - Increased for profitability
            'debt_equity': 0.10,    # 10% - Reduced weight
            'eps_growth': 0.15     # 15% - Unchanged
        }
        
        # More balanced benchmarks favoring quality growth
        self.benchmarks = {
            # Value metrics (more lenient for quality)
            'excellent_pe': 20,     # PE <= 20 gets full points (more lenient)
            'poor_pe': 60,          # PE >= 60 gets zero points (more lenient)
            'excellent_peg': 1.5,   # PEG <= 1.5 gets full points (much more lenient)
            'poor_peg': 4.0,        # PEG >= 4.0 gets zero points
            
            # Quality metrics
            'excellent_fcf_yield': 8,  # FCF Yield >= 8% gets full points
            'poor_fcf_yield': 2,       # FCF Yield <= 2% gets zero points
            'excellent_roe': 20,       # ROE >= 20% gets full points
            'poor_roe': 10,            # ROE <= 10% gets zero points
            
            # Financial strength (more lenient)
            'excellent_debt': 0.5,  # D/E <= 0.5 gets full points (more lenient)
            'poor_debt': 3.0,       # D/E >= 3.0 gets zero points (more lenient)
            
            # Growth
            'excellent_eps_growth': 15, # EPS growth >= 15% gets full points (more achievable)
            'poor_eps_growth': -10,     # EPS growth <= -10% gets zero points
        }
    
    def fetch_stock_data(self, symbol):
        """Fetch all required financial data for a stock symbol"""
        print(f"Fetching data for {symbol}...")
        
        data = {'symbol': symbol}
        
        try:
            # Get financial ratios (PE, D/E, ROE)
            ratios = self._get_financial_ratios(symbol)
            data.update(ratios)
            
            # Get PEG ratio
            peg = self._get_peg_ratio(symbol)
            data.update(peg)
            
            # Get EPS growth
            eps_growth = self._get_eps_growth(symbol)
            data.update(eps_growth)
            
            # Get cash flow data for FCF yield
            fcf_data = self._get_fcf_yield(symbol)
            data.update(fcf_data)
            
            # Get company profile
            profile = self._get_company_profile(symbol)
            data.update(profile)
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None
            
        return data
    
    def _get_financial_ratios(self, symbol):
        """Get key financial ratios including PE, D/E, ROE"""
        url = f"{self.base_url}/ratios-ttm/{symbol}?apikey={self.api_key}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return {}
            
        data = response.json()
        if not data:
            return {}
            
        ratios = data[0]
        
        # FMP returns percentages as decimals (0.25 = 25%), so convert to percentages
        roe_raw = self._clean_numeric(ratios.get('returnOnEquityTTM'))
        gross_margin_raw = self._clean_numeric(ratios.get('grossProfitMarginTTM'))
        operating_margin_raw = self._clean_numeric(ratios.get('operatingProfitMarginTTM'))
        
        return {
            'pe_ratio': self._clean_numeric(ratios.get('priceEarningsRatioTTM')),
            'debt_equity': self._clean_numeric(ratios.get('debtEquityRatioTTM')),
            'roe': roe_raw * 100 if roe_raw is not None else None,
            'gross_margin': gross_margin_raw * 100 if gross_margin_raw is not None else None,
            'operating_margin': operating_margin_raw * 100 if operating_margin_raw is not None else None
        }
    
    def _get_peg_ratio(self, symbol):
        """Get PEG ratio"""
        url = f"{self.base_url}/ratios-ttm/{symbol}?apikey={self.api_key}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return {}
            
        data = response.json()
        if not data:
            return {}
            
        ratios = data[0]
        return {
            'peg_ratio': self._clean_numeric(ratios.get('pegRatioTTM'))
        }
    
    def _get_eps_growth(self, symbol):
        """Calculate EPS growth from income statements"""
        url = f"{self.base_url}/income-statement/{symbol}?limit=3&apikey={self.api_key}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return {'eps_growth': None}
            
        data = response.json()
        if len(data) < 2:
            return {'eps_growth': None}
        
        # Calculate EPS growth year-over-year
        try:
            current_eps = self._clean_numeric(data[0].get('eps'))
            previous_eps = self._clean_numeric(data[1].get('eps'))
            
            if current_eps is not None and previous_eps is not None and previous_eps != 0:
                eps_growth = ((current_eps - previous_eps) / abs(previous_eps)) * 100
                return {'eps_growth': eps_growth}
        except:
            pass
            
        return {'eps_growth': None}
    
    def _get_fcf_yield(self, symbol):
        """Calculate Free Cash Flow Yield (FCF / Market Cap)"""
        try:
            # Get cash flow statement
            cf_url = f"{self.base_url}/cash-flow-statement/{symbol}?limit=1&apikey={self.api_key}"
            cf_response = requests.get(cf_url)
            
            # Get company profile for market cap
            profile_url = f"{self.base_url}/profile/{symbol}?apikey={self.api_key}"
            profile_response = requests.get(profile_url)
            
            if cf_response.status_code != 200 or profile_response.status_code != 200:
                return {'fcf_yield': None}
            
            cf_data = cf_response.json()
            profile_data = profile_response.json()
            
            if not cf_data or not profile_data:
                return {'fcf_yield': None}
            
            # Calculate FCF Yield
            free_cash_flow = self._clean_numeric(cf_data[0].get('freeCashFlow'))
            market_cap = self._clean_numeric(profile_data[0].get('mktCap'))
            
            if free_cash_flow and market_cap and market_cap > 0:
                fcf_yield = (free_cash_flow / market_cap) * 100
                return {'fcf_yield': fcf_yield}
            
        except Exception as e:
            print(f"Error calculating FCF yield for {symbol}: {e}")
        
        return {'fcf_yield': None}
    
    def _get_company_profile(self, symbol):
        """Get company profile for context"""
        url = f"{self.base_url}/profile/{symbol}?apikey={self.api_key}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return {}
            
        data = response.json()
        if not data:
            return {}
            
        profile = data[0]
        return {
            'company_name': profile.get('companyName', symbol),
            'sector': profile.get('sector', 'Unknown'),
            'industry': profile.get('industry', 'Unknown'),
            'market_cap': self._clean_numeric(profile.get('mktCap')),
            'price': self._clean_numeric(profile.get('price'))
        }
    
    def _clean_numeric(self, value):
        """Clean and validate numeric values"""
        if value is None:
            return None
        
        try:
            value = float(value)
            if np.isnan(value) or np.isinf(value):
                return None
            return value
        except (ValueError, TypeError):
            return None
    
    def _score_pe_ratio(self, pe_ratio):
        """Score PE ratio (25% weight) - Lower is better, more lenient for quality"""
        if pe_ratio is None or pe_ratio <= 0 or pe_ratio > 300:  # Filter extreme values
            return 0
        
        if pe_ratio <= self.benchmarks['excellent_pe']:
            return 100
        elif pe_ratio >= self.benchmarks['poor_pe']:
            return 0
        else:
            # Linear interpolation
            score = 100 - ((pe_ratio - self.benchmarks['excellent_pe']) / 
                          (self.benchmarks['poor_pe'] - self.benchmarks['excellent_pe'])) * 100
            return max(0, min(100, score))
    
    def _score_peg_ratio(self, peg_ratio):
        """Score PEG ratio (15% weight) - More lenient for quality growth"""
        if peg_ratio is None:
            return 50  # Neutral score for missing data
        
        # Handle negative PEG ratios
        if peg_ratio < 0:
            return 20  # Low score for negative growth expectations
        
        # Filter extreme positive values
        if peg_ratio > 50:
            return 0
        
        if peg_ratio <= self.benchmarks['excellent_peg']:
            return 100
        elif peg_ratio >= self.benchmarks['poor_peg']:
            return 0
        else:
            # Linear interpolation
            score = 100 - ((peg_ratio - self.benchmarks['excellent_peg']) / 
                          (self.benchmarks['poor_peg'] - self.benchmarks['excellent_peg'])) * 100
            return max(0, min(100, score))
    
    def _score_fcf_yield(self, fcf_yield):
        """Score Free Cash Flow Yield (20% weight) - Higher is better"""
        if fcf_yield is None:
            return 50  # Neutral score for missing data
        
        # Handle negative FCF (cash burn)
        if fcf_yield < 0:
            return 10  # Low score for cash burning companies
        
        if fcf_yield >= self.benchmarks['excellent_fcf_yield']:
            return 100
        elif fcf_yield <= self.benchmarks['poor_fcf_yield']:
            return 0
        else:
            # Linear interpolation
            score = ((fcf_yield - self.benchmarks['poor_fcf_yield']) / 
                    (self.benchmarks['excellent_fcf_yield'] - self.benchmarks['poor_fcf_yield'])) * 100
            return max(0, min(100, score))
    
    def _score_roe_quality(self, roe):
        """Score ROE with quality emphasis (15% weight) - Higher is better"""
        if roe is None:
            return 50  # Neutral score for missing data
        
        # Penalize negative ROE heavily
        if roe < 0:
            return 5
        
        if roe >= self.benchmarks['excellent_roe']:
            return 100
        elif roe <= self.benchmarks['poor_roe']:
            return 0
        else:
            # Linear interpolation
            score = ((roe - self.benchmarks['poor_roe']) / 
                    (self.benchmarks['excellent_roe'] - self.benchmarks['poor_roe'])) * 100
            return max(0, min(100, score))
    
    def _score_debt_equity(self, debt_equity):
        """Score Debt/Equity ratio (10% weight) - More lenient thresholds"""
        if debt_equity is None:
            return 50  # Neutral score for missing data
        
        # Handle negative D/E (net cash position) as excellent
        if debt_equity < 0:
            return 100
        
        if debt_equity <= self.benchmarks['excellent_debt']:
            return 100
        elif debt_equity >= self.benchmarks['poor_debt']:
            return 0
        else:
            # Linear interpolation
            score = 100 - ((debt_equity - self.benchmarks['excellent_debt']) / 
                          (self.benchmarks['poor_debt'] - self.benchmarks['excellent_debt'])) * 100
            return max(0, min(100, score))
    
    def _score_eps_growth(self, eps_growth):
        """Score EPS growth (15% weight) - Capped for anomalies"""
        if eps_growth is None:
            return 50  # Neutral score for missing data
        
        # Cap extreme values to prevent anomalies
        eps_growth = max(-100, min(100, eps_growth))
        
        if eps_growth >= self.benchmarks['excellent_eps_growth']:
            return 100
        elif eps_growth <= self.benchmarks['poor_eps_growth']:
            return 0
        else:
            # Linear interpolation
            score = ((eps_growth - self.benchmarks['poor_eps_growth']) / 
                    (self.benchmarks['excellent_eps_growth'] - self.benchmarks['poor_eps_growth'])) * 100
            return max(0, min(100, score))
    
    def calculate_value_score(self, stock_data):
        """
        Calculate the balanced value/quality score from 1-100.
        
        Formula: 25% PE + 15% PEG + 20% FCF Yield + 15% ROE + 10% D/E + 15% EPS Growth
        """
        # Calculate individual metric scores
        pe_score = self._score_pe_ratio(stock_data.get('pe_ratio'))
        peg_score = self._score_peg_ratio(stock_data.get('peg_ratio'))
        fcf_score = self._score_fcf_yield(stock_data.get('fcf_yield'))
        roe_score = self._score_roe_quality(stock_data.get('roe'))
        debt_score = self._score_debt_equity(stock_data.get('debt_equity'))
        eps_score = self._score_eps_growth(stock_data.get('eps_growth'))
        
        # Calculate weighted composite score
        composite_score = (
            pe_score * self.weights['pe_ratio'] +
            peg_score * self.weights['peg_ratio'] +
            fcf_score * self.weights['fcf_yield'] +
            roe_score * self.weights['roe_quality'] +
            debt_score * self.weights['debt_equity'] +
            eps_score * self.weights['eps_growth']
        )
        
        # Ensure score is between 1 and 100
        final_score = max(1, min(100, composite_score))
        
        return {
            'composite_score': final_score,
            'pe_score': pe_score,
            'peg_score': peg_score,
            'fcf_score': fcf_score,
            'roe_score': roe_score,
            'debt_score': debt_score,
            'eps_score': eps_score
        }
    
    def analyze_stocks(self, symbols):
        """Analyze a list of stock symbols and return balanced scores"""
        results = []
        
        for i, symbol in enumerate(symbols):
            print(f"Progress: {i+1}/{len(symbols)} - Analyzing {symbol}")
            
            try:
                # Fetch stock data
                stock_data = self.fetch_stock_data(symbol)
                
                if stock_data is None:
                    print(f"  Warning: Could not fetch data for {symbol}")
                    continue
                
                # Calculate value score
                scores = self.calculate_value_score(stock_data)
                
                # Compile results
                result = {
                    'Symbol': symbol,
                    'Company': stock_data.get('company_name', symbol),
                    'Value_Score': round(scores['composite_score'], 1),
                    'PE_Ratio': stock_data.get('pe_ratio'),
                    'PEG_Ratio': stock_data.get('peg_ratio'),
                    'FCF_Yield': stock_data.get('fcf_yield'),
                    'ROE': stock_data.get('roe'),
                    'Debt_Equity': stock_data.get('debt_equity'),
                    'EPS_Growth': round(stock_data.get('eps_growth'), 1) if stock_data.get('eps_growth') else None,
                    'EPS_Growth_Raw': stock_data.get('eps_growth'),
                    'Sector': stock_data.get('sector'),
                    'Market_Cap': stock_data.get('market_cap'),
                    'Price': stock_data.get('price'),
                    'PE_Score': round(scores['pe_score'], 1),
                    'PEG_Score': round(scores['peg_score'], 1),
                    'FCF_Score': round(scores['fcf_score'], 1),
                    'ROE_Score': round(scores['roe_score'], 1),
                    'Debt_Score': round(scores['debt_score'], 1),
                    'EPS_Score': round(scores['eps_score'], 1)
                }
                
                results.append(result)
                
                # Rate limiting
                time.sleep(0.25)
                
            except Exception as e:
                print(f"Error analyzing {symbol}: {e}")
                continue
        
        if results:
            df = pd.DataFrame(results)
            return df.sort_values('Value_Score', ascending=False)
        else:
            return None
    
    def print_analysis_summary(self, results_df):
        """Print a formatted summary of the balanced analysis"""
        if results_df is None or len(results_df) == 0:
            print("No results to display")
            return
        
        print("\n" + "="*130)
        print("BALANCED VALUE + QUALITY STOCK ANALYSIS")
        print("="*130)
        print(f"Scoring: 25% PE + 15% PEG + 20% FCF Yield + 15% ROE + 10% D/E + 15% EPS Growth")
        print(f"Scale: 1-100 (100 = Amazing Investment, 1 = Poor Investment)")
        print(f"Benchmarks: PE(20-60), PEG(1.5-4.0), FCF(2%-8%), ROE(10%-20%), D/E(0.5-3.0)")
        print("="*130)
        
        # Summary table
        print(f"\n{'Symbol':<8} {'Score':<6} {'PE':<6} {'PEG':<6} {'FCF%':<6} {'ROE%':<6} {'D/E':<6} {'EPS%':<6} {'Sector':<20} {'Company':<25}")
        print("-" * 130)
        
        for _, row in results_df.iterrows():
            pe = f"{row['PE_Ratio']:.1f}" if row['PE_Ratio'] else "N/A"
            peg = f"{row['PEG_Ratio']:.1f}" if row['PEG_Ratio'] else "N/A"
            fcf = f"{row['FCF_Yield']:.1f}" if row['FCF_Yield'] else "N/A"
            roe = f"{row['ROE']:.1f}" if row['ROE'] else "N/A"
            debt = f"{row['Debt_Equity']:.1f}" if row['Debt_Equity'] else "N/A"
            # Mark extreme EPS values
            eps_raw = row.get('EPS_Growth_Raw')
            eps_display = f"{row['EPS_Growth']:.1f}" if row['EPS_Growth'] else "N/A"
            if eps_raw and abs(eps_raw) > 100:
                eps_display += "*"
            
            print(f"{row['Symbol']:<8} "
                  f"{row['Value_Score']:<6.1f} "
                  f"{pe:<6} "
                  f"{peg:<6} "
                  f"{fcf:<6} "
                  f"{roe:<6} "
                  f"{debt:<6} "
                  f"{eps_display:<6} "
                  f"{row['Sector']:<20} "
                  f"{row['Company'][:25]:<25}")
        
        # Top picks
        print(f"\nTOP 5 INVESTMENT OPPORTUNITIES:")
        print("-" * 50)
        for i, (_, row) in enumerate(results_df.head(5).iterrows()):
            print(f"{i+1}. {row['Symbol']} - Score: {row['Value_Score']:.1f} ({row['Sector']})")
        
        # Investment categories
        excellent = results_df[results_df['Value_Score'] >= 75]
        good = results_df[(results_df['Value_Score'] >= 60) & (results_df['Value_Score'] < 75)]
        average = results_df[(results_df['Value_Score'] >= 45) & (results_df['Value_Score'] < 60)]
        poor = results_df[results_df['Value_Score'] < 45]
        
        print(f"\nINVESTMENT QUALITY DISTRIBUTION:")
        print(f"Excellent (75-100): {len(excellent)} stocks")
        print(f"Good (60-74): {len(good)} stocks")
        print(f"Average (45-59): {len(average)} stocks")
        print(f"Poor (1-44): {len(poor)} stocks")
        
        # Quality vs Value breakdown
        if len(results_df) > 0:
            print(f"\nQUALITY METRICS SUMMARY:")
            avg_roe = results_df['ROE'].mean()
            avg_fcf = results_df['FCF_Yield'].mean()
            print(f"Average ROE: {avg_roe:.1f}%")
            print(f"Average FCF Yield: {avg_fcf:.1f}%")

def main():
    """Example usage with balanced scoring"""
    
    # Test stocks - focus on quality compounders vs pure value
    test_symbols = [
        # Quality compounders (should score higher now)
        "AAPL", "MSFT", "GOOGL", "MA", "V", "HD", "WMT", "PG", "KO", "JNJ",
        # Value stocks
        "BRK-B", "JPM", "BAC", "WFC", 
        # Growth stocks
        "AMZN", "META", "NVDA", "TSLA",
        # Mixed
        "UNH", "DIS", "INTC",
        # Speculative
        "GME", "AMC", "ROKU", "PLTR"
    ]
    
    # Initialize balanced calculator
    calculator = ValueScoreCalculator()
    
    # Analyze stocks
    print("Starting BALANCED stock analysis (Value + Quality)...")
    print(f"Analyzing {len(test_symbols)} stocks...")
    
    results = calculator.analyze_stocks(test_symbols)
    
    if results is not None:
        # Print analysis
        calculator.print_analysis_summary(results)
        
        # Save to CSV
        results.to_csv('balanced_stock_scores.csv', index=False)
        print(f"\nResults saved to 'balanced_stock_scores.csv'")
        
        # Print detailed breakdown for top stock
        print(f"\nDETAILED BREAKDOWN - TOP STOCK ({results.iloc[0]['Symbol']}):")
        print("-" * 70)
        top_stock = results.iloc[0]
        print(f"PE Score: {top_stock['PE_Score']:.1f}/100 (Weight: 25%) - PE: {top_stock['PE_Ratio']:.1f}")
        print(f"PEG Score: {top_stock['PEG_Score']:.1f}/100 (Weight: 15%) - PEG: {top_stock['PEG_Ratio']:.1f}")
        print(f"FCF Score: {top_stock['FCF_Score']:.1f}/100 (Weight: 20%) - FCF Yield: {top_stock['FCF_Yield']:.1f}%")
        print(f"ROE Score: {top_stock['ROE_Score']:.1f}/100 (Weight: 15%) - ROE: {top_stock['ROE']:.1f}%")
        print(f"Debt Score: {top_stock['Debt_Score']:.1f}/100 (Weight: 10%) - D/E: {top_stock['Debt_Equity']:.1f}")
        print(f"EPS Score: {top_stock['EPS_Score']:.1f}/100 (Weight: 15%) - EPS Growth: {top_stock['EPS_Growth']:.1f}%")
        print(f"Final Composite Score: {top_stock['Value_Score']:.1f}/100")
    else:
        print("No valid results obtained. Check API key and connectivity.")

# ====================================================
# Flask Web API Endpoints
# ====================================================

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/value/<symbol>')
def get_value_score(symbol):
    """Get value score for a single stock symbol"""
    try:
        print(f"Getting value score for {symbol}...")
        calculator = ValueScoreCalculator()
        stock_data = calculator.fetch_stock_data(symbol)
        
        if stock_data:
            scores = calculator.calculate_value_score(stock_data)
            return jsonify({
                'symbol': symbol,
                'valueScore': float(scores['composite_score']),
                'peScore': float(scores['pe_score']),
                'pegScore': float(scores['peg_score']),
                'fcfScore': float(scores['fcf_score']),
                'roeScore': float(scores['roe_score']),
                'debtScore': float(scores['debt_score']),
                'epsScore': float(scores['eps_score']),
                'status': 'success'
            })
        else:
            return jsonify({'error': 'No data found for symbol'}), 404
    except Exception as e:
        print(f"Error getting value score for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/value/bulk', methods=['POST'])
def get_bulk_value_scores():
    """Get value scores for multiple stock symbols"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        if not symbols:
            return jsonify({'error': 'No symbols provided'}), 400
        
        print(f"Getting value scores for {len(symbols)} symbols...")
        calculator = ValueScoreCalculator()
        results = calculator.analyze_stocks(symbols)
        
        if results is not None and not results.empty:
            scores = []
            for _, row in results.iterrows():
                scores.append({
                    'symbol': row['Symbol'],
                    'valueScore': float(row['Value_Score']),
                    'peScore': float(row['PE_Score']),
                    'pegScore': float(row['PEG_Score']),
                    'fcfScore': float(row['FCF_Score']),
                    'roeScore': float(row['ROE_Score']),
                    'debtScore': float(row['Debt_Score']),
                    'epsScore': float(row['EPS_Score'])
                })
            return jsonify({'scores': scores, 'status': 'success'})
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"Error getting bulk value scores: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/value/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'value_model'})

if __name__ == "__main__":
    # Check if running as web server or training script
    if len(sys.argv) > 1 and sys.argv[1] == '--server':
        print("Starting Value Model API server on port 5003...")
        app.run(host='0.0.0.0', port=5003, debug=True)
    else:
        main()