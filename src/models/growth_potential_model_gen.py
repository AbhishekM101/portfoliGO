import pandas as pd
import numpy as np
import time
import requests
import joblib
import sys
from flask import Flask, jsonify, request
from sklearn.preprocessing import MinMaxScaler
from API_KEY import API_KEY

# ====================================================
# Define the Growth Metrics and Their Weights
# ====================================================
METRICS_WEIGHTS = {
    "Revenue vs Industry Revenue": 0.10,
    "PEG Ratio": 0.15,
    "2-Year ROI (%)": 0.25,
    "2-Year Revenue Growth (%)": 0.25,
    "Market Share Growth (pp)": 0.10,
    "R&D vs Revenue (%)": 0.10,
    "Margin Trend Score": 0.05
}

BASE_URL = "https://financialmodelingprep.com/api/v3"

# ====================================================
# Data Collection Functions for Growth Metrics
# ====================================================

def get_revenue(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("revenue")
    return None

def get_industry_revenue(symbol):
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    revenues = []
                    for company in industry_companies[:5]:
                        comp_symbol = company.get("symbol")
                        if comp_symbol:
                            rev = get_revenue(comp_symbol)
                            if rev is not None:
                                revenues.append(rev)
                    if revenues:
                        return sum(revenues) / len(revenues)
    return None

def get_revenue_vs_industry_revenue(symbol):
    revenue = get_revenue(symbol)
    industry_rev = get_industry_revenue(symbol)
    if revenue is not None and industry_rev is not None and industry_rev != 0:
        return revenue / industry_rev
    return None

def get_peg_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            print(data[0].get("pegRatioTTM"))
            return data[0].get("pegRatioTTM")
    return None

def get_two_year_roi(symbol):
    url = f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        historical_prices = data.get("historical", [])
        if len(historical_prices) >= 504:
            current_price = historical_prices[0].get("close")
            price_2_years_ago = historical_prices[503].get("close")
            if current_price is not None and price_2_years_ago is not None and price_2_years_ago != 0:
                return ((current_price - price_2_years_ago) / price_2_years_ago) * 100
    return None

def get_two_year_revenue_growth(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?limit=2&apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 2:
            rev_current = data[0].get("revenue")
            rev_previous = data[1].get("revenue")
            if rev_current is not None and rev_previous is not None and rev_previous != 0:
                return ((rev_current - rev_previous) / rev_previous) * 100
    return None

def get_market_share_for_year(symbol, year_index=0):
    # (Placeholder) Using revenue as a proxy for market share
    url = f"{BASE_URL}/income-statement/{symbol}?limit={year_index+1}&apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if len(data) > year_index:
            return data[year_index].get("revenue")
    return None

def get_market_share_growth(symbol):
    current_share = get_market_share_for_year(symbol, 0)
    past_share = get_market_share_for_year(symbol, 1)
    if current_share is not None and past_share is not None:
        return current_share - past_share
    return None

def get_rd_to_revenue_ratio(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            rd_exp = data[0].get("researchAndDevelopmentExpenses")
            revenue = data[0].get("revenue")
            if rd_exp is not None and revenue is not None and revenue != 0:
                return (rd_exp / revenue) * 100
    return None

def get_margin_trend_score(symbol):
    # (Placeholder) Return a fixed value for demonstration purposes.
    return 50.0

def get_all_growth_features(symbol):
    features = {
        "Revenue vs Industry Revenue": get_revenue_vs_industry_revenue(symbol),
        "PEG Ratio": get_peg_ratio(symbol),
        "2-Year ROI (%)": get_two_year_roi(symbol),
        "2-Year Revenue Growth (%)": get_two_year_revenue_growth(symbol),
        "Market Share Growth (pp)": get_market_share_growth(symbol),
        "R&D vs Revenue (%)": get_rd_to_revenue_ratio(symbol),
        "Margin Trend Score": get_margin_trend_score(symbol)
    }
    return features

# ====================================================
# Normalization Using Saved Scalers
# ====================================================

def normalize_with_saved_scalers(df, scaler_dict, features):
    """
    Normalize features using the pre-fitted scalers from the saved model.
    For PEG Ratio, lower values are better so we invert the values.
    """
    df_normalized = df.copy()
    for feature in features:
        if feature in df:
            values = df[feature].values.reshape(-1, 1)
            if feature == "PEG Ratio":
                epsilon = 1e-10
                inverted = 1 / (values + epsilon)
                df_normalized[f"{feature}_normalized"] = scaler_dict[feature].transform(inverted)
            else:
                df_normalized[f"{feature}_normalized"] = scaler_dict[feature].transform(values)
    return df_normalized

def create_growth_potential_score(df):
    """
    Combine normalized features into a single growth potential score.
    The score is computed as a weighted average and then scaled to 0–100.
    """
    df_with_score = df.copy()
    total_weight = sum(METRICS_WEIGHTS.values())
    baseline_score = 0
    for feature, weight in METRICS_WEIGHTS.items():
        baseline_score += df_with_score[f"{feature}_normalized"] * weight
    df_with_score["growth_potential_score"] = (baseline_score / total_weight) * 200
    df_with_score["growth_potential_score"] = df_with_score["growth_potential_score"].clip(upper=100)
    return df_with_score

# ====================================================
# New Function: Score Given a List of Tickers with Error Handling
# ====================================================

def run_scoring_for_tickers(ticker_list):
    collected_data = []
    for ticker in ticker_list:
        print(f"\nCollecting growth data for {ticker}...")
        try:
            features = get_all_growth_features(ticker)
            features["Symbol"] = ticker
            collected_data.append(features)
            time.sleep(5)  # Delay to help avoid API rate limits
        except Exception as e:
            print(f"Error collecting data for {ticker}: {e}")
            continue

    if not collected_data:
        print("No data was collected for the provided tickers.")
        return

    df = pd.DataFrame(collected_data)
    print("\nCollected Growth Data:")
    print(df.head())

    # Handle missing values for each required feature
    required_features = list(METRICS_WEIGHTS.keys())
    for feature in required_features:
        if feature in df.columns:
            if df[feature].dropna().empty:
                print(f"Warning: All values missing for {feature}. Filling with default value 1.")
                df[feature] = 1
            else:
                df[feature] = df[feature].fillna(df[feature].median())
        else:
            print(f"Warning: {feature} not found in collected data. Creating column with default value 1.")
            df[feature] = 1

    # Load the saved growth model and scalers from your original model file
    saved_model_data = joblib.load("../model_data/growth_potential_model.pkl")
    saved_scalers = saved_model_data["scalers"]
    saved_model = saved_model_data["model"]

    # Normalize the new data using the saved scalers
    df_normalized = normalize_with_saved_scalers(df, saved_scalers, required_features)
    # (Optional) Compute the baseline score for reference
    df_with_score = create_growth_potential_score(df_normalized)

    # Prepare predictors (raw and normalized features) for the model
    predictors = list(METRICS_WEIGHTS.keys()) + [f"{feature}_normalized" for feature in METRICS_WEIGHTS.keys()]
    X_pred = df_normalized[predictors]
    df_normalized["predicted_growth_potential"] = saved_model.predict(X_pred)

    print("\nPredicted Growth Potential Scores:")
    for index, row in df_normalized.iterrows():
        symbol = row.get("Symbol", f"Stock {index}")
        score = row["predicted_growth_potential"]
        print(f"{symbol}: {score:.2f}/100")
    return df_normalized

# ====================================================
# Flask Web API Endpoints
# ====================================================

app = Flask(__name__)

@app.route('/api/growth/<symbol>')
def get_growth_score(symbol):
    """Get growth score for a single stock symbol"""
    try:
        print(f"Getting growth score for {symbol}...")
        result = run_scoring_for_tickers([symbol])
        if result is not None and not result.empty:
            score = result.iloc[0]['predicted_growth_potential']
            return jsonify({
                'symbol': symbol,
                'growthScore': float(score),
                'status': 'success'
            })
        else:
            return jsonify({'error': 'No data found for symbol'}), 404
    except Exception as e:
        print(f"Error getting growth score for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/growth/bulk', methods=['POST'])
def get_bulk_growth_scores():
    """Get growth scores for multiple stock symbols"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        if not symbols:
            return jsonify({'error': 'No symbols provided'}), 400
        
        print(f"Getting growth scores for {len(symbols)} symbols...")
        result = run_scoring_for_tickers(symbols)
        
        if result is not None and not result.empty:
            scores = []
            for _, row in result.iterrows():
                scores.append({
                    'symbol': row['Symbol'],
                    'growthScore': float(row['predicted_growth_potential'])
                })
            return jsonify({'scores': scores, 'status': 'success'})
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"Error getting bulk growth scores: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/growth/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'growth_model'})

# ====================================================
# Main Execution Block
# ====================================================
if __name__ == "__main__":
    # Check if running as web server or training script
    if len(sys.argv) > 1 and sys.argv[1] == '--server':
        print("Starting Growth Model API server on port 5001...")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        # Original training code
        tickers_to_score = ["AMD", "AAPL", "NVDA", "TSLA", "ISRG", "MU", "INTC", "PLTR", "KO", "PEP", "WMT", "HD", "MCD", "NKE", "SBUX", "TGT", "PG", "AMGN", "CI", "CVS", "HUM", "DAL", "FDX", "HON", "LMT", "UBER", "VST", "XEL"]  # Example tickers; modify as needed
        run_scoring_for_tickers(tickers_to_score)
