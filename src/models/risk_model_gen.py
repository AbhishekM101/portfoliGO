import pandas as pd
import numpy as np
import time
import requests
import joblib
import warnings
import os
import sys
from pathlib import Path
from flask import Flask, jsonify, request
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import xgboost as xgb
from scipy import stats

# Import your API key
try:
    from API_KEY import API_KEY
except ImportError:
    API_KEY = None
    print("Warning: API_KEY not found. Please create API_KEY.py with your API key.")

class risk_model_gen:
    def __init__(self, model_dir="model_data"):
        """
        Initialize the Stock Risk Scorer
        
        Args:
            model_dir: Directory to store model files and data
        """
        self.base_url = "https://financialmodelingprep.com/api/v3"
        self.api_key = API_KEY
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)
        
        # File paths for persistence
        self.model_path = self.model_dir / "risk_model.pkl"
        self.training_data_path = self.model_dir / "training_data.pkl"
        self.model_metadata_path = self.model_dir / "model_metadata.pkl"
        
        # Model components
        self.model = None
        self.feature_columns = None
        self.model_metadata = {}
        
        # Key features for risk assessment
        self.feature_config = {
            'price_metrics': ['price_volatility_3m', 'trading_volume_volatility', 'price_momentum'],
            'financial_health': ['altman_z_score', 'current_ratio', 'debt_to_equity', 'interest_coverage'],
            'profitability': ['roe', 'roa', 'profit_margin', 'earnings_growth'],
            'market_metrics': ['beta', 'market_cap_log']
        }
    
    def _api_call(self, endpoint, retries=3):
        """Make API call with error handling"""
        url = f"{self.base_url}/{endpoint}?apikey={self.api_key}"
        
        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    time.sleep(0.5 * (2 ** attempt))
                    continue
            except Exception as e:
                if attempt == retries - 1:
                    print(f"API call failed for {endpoint}: {e}")
                time.sleep(0.2)
        return None
    
    def _calculate_price_metrics(self, price_data):
        """Calculate price-based risk metrics"""
        if not price_data or 'historical' not in price_data:
            return {}
        
        prices = price_data['historical'][:252]  # 1 year
        if len(prices) < 60:
            return {}
        
        closes = [p['close'] for p in prices if p['close']]
        volumes = [p['volume'] for p in prices if p['volume']]
        
        if len(closes) < 60:
            return {}
        
        returns = np.diff(closes) / np.array(closes[:-1])
        returns = returns[np.isfinite(returns)]
        
        metrics = {}
        
        # Price volatility (annualized)
        if len(returns) >= 60:
            recent_returns = returns[:60]
            metrics['price_volatility_3m'] = np.std(recent_returns) * np.sqrt(252) * 100
        
        # Volume volatility
        if len(volumes) >= 60:
            vol_changes = np.diff(volumes[:60]) / np.array(volumes[:59])
            vol_changes = vol_changes[np.isfinite(vol_changes)]
            if len(vol_changes) > 0:
                metrics['trading_volume_volatility'] = np.std(vol_changes) * 100
        
        # Price momentum (3m vs 6m performance)
        if len(closes) >= 126:
            perf_3m = (closes[0] - closes[60]) / closes[60] * 100
            perf_6m = (closes[0] - closes[126]) / closes[126] * 100
            metrics['price_momentum'] = abs(perf_3m - perf_6m)  # Momentum inconsistency = risk
        
        return metrics
    
    def _calculate_financial_metrics(self, income_stmt, balance_sheet, cash_flow):
        """Calculate financial health metrics"""
        if not all([income_stmt, balance_sheet, cash_flow]):
            return {}
        
        metrics = {}
        
        try:
            # Get latest financial data
            latest_income = income_stmt[0] if income_stmt else {}
            latest_balance = balance_sheet[0] if balance_sheet else {}
            latest_cash = cash_flow[0] if cash_flow else {}
            
            # Basic financial ratios
            total_assets = latest_balance.get('totalAssets', 0)
            total_equity = latest_balance.get('totalStockholdersEquity', 1)
            total_debt = latest_balance.get('totalDebt', 0)
            current_assets = latest_balance.get('totalCurrentAssets', 0)
            current_liabilities = latest_balance.get('totalCurrentLiabilities', 1)
            
            net_income = latest_income.get('netIncome', 0)
            revenue = latest_income.get('revenue', 1)
            operating_income = latest_income.get('operatingIncome', 0)
            interest_expense = abs(latest_income.get('interestExpense', 0))
            
            # ROE
            if total_equity > 0:
                metrics['roe'] = (net_income / total_equity) * 100
            
            # ROA
            if total_assets > 0:
                metrics['roa'] = (net_income / total_assets) * 100
            
            # Profit Margin
            if revenue > 0:
                metrics['profit_margin'] = (net_income / revenue) * 100
            
            # Current Ratio
            if current_liabilities > 0:
                metrics['current_ratio'] = current_assets / current_liabilities
            
            # Debt to Equity
            if total_equity > 0:
                metrics['debt_to_equity'] = total_debt / total_equity
            
            # Interest Coverage
            if interest_expense > 0:
                metrics['interest_coverage'] = operating_income / interest_expense
            else:
                metrics['interest_coverage'] = 20  # No debt = good coverage
            
            # Altman Z-Score (simplified)
            if total_assets > 0:
                working_capital = current_assets - current_liabilities
                retained_earnings = latest_balance.get('retainedEarnings', 0)
                
                z1 = working_capital / total_assets
                z2 = retained_earnings / total_assets
                z3 = operating_income / total_assets
                z4 = total_equity / total_debt if total_debt > 0 else 5
                z5 = revenue / total_assets
                
                metrics['altman_z_score'] = 1.2*z1 + 1.4*z2 + 3.3*z3 + 0.6*z4 + 1.0*z5
            
            # Earnings growth (if multiple periods available)
            if len(income_stmt) >= 2:
                current_earnings = income_stmt[0].get('netIncome', 0)
                previous_earnings = income_stmt[1].get('netIncome', 1)
                if previous_earnings != 0:
                    growth = ((current_earnings - previous_earnings) / abs(previous_earnings)) * 100
                    metrics['earnings_growth'] = abs(growth)  # Volatility in growth = risk
            
        except Exception as e:
            print(f"Error calculating financial metrics: {e}")
        
        return metrics
    
    def _get_market_metrics(self, symbol):
        """Get market-based metrics"""
        metrics = {}
        
        try:
            # Company profile for beta and market cap
            profile = self._api_call(f"profile/{symbol}")
            if profile and len(profile) > 0:
                company = profile[0]
                
                # Beta
                beta = company.get('beta')
                if beta is not None:
                    metrics['beta'] = abs(beta)  # High beta = high risk
                
                # Market cap (log scale)
                market_cap = company.get('mktCap', 0)
                if market_cap > 0:
                    metrics['market_cap_log'] = np.log10(market_cap)
        
        except Exception as e:
            print(f"Error getting market metrics for {symbol}: {e}")
        
        return metrics
    
    def get_stock_features(self, symbol):
        """Get all features for a single stock"""
        print(f"Collecting data for {symbol}...")
        features = {'symbol': symbol}
        
        try:
            # Price metrics
            price_data = self._api_call(f"historical-price-full/{symbol}")
            features.update(self._calculate_price_metrics(price_data))
            
            # Financial statements
            income_stmt = self._api_call(f"income-statement/{symbol}?limit=3")
            balance_sheet = self._api_call(f"balance-sheet-statement/{symbol}?limit=3")
            cash_flow = self._api_call(f"cash-flow-statement/{symbol}?limit=3")
            
            features.update(self._calculate_financial_metrics(income_stmt, balance_sheet, cash_flow))
            
            # Market metrics
            features.update(self._get_market_metrics(symbol))
            
            # Rate limiting
            time.sleep(0.1)
            
        except Exception as e:
            print(f"Error collecting data for {symbol}: {e}")
        
        return features if len(features) > 5 else None  # Ensure we have enough features
    
    def _create_risk_labels(self, df):
        """Create synthetic risk labels (higher score = lower risk)"""
        risk_components = []
        
        # Volatility penalty (higher volatility = higher risk = lower score)
        if 'price_volatility_3m' in df.columns:
            vol_penalty = np.clip(df['price_volatility_3m'].fillna(30) / 40 * 35, 0, 40)  # Increased impact
            risk_components.append(vol_penalty)
        
        # Financial health bonus (higher Z-score = lower risk = higher score)
        if 'altman_z_score' in df.columns:
            z_scores = df['altman_z_score'].fillna(1.8)
            health_bonus = np.where(z_scores > 2.99, 30,    # Increased from 25
                                  np.where(z_scores > 1.8, 15, -5))  # Penalty for low Z-score
            risk_components.append(-health_bonus)  # Negative because we subtract penalties
        
        # Profitability bonus (more aggressive scaling)
        if 'roe' in df.columns:
            roe_values = df['roe'].fillna(0)
            roe_bonus = np.where(roe_values > 15, 20,      # High ROE = big bonus
                               np.where(roe_values > 5, 10,  # Decent ROE = medium bonus
                                      np.where(roe_values < -5, -10, 0)))  # Negative ROE = penalty
            risk_components.append(-roe_bonus)
        
        # Beta penalty (more aggressive)
        if 'beta' in df.columns:
            beta_values = df['beta'].fillna(1)
            beta_penalty = np.where(beta_values > 1.5, 25,    # High beta = big penalty
                                  np.where(beta_values > 1.2, 15,  # Medium beta = medium penalty
                                         np.where(beta_values < 0.8, -10, 5)))  # Low beta = bonus
            risk_components.append(beta_penalty)
        
        # Debt penalty (more nuanced)
        if 'debt_to_equity' in df.columns:
            debt_values = df['debt_to_equity'].fillna(0.5)
            debt_penalty = np.where(debt_values > 2.0, 20,     # High debt = penalty
                                  np.where(debt_values > 1.0, 10,  # Medium debt = small penalty
                                         np.where(debt_values < 0.3, -5, 0)))  # Low debt = bonus
            risk_components.append(debt_penalty)
        
        # Market cap consideration (small caps are riskier)
        if 'market_cap_log' in df.columns:
            mcap_values = df['market_cap_log'].fillna(9)  # Default to ~$1B
            mcap_penalty = np.where(mcap_values < 8, 15,      # Small cap penalty
                                  np.where(mcap_values < 9, 5,   # Mid cap small penalty
                                         np.where(mcap_values > 11, -10, 0)))  # Mega cap bonus
            risk_components.append(mcap_penalty)
        
        # Calculate final risk score with wider range
        if risk_components:
            total_penalty = np.sum(risk_components, axis=0)
            # Start from 90 and subtract penalties, allowing for wider spread
            risk_score = np.clip(90 - total_penalty, 10, 95)
            
            # Add some additional spread by amplifying differences
            risk_score_mean = np.mean(risk_score)
            spread_factor = 1.01  # Amplify differences by 30%
            risk_score = risk_score_mean + (risk_score - risk_score_mean) * spread_factor
            risk_score = np.clip(risk_score, 5, 95)  # Ensure we stay in reasonable bounds
        else:
            risk_score = np.random.normal(50, 20, len(df))
            risk_score = np.clip(risk_score, 5, 95)
        
        return risk_score
    
    def collect_training_data(self, symbols, force_refresh=False):
        """Collect training data with caching"""
        if not force_refresh and self.training_data_path.exists():
            print("Loading cached training data...")
            return joblib.load(self.training_data_path)
        
        print(f"Collecting training data for {len(symbols)} symbols...")
        
        data_list = []
        for i, symbol in enumerate(symbols):
            features = self.get_stock_features(symbol)
            if features:
                data_list.append(features)
            
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(symbols)} symbols...")
        
        if not data_list:
            raise ValueError("No data collected successfully")
        
        # Create DataFrame
        df = pd.DataFrame(data_list)
        
        # Clean data
        numeric_cols = [col for col in df.columns if col != 'symbol']
        for col in numeric_cols:
            if col in df.columns and df[col].dtype in ['float64', 'int64']:
                # Remove extreme outliers
                Q1, Q3 = df[col].quantile([0.25, 0.75])
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df[col] = df[col].clip(lower_bound, upper_bound)
                
                # Fill missing values
                df[col] = df[col].fillna(df[col].median())
        
        # Create risk labels
        df['risk_score'] = self._create_risk_labels(df)
        
        # Cache the data
        joblib.dump(df, self.training_data_path)
        print(f"Training data saved to {self.training_data_path}")
        
        return df
    
    def train_model(self, training_data=None, symbols=None):
        """Train the risk scoring model"""
        if training_data is None:
            if symbols is None:
                # Default training symbols
                symbols = [
                    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX",
                    "JPM", "BAC", "JNJ", "PFE", "PG", "KO", "WMT", "HD", "XOM", "CVX",
                    "BA", "CAT", "DIS", "V", "MA", "PYPL", "CRM", "ADBE", "UBER", "ROKU"
                ]
            training_data = self.collect_training_data(symbols)
        
        print("Training model...")
        
        # Prepare features
        feature_columns = [col for col in training_data.columns 
                          if col not in ['symbol', 'risk_score']]
        X = training_data[feature_columns].copy()
        y = training_data['risk_score'].copy()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Create preprocessing pipeline
        preprocessor = ColumnTransformer(
            transformers=[('scaler', RobustScaler(), feature_columns)]
        )
        
        # Train multiple models and select the best
        models = {
            'random_forest': RandomForestRegressor(
                n_estimators=100, max_depth=8, min_samples_split=5,
                random_state=42, n_jobs=-1
            ),
            'xgboost': xgb.XGBRegressor(
                n_estimators=100, learning_rate=0.1, max_depth=6,
                random_state=42, eval_metric='rmse'
            )
        }
        
        best_score = -np.inf
        best_model = None
        
        for name, model in models.items():
            # Create pipeline
            pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('regressor', model)
            ])
            
            # Train and evaluate
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            r2 = r2_score(y_test, y_pred)
            
            print(f"{name} - R²: {r2:.3f}")
            
            if r2 > best_score:
                best_score = r2
                best_model = pipeline
        
        # Store model and metadata
        self.model = best_model
        self.feature_columns = feature_columns
        self.model_metadata = {
            'training_samples': len(training_data),
            'features_used': feature_columns,
            'r2_score': best_score,
            'training_date': pd.Timestamp.now().isoformat()
        }
        
        # Save everything
        self.save_model()
        
        print(f"Model trained successfully! R²: {best_score:.3f}")
        return best_model
    
    def predict_risk_scores(self, symbols):
        """Predict risk scores for given symbols"""
        if self.model is None:
            raise ValueError("Model not trained. Please train or load a model first.")
        
        # Collect prediction data
        prediction_data = []
        for symbol in symbols:
            features = self.get_stock_features(symbol)
            if features:
                prediction_data.append(features)
        
        if not prediction_data:
            return pd.DataFrame()
        
        # Create DataFrame and prepare features
        pred_df = pd.DataFrame(prediction_data)
        
        # Ensure all required features are present
        for feature in self.feature_columns:
            if feature not in pred_df.columns:
                pred_df[feature] = pred_df[pred_df.columns].median().median()
        
        # Fill missing values
        for feature in self.feature_columns:
            if pred_df[feature].isna().any():
                pred_df[feature] = pred_df[feature].fillna(pred_df[feature].median())
        
        # Predict
        X_pred = pred_df[self.feature_columns]
        predictions = self.model.predict(X_pred)
        predictions = np.clip(predictions, 0, 100)
        
        # Create results
        results = pd.DataFrame({
            'symbol': pred_df['symbol'],
            'risk_score': predictions,
            'risk_category': self._categorize_risk(predictions)
        })
        
        return results.sort_values('risk_score', ascending=False)
    
    def _categorize_risk(self, scores):
        """Categorize risk scores"""
        return ['Low Risk' if score >= 70 else 'Medium Risk' if score >= 40 else 'High Risk' 
                for score in scores]
    
    def save_model(self):
        """Save model and all associated data"""
        model_data = {
            'model': self.model,
            'feature_columns': self.feature_columns,
            'model_metadata': self.model_metadata
        }
        
        joblib.dump(model_data, self.model_path)
        joblib.dump(self.model_metadata, self.model_metadata_path)
        print(f"Model saved to {self.model_path}")
    
    def load_model(self):
        """Load saved model"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"No saved model found at {self.model_path}")
        
        model_data = joblib.load(self.model_path)
        self.model = model_data['model']
        self.feature_columns = model_data['feature_columns']
        self.model_metadata = model_data.get('model_metadata', {})
        
        print(f"Model loaded successfully!")
        print(f"Training date: {self.model_metadata.get('training_date', 'Unknown')}")
        print(f"Model R²: {self.model_metadata.get('r2_score', 'Unknown')}")
    
    def get_model_info(self):
        """Get information about the current model"""
        if self.model is None:
            return "No model loaded"
        
        info = f"""
        Model Information:
        - Training samples: {self.model_metadata.get('training_samples', 'Unknown')}
        - Features used: {len(self.feature_columns)} features
        - R² Score: {self.model_metadata.get('r2_score', 'Unknown'):.3f}
        - Training date: {self.model_metadata.get('training_date', 'Unknown')}
        - Features: {', '.join(self.feature_columns)}
        """
        return info

# Convenience functions
def quick_risk_analysis(symbols, model_dir="../model_data"):
    """Quick risk analysis - trains model if needed, otherwise uses cached"""
    scorer = risk_model_gen(model_dir)
    
    try:
        scorer.load_model()
    except FileNotFoundError:
        print("No saved model found. Training new model...")
        scorer.train_model()
    
    return scorer.predict_risk_scores(symbols)

def train_new_model(symbols=None, model_dir="../model_data", force_refresh=False):
    """Train a new model from scratch"""
    scorer = risk_model_gen(model_dir)
    scorer.train_model(symbols=symbols)
    return scorer

# ====================================================
# Flask Web API Endpoints
# ====================================================

app = Flask(__name__)

@app.route('/api/risk/<symbol>')
def get_risk_score(symbol):
    """Get risk score for a single stock symbol"""
    try:
        print(f"Getting risk score for {symbol}...")
        scorer = risk_model_gen(model_dir="../model_data")
        
        try:
            scorer.load_model()
        except FileNotFoundError:
            print("No saved model found. Training new model...")
            scorer.train_model()
        
        results = scorer.predict_risk_scores([symbol])
        if not results.empty:
            row = results.iloc[0]
            return jsonify({
                'symbol': symbol,
                'riskScore': float(row['risk_score']),
                'riskCategory': row['risk_category'],
                'status': 'success'
            })
        else:
            return jsonify({'error': 'No data found for symbol'}), 404
    except Exception as e:
        print(f"Error getting risk score for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk/bulk', methods=['POST'])
def get_bulk_risk_scores():
    """Get risk scores for multiple stock symbols"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        if not symbols:
            return jsonify({'error': 'No symbols provided'}), 400
        
        print(f"Getting risk scores for {len(symbols)} symbols...")
        scorer = risk_model_gen(model_dir="../model_data")
        
        try:
            scorer.load_model()
        except FileNotFoundError:
            print("No saved model found. Training new model...")
            scorer.train_model()
        
        results = scorer.predict_risk_scores(symbols)
        
        if not results.empty:
            scores = []
            for _, row in results.iterrows():
                scores.append({
                    'symbol': row['symbol'],
                    'riskScore': float(row['risk_score']),
                    'riskCategory': row['risk_category']
                })
            return jsonify({'scores': scores, 'status': 'success'})
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"Error getting bulk risk scores: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'risk_model'})

# Example usage
if __name__ == "__main__":
    # Check if running as web server or training script
    if len(sys.argv) > 1 and sys.argv[1] == '--server':
        print("Starting Risk Model API server on port 5002...")
        app.run(host='0.0.0.0', port=5002, debug=True)
    else:
        # Original training code
        test_symbols = [
            "AAPL", "TSLA", "MSFT", "GOOGL", "NVDA", "AMC", "GME", "PLTR", "JNJ", "VST", "XEL",
            "KO", "ROKU", "COIN", "BABA"
        ]
        
        # Quick analysis (uses cached model if available)
        results = quick_risk_analysis(test_symbols)
        
        if not results.empty:
            print("\nRisk Analysis Results:")
            print("-" * 50)
            for _, row in results.iterrows():
                print(f"{row['symbol']:6} | {row['risk_score']:5.1f} | {row['risk_category']}")
        
        print(f"\nNote: Higher scores indicate LOWER risk!")
        print("Risk Categories:")
        print("- Low Risk (70-100): Safer investments")
        print("- Medium Risk (40-69): Moderate risk investments") 
        print("- High Risk (0-39): Higher risk investments")