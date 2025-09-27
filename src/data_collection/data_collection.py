import requests
import pandas as pd
import yfinance as yf
import time

from API_KEY import API_KEY

BASE_URL = "https://financialmodelingprep.com/api/v3"

##### Get market cap of a stock #####
def get_market_cap(symbol):
    url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        return response.json()[0]["mktCap"]
    return None 
        
##### Get PE ratio of a stock #####
def get_pe_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("priceEarningsRatioTTM")
    return None

##### Get industry PE ratio of a stock #####
def get_industry_pe_ratio(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    pe_ratios = []
                    
                    # Get PE ratios for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            ratio_url = f"{BASE_URL}/ratios-ttm/{company_symbol}?apikey={API_KEY}"
                            ratio_response = requests.get(ratio_url)
                            if ratio_response.status_code == 200:
                                data = ratio_response.json()
                                if data and len(data) > 0:
                                    pe_ratio = data[0].get("priceEarningsRatioTTM")
                                    if pe_ratio is not None:
                                        pe_ratios.append(pe_ratio)
                    
                    if pe_ratios:
                        return sum(pe_ratios) / len(pe_ratios)
    return None

def get_pe_vs_industry_pe(symbol):
    pe = get_pe_ratio(symbol)
    industry_pe = get_industry_pe_ratio(symbol)
    
    if industry_pe is None or industry_pe == 0:
        industry_pe = pe

    return pe / industry_pe

##### Get PEG ratio of a stock #####    
def get_peg_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("pegRatioTTM")
    return None

##### Get revenue of a stock #####
def get_revenue(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("revenue")
    return None

##### Get industry revenue #####
def get_industry_revenue(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    revenues = []
                    
                    # Get revenues for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            revenue = get_revenue(company_symbol)
                            if revenue is not None:
                                revenues.append(revenue)
                    
                    if revenues:
                        return sum(revenues) / len(revenues)
    return None

##### Get revenue vs industry revenue ratio #####
def get_revenue_vs_industry_revenue(symbol):
    revenue = get_revenue(symbol)
    industry_revenue = get_industry_revenue(symbol)
    if revenue is not None and industry_revenue is not None and industry_revenue != 0:
        return revenue / industry_revenue
    return None

##### Get Price-to-Book Ratio #####
def get_pb_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("priceToBookRatioTTM")
    return None

##### Get Price-to-Sales Ratio #####
def get_ps_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("priceToSalesRatioTTM")
    return None

##### Get Debt-to-Equity Ratio #####
def get_debt_to_equity_ratio(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("debtEquityRatioTTM")
    return None

##### Get EV/EBITDA Ratio #####
def get_ev_to_ebitda(symbol):
    url = f"{BASE_URL}/ratios-ttm/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("enterpriseValueMultipleTTM")
    return None

##### Get 2-Year Return on Equity #####
def get_two_year_roe(symbol):
    # Get income statement data
    income_url = f"{BASE_URL}/income-statement/{symbol}?limit=2&apikey={API_KEY}"
    income_response = requests.get(income_url)
    
    # Get balance sheet data
    balance_url = f"{BASE_URL}/balance-sheet-statement/{symbol}?limit=2&apikey={API_KEY}"
    balance_response = requests.get(balance_url)
    
    if income_response.status_code == 200 and balance_response.status_code == 200:
        income_data = income_response.json()
        balance_data = balance_response.json()
        
        if len(income_data) >= 2 and len(balance_data) >= 2:
            roe_values = []
            
            # Calculate ROE for each year
            for i in range(2):
                net_income = income_data[i].get("netIncome")
                equity = balance_data[i].get("totalStockholdersEquity")
                
                if net_income is not None and equity is not None and equity != 0:
                    roe = (net_income / equity) * 100  # Convert to percentage
                    roe_values.append(roe)
            
            if roe_values:
                return sum(roe_values) / len(roe_values)  # Average ROE over 2 years
    return None

##### Get 2-Year ROI #####
def get_two_year_roi(symbol):
    # Get historical price data
    url = f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        historical_prices = data.get("historical", [])
        if len(historical_prices) >= 504:  # Approximately 2 years of trading days
            current_price = historical_prices[0].get("close")
            price_2_years_ago = historical_prices[503].get("close")
            
            if current_price is not None and price_2_years_ago is not None and price_2_years_ago != 0:
                return ((current_price - price_2_years_ago) / price_2_years_ago) * 100  # Return as percentage
    return None

##### Get Beta #####
def get_beta(symbol):
    url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("beta")
    return None

##### Get Industry Beta #####
def get_industry_beta(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    betas = []
                    
                    # Get betas for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            beta = get_beta(company_symbol)
                            if beta is not None:
                                betas.append(beta)
                    
                    if betas:
                        return sum(betas) / len(betas)
    return None

##### Get Beta vs Industry Beta #####
def get_beta_vs_industry_beta(symbol):
    beta = get_beta(symbol)
    industry_beta = get_industry_beta(symbol)
    if beta is not None and industry_beta is not None and industry_beta != 0:
        return beta / industry_beta
    return None

##### Get Trading Volume #####
def get_trading_volume(symbol):
    url = f"{BASE_URL}/quote/{symbol}?apikey={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0].get("volume")
    return None

##### Get Industry Trading Volume #####
def get_industry_trading_volume(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    volumes = []
                    
                    # Get trading volumes for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            volume = get_trading_volume(company_symbol)
                            if volume is not None:
                                volumes.append(volume)
                    
                    if volumes:
                        return sum(volumes) / len(volumes)
    return None

##### Get Trading Volume vs Industry Trading Volume #####
def get_volume_vs_industry_volume(symbol):
    volume = get_trading_volume(symbol)
    industry_volume = get_industry_trading_volume(symbol)
    if volume is not None and industry_volume is not None and industry_volume != 0:
        return volume / industry_volume
    return None

##### Get Altman Z-Score #####
def get_altman_z_score(symbol):
    # Get balance sheet data
    balance_url = f"{BASE_URL}/balance-sheet-statement/{symbol}?apikey={API_KEY}"
    balance_response = requests.get(balance_url)
    
    # Get income statement data
    income_url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    income_response = requests.get(income_url)
    
    if balance_response.status_code == 200 and income_response.status_code == 200:
        balance_data = balance_response.json()
        income_data = income_response.json()
        
        if balance_data and income_data and len(balance_data) > 0 and len(income_data) > 0:
            # Get required values from balance sheet
            total_assets = balance_data[0].get("totalAssets")
            current_assets = balance_data[0].get("totalCurrentAssets")
            current_liabilities = balance_data[0].get("totalCurrentLiabilities")
            retained_earnings = balance_data[0].get("retainedEarnings")
            total_liabilities = balance_data[0].get("totalLiabilities")
            
            # Get required values from income statement
            ebit = income_data[0].get("operatingIncome")  # Using operatingIncome instead of ebit
            revenue = income_data[0].get("revenue")
            
            # Get market cap for market value of equity
            market_cap = get_market_cap(symbol)
            
            if all(v is not None and v != 0 for v in [total_assets, current_assets, current_liabilities, 
                                                     retained_earnings, total_liabilities, ebit, 
                                                     revenue, market_cap]):
                # Calculate working capital
                working_capital = current_assets - current_liabilities
                
                # Calculate Altman Z-Score components
                a = working_capital / total_assets
                b = retained_earnings / total_assets
                c = ebit / total_assets
                d = market_cap / total_liabilities
                e = revenue / total_assets
                
                # Calculate Z-Score
                z_score = (1.2 * a) + (1.4 * b) + (3.3 * c) + (0.6 * d) + (1.0 * e)
                
                return z_score
    return None

##### Get Industry Altman Z-Score #####
def get_industry_altman_z_score(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    z_scores = []
                    
                    # Get Z-scores for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            z_score = get_altman_z_score(company_symbol)
                            if z_score is not None:
                                z_scores.append(z_score)
                    
                    if z_scores:
                        return sum(z_scores) / len(z_scores)
    return None

##### Get Z-Score vs Industry Z-Score #####
def get_z_score_vs_industry_z_score(symbol):
    z_score = get_altman_z_score(symbol)
    industry_z_score = get_industry_altman_z_score(symbol)
    if z_score is not None and industry_z_score is not None and industry_z_score != 0:
        return z_score / industry_z_score
    return None

##### Get Historical Revenue Growth Rate #####
def get_historical_revenue_growth(symbol):
    # Get income statement data for last 2 years
    url = f"{BASE_URL}/income-statement/{symbol}?limit=2&apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 2:  # Need at least 2 years of data
            current_revenue = data[0].get("revenue")
            two_year_ago_revenue = data[1].get("revenue")
            
            if current_revenue is not None and two_year_ago_revenue is not None and two_year_ago_revenue != 0:
                growth_rate = ((current_revenue - two_year_ago_revenue) / two_year_ago_revenue) * 100
                return growth_rate
    return None

##### Get Industry Historical Revenue Growth Rate #####
def get_industry_historical_revenue_growth(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    growth_rates = []
                    
                    # Get growth rates for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            growth_rate = get_historical_revenue_growth(company_symbol)
                            if growth_rate is not None:
                                growth_rates.append(growth_rate)
                    
                    if growth_rates:
                        return sum(growth_rates) / len(growth_rates)
    return None

##### Get Growth Rate vs Industry Growth Rate #####
def get_growth_vs_industry_growth(symbol):
    growth_rate = get_historical_revenue_growth(symbol)
    industry_growth_rate = get_industry_historical_revenue_growth(symbol)
    if growth_rate is not None and industry_growth_rate is not None:
        # Return absolute difference in percentage points instead of ratio
        # Positive means growing faster than industry
        # Negative means growing slower than industry
        return growth_rate - industry_growth_rate
    return None

##### Get Market Share for a Specific Year #####
def get_market_share_for_year(symbol, year_index=0):
    try:
        print(f"\nCalculating market share for {symbol}, year_index: {year_index}")
        # Get revenue for specific year
        url = f"{BASE_URL}/income-statement/{symbol}?limit={year_index + 1}&apikey={API_KEY}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > year_index:
                company_revenue = data[year_index].get("revenue")
                print(f"{symbol} revenue: {company_revenue}")
                
                if company_revenue is None:
                    print(f"No revenue data available for {symbol}")
                    return None
                
                # Get company's industry
                profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
                profile_response = requests.get(profile_url)
                time.sleep(0.25)  # Add delay to avoid rate limiting
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    if profile_data and len(profile_data) > 0:
                        industry = profile_data[0].get("industry")
                        sector = profile_data[0].get("sector")
                        print(f"{symbol} industry: {industry}, sector: {sector}")
                        
                        # Special handling for tech companies
                        if industry in ["Internet Content & Information", "Software—Application", "Software—Infrastructure"]:
                            search_params = "sector=Technology"
                        else:
                            # Try industry first, if not available use sector
                            search_category = industry if industry else sector
                            search_params = f"{'industry' if industry else 'sector'}={search_category}"
                        
                        if search_params:
                            # Get companies in the same category
                            search_url = f"{BASE_URL}/stock-screener?{search_params}&apikey={API_KEY}"
                            search_response = requests.get(search_url)
                            time.sleep(0.25)  # Add delay to avoid rate limiting
                            
                            if search_response.status_code == 200:
                                peer_companies = search_response.json()
                                print(f"Found {len(peer_companies)} companies in category")
                                
                                if len(peer_companies) == 0:
                                    print(f"No peer companies found for {symbol}")
                                    return None
                                
                                total_revenue = 0
                                processed_companies = []
                                
                                # Get revenues for peer companies
                                for company in peer_companies[:10]:  # Limit to top 10 companies
                                    peer_symbol = company.get("symbol")
                                    if peer_symbol and peer_symbol not in processed_companies:
                                        processed_companies.append(peer_symbol)
                                        try:
                                            rev_url = f"{BASE_URL}/income-statement/{peer_symbol}?limit={year_index + 1}&apikey={API_KEY}"
                                            rev_response = requests.get(rev_url)
                                            time.sleep(0.25)  # Add delay to avoid rate limiting
                                            
                                            if rev_response.status_code == 200:
                                                rev_data = rev_response.json()
                                                if len(rev_data) > year_index:
                                                    revenue = rev_data[year_index].get("revenue")
                                                    if revenue is not None:
                                                        total_revenue += revenue
                                                        print(f"Added {peer_symbol} revenue: {revenue}")
                                        except Exception as e:
                                            print(f"Error processing {peer_symbol}: {str(e)}")
                                            continue
                                
                                print(f"Total category revenue: {total_revenue}")
                                if total_revenue > 0:
                                    market_share = (company_revenue / total_revenue) * 100
                                    print(f"Calculated market share: {market_share}%")
                                    return market_share
                                else:
                                    print("Total category revenue is 0 or negative")
                            else:
                                print(f"Failed to get peer companies for {symbol}")
                        else:
                            print(f"No valid search parameters found for {symbol}")
                    else:
                        print(f"No profile data found for {symbol}")
                else:
                    print(f"Failed to get profile data for {symbol}")
            else:
                print(f"No revenue data found for year index {year_index}")
        else:
            print(f"Failed to get income statement data for {symbol}")
    except Exception as e:
        print(f"Error in market share calculation for {symbol}: {str(e)}")
    return None

##### Get Market Share Growth Over 2 Years #####
def get_market_share_growth(symbol):
    current_market_share = get_market_share_for_year(symbol, 0)
    two_year_ago_market_share = get_market_share_for_year(symbol, 1)
    
    if current_market_share is not None and two_year_ago_market_share is not None and two_year_ago_market_share != 0:
        return current_market_share - two_year_ago_market_share  # Return change in percentage points
    return None

def get_rd_spending(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            rd_expenses = data[0].get("researchAndDevelopmentExpenses")
            return rd_expenses
    return None

##### Get R&D to Revenue Ratio #####
def get_rd_to_revenue_ratio(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            rd_expenses = data[0].get("researchAndDevelopmentExpenses")
            revenue = data[0].get("revenue")
            
            if rd_expenses is not None and revenue is not None and revenue != 0:
                return (rd_expenses / revenue) * 100
    return None

##### Get Industry R&D to Revenue Ratio #####
def get_industry_rd_to_revenue_ratio(symbol):
    # Get company's industry
    profile_url = f"{BASE_URL}/profile/{symbol}?apikey={API_KEY}"
    profile_response = requests.get(profile_url)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data and len(profile_data) > 0:
            industry = profile_data[0].get("industry")
            if industry:
                # Get companies in the same industry
                industry_url = f"{BASE_URL}/stock-screener?industry={industry}&apikey={API_KEY}"
                industry_response = requests.get(industry_url)
                
                if industry_response.status_code == 200:
                    industry_companies = industry_response.json()
                    rd_ratios = []
                    
                    # Get R&D ratios for up to 5 companies in the industry
                    for company in industry_companies[:5]:
                        company_symbol = company.get("symbol")
                        if company_symbol:
                            rd_ratio = get_rd_to_revenue_ratio(company_symbol)
                            if rd_ratio is not None:
                                rd_ratios.append(rd_ratio)
                    
                    if rd_ratios:
                        return sum(rd_ratios) / len(rd_ratios)
    return None

##### Get R&D Investment Level vs Industry #####
def get_rd_vs_industry(symbol):
    rd_ratio = get_rd_to_revenue_ratio(symbol)
    industry_rd_ratio = get_industry_rd_to_revenue_ratio(symbol)
    if rd_ratio is not None and industry_rd_ratio is not None:
        # Return difference in percentage points
        # Positive means investing more than industry average
        # Negative means investing less than industry average
        return rd_ratio - industry_rd_ratio
    return None

##### Get EPS (Basic and Diluted) #####
def get_eps(symbol):
    url = f"{BASE_URL}/income-statement/{symbol}?apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            basic_eps = data[0].get("eps")
            diluted_eps = data[0].get("epsdiluted")
            return {
                "basic": basic_eps,
                "diluted": diluted_eps
            }
    return None

##### Get Earnings Growth Rate for a Period #####
def get_earnings_growth_rate(symbol, year_index=0):
    url = f"{BASE_URL}/income-statement/{symbol}?limit={year_index + 2}&apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= year_index + 2:
            current_earnings = data[year_index].get("netIncome")
            prev_earnings = data[year_index + 1].get("netIncome")
            
            if current_earnings is not None and prev_earnings is not None and prev_earnings != 0:
                return ((current_earnings - prev_earnings) / abs(prev_earnings)) * 100  # Return as percentage
    return None

##### Get Earnings Stability #####
def get_earnings_stability(symbol):
    # Get 4 years of earnings growth rates (resulting in 3 year-over-year changes)
    url = f"{BASE_URL}/income-statement/{symbol}?limit=4&apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 4:
            growth_rates = []
            
            # Calculate year-over-year growth rates
            for i in range(3):
                current_earnings = data[i].get("netIncome")
                prev_earnings = data[i + 1].get("netIncome")
                
                if current_earnings is not None and prev_earnings is not None and prev_earnings != 0:
                    growth_rate = ((current_earnings - prev_earnings) / abs(prev_earnings)) * 100
                    growth_rates.append(growth_rate)
            
            if len(growth_rates) >= 2:
                # Calculate the standard deviation of growth rates
                mean_growth = sum(growth_rates) / len(growth_rates)
                squared_diff_sum = sum((x - mean_growth) ** 2 for x in growth_rates)
                std_dev = (squared_diff_sum / len(growth_rates)) ** 0.5
                
                # Calculate coefficient of variation (CV) for normalized volatility measure
                if mean_growth != 0:
                    cv = (std_dev / abs(mean_growth)) * 100
                    return {
                        "volatility": cv,  # Lower is better (more stable)
                        "mean_growth": mean_growth,
                        "std_dev": std_dev
                    }
    return None

##### Get Margins for a Specific Year #####
def get_margins_for_year(symbol, year_index=0):
    url = f"{BASE_URL}/income-statement/{symbol}?limit={year_index + 1}&apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) > year_index:
            revenue = data[year_index].get("revenue")
            gross_profit = data[year_index].get("grossProfit")
            operating_income = data[year_index].get("operatingIncome")
            net_income = data[year_index].get("netIncome")
            
            if all(v is not None and revenue != 0 for v in [revenue, gross_profit, operating_income, net_income]):
                return {
                    "gross_margin": (gross_profit / revenue) * 100,
                    "operating_margin": (operating_income / revenue) * 100,
                    "net_margin": (net_income / revenue) * 100
                }
    return None

##### Get Overall Margin Changes #####
def get_overall_margin_changes(symbol):
    # Get 3 years of margin data
    url = f"{BASE_URL}/income-statement/{symbol}?limit=3&apikey={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 3:
            margins_by_year = []
            
            # Get margins for each year
            for i in range(3):
                margins = get_margins_for_year(symbol, i)
                if margins:
                    margins_by_year.append(margins)
            
            if len(margins_by_year) >= 3:
                # Calculate year-over-year changes
                changes = {
                    "gross_margin_change": margins_by_year[0]["gross_margin"] - margins_by_year[2]["gross_margin"],
                    "operating_margin_change": margins_by_year[0]["operating_margin"] - margins_by_year[2]["operating_margin"],
                    "net_margin_change": margins_by_year[0]["net_margin"] - margins_by_year[2]["net_margin"],
                    "current_gross_margin": margins_by_year[0]["gross_margin"],
                    "current_operating_margin": margins_by_year[0]["operating_margin"],
                    "current_net_margin": margins_by_year[0]["net_margin"]
                }
                
                # Calculate overall margin trend score
                # Positive score means improving margins
                # Negative score means deteriorating margins
                trend_score = (
                    changes["gross_margin_change"] +
                    changes["operating_margin_change"] * 1.5 +  # Weight operating margin changes more
                    changes["net_margin_change"] * 2  # Weight net margin changes the most
                ) / 4.5  # Normalize by sum of weights
                
                changes["margin_trend_score"] = trend_score
                
                # Calculate margin stability
                stability_scores = []
                for margin_type in ["gross_margin", "operating_margin", "net_margin"]:
                    values = [year[margin_type] for year in margins_by_year]
                    mean = sum(values) / len(values)
                    std_dev = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
                    cv = (std_dev / abs(mean)) * 100 if mean != 0 else float('inf')
                    stability_scores.append(cv)
                
                # Lower stability score means more stable margins
                changes["margin_stability_score"] = sum(stability_scores) / len(stability_scores)
                
                return changes
    return None

##### Get all features #####
def get_all_features(symbol):
    eps_data = get_eps(symbol)
    stability_data = get_earnings_stability(symbol)
    margin_data = get_overall_margin_changes(symbol)
    
    features = {
        "Market Cap": get_market_cap(symbol),
        "PE Ratio": get_pe_ratio(symbol),
        "Industry PE Ratio": get_industry_pe_ratio(symbol),
        "PE vs Industry PE": get_pe_vs_industry_pe(symbol),
        "PEG Ratio": get_peg_ratio(symbol),
        "Price-to-Book Ratio": get_pb_ratio(symbol),
        "Price-to-Sales Ratio": get_ps_ratio(symbol),
        "EV/EBITDA": get_ev_to_ebitda(symbol),
        "Beta": get_beta(symbol),
        "Industry Beta": get_industry_beta(symbol),
        "Beta vs Industry Beta": get_beta_vs_industry_beta(symbol),
        "Debt/Equity Ratio": get_debt_to_equity_ratio(symbol),
        "2-Year ROE (%)": get_two_year_roe(symbol),
        "2-Year ROI (%)": get_two_year_roi(symbol),
        "Revenue": get_revenue(symbol),
        "Industry Revenue": get_industry_revenue(symbol),
        "Revenue vs Industry Revenue": get_revenue_vs_industry_revenue(symbol),
        "Current Market Share (%)": get_market_share_for_year(symbol, 0),
        "Market Share 2 Years Ago (%)": get_market_share_for_year(symbol, 1),
        "Market Share Growth (pp)": get_market_share_growth(symbol),
        "R&D": get_rd_spending(symbol),
        "R&D vs Revenue (%)": get_rd_to_revenue_ratio(symbol),
        "Industry R&D to Revenue (%)": get_industry_rd_to_revenue_ratio(symbol),
        "R&D Investment vs Industry (pp)": get_rd_vs_industry(symbol),
        "2-Year Revenue Growth (%)": get_historical_revenue_growth(symbol),
        "Industry Revenue Growth (%)": get_industry_historical_revenue_growth(symbol),
        "Growth vs Industry Growth (pp)": get_growth_vs_industry_growth(symbol),
        "Trading Volume": get_trading_volume(symbol),
        "Industry Trading Volume": get_industry_trading_volume(symbol),
        "Trading Volume vs Industry": get_volume_vs_industry_volume(symbol),
        "Altman Z-Score": get_altman_z_score(symbol),
        "Industry Z-Score": get_industry_altman_z_score(symbol),
        "Z-Score vs Industry": get_z_score_vs_industry_z_score(symbol),
        "Basic EPS": eps_data.get("basic") if eps_data else None,
        "Diluted EPS": eps_data.get("diluted") if eps_data else None,
        "Earnings Growth Volatility (%)": stability_data.get("volatility") if stability_data else None,
        "Mean Earnings Growth (%)": stability_data.get("mean_growth") if stability_data else None,
        "Earnings Growth Std Dev": stability_data.get("std_dev") if stability_data else None,
        "Current Gross Margin (%)": margin_data.get("current_gross_margin") if margin_data else None,
        "Current Operating Margin (%)": margin_data.get("current_operating_margin") if margin_data else None,
        "Current Net Margin (%)": margin_data.get("current_net_margin") if margin_data else None,
        "Gross Margin Change (pp)": margin_data.get("gross_margin_change") if margin_data else None,
        "Operating Margin Change (pp)": margin_data.get("operating_margin_change") if margin_data else None,
        "Net Margin Change (pp)": margin_data.get("net_margin_change") if margin_data else None,
        "Margin Trend Score": margin_data.get("margin_trend_score") if margin_data else None,
        "Margin Stability Score": margin_data.get("margin_stability_score") if margin_data else None
    }
    return features

##### Save features to CSV #####
def features_to_csv():
    symbols = ["GOOGL", "T", "CHTR", "EA", "META", "NFLX", "VZ", "WBD", 
               "ABNB", "AMZN", "CMG", "DHI", "F", "HD", "LULU", "MCD", "NKE", "TSLA", 
               "KO", "COST", "GIS", "PEP", "PG", "WBA", "WMT",
               "CVX", "COP", "XOM", "VLO",
               "ALL", "AXP", "BAC", "BLK", "CB", "GS", "JPM", "PYPL", "V", 
               "AMGN", "CI", "CVS", "HUM", "ISRG", "JNJ", "LLY", "MRNA", "PFE",
               "BA", "DAL", "FDX", "HON", "LMT", "UBER", "WM",
               "ACN", "AMD", "AAPL", "AVGO", "CSCO", "IBM", "INTC", "MU", "MSFT", "NVDA", "ORCL", "PLTR", "QCOM", "CRM", "NOW",
               "AMCR", "DD", "FMC", "PPG", "SHW",
               "CBRE", "EQIX", "O",
               "AEP", "D", "VST", "XEL"]
    data = []
    
    for symbol in symbols:
        try:
            print(f"Processing {symbol}...")
            features = get_all_features(symbol)
            features["Symbol"] = symbol
            data.append(features)
            time.sleep(0.25)  # Add a small delay between stocks to avoid hitting API rate limits
        except Exception as e:
            print(f"Error processing {symbol}: {str(e)}")
            continue

    if not data:
        print("No data was collected. Please check your API key and internet connection.")
        return

    df = pd.DataFrame(data)
    
    # Reorder columns in logical groups
    column_order = [
        "Symbol",
        # Size metrics
        "Market Cap",
        "Revenue",
        # Market Share metrics
        "Current Market Share (%)",
        "Market Share 2 Years Ago (%)",
        "Market Share Growth (pp)",
        # Margin metrics
        "Current Gross Margin (%)",
        "Current Operating Margin (%)",
        "Current Net Margin (%)",
        "Gross Margin Change (pp)",
        "Operating Margin Change (pp)",
        "Net Margin Change (pp)",
        "Margin Trend Score",
        "Margin Stability Score",
        # Earnings metrics
        "Basic EPS",
        "Diluted EPS",
        "Earnings Growth Volatility (%)",
        "Mean Earnings Growth (%)",
        "Earnings Growth Std Dev",
        # Growth metrics
        "2-Year Revenue Growth (%)",
        "Industry Revenue Growth (%)",
        "Growth vs Industry Growth (pp)",
        # R&D metrics
        "R&D",
        "R&D vs Revenue (%)",
        "Industry R&D to Revenue (%)",
        "R&D Investment vs Industry (pp)",
        # Volume metrics
        "Trading Volume",
        "Industry Trading Volume",
        "Trading Volume vs Industry",
        # Industry comparisons
        "Industry Revenue",
        "Revenue vs Industry Revenue",
        # Risk metrics
        "Beta",
        "Industry Beta",
        "Beta vs Industry Beta",
        "Altman Z-Score",
        "Industry Z-Score",
        "Z-Score vs Industry",
        # Valuation metrics
        "PE Ratio",
        "Industry PE Ratio",
        "PE vs Industry PE",
        "PEG Ratio",
        "Price-to-Book Ratio",
        "Price-to-Sales Ratio",
        "EV/EBITDA",
        # Performance metrics
        "2-Year ROE (%)",
        "2-Year ROI (%)",
        # Financial health metrics
        "Debt/Equity Ratio"
    ]
    
    df = df[column_order]
    df.to_csv("stock_features.csv", index=False)

def main():    
    features_to_csv()
    
if __name__ == "__main__":
    main()