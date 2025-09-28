# PortfoliGO - Fantasy Stock Trading Platform

PortfoliGO is a comprehensive fantasy stock trading platform that combines machine learning-powered stock analysis with competitive league-based gameplay. Users can draft stocks, compete with friends, and dominate the markets in the ultimate fantasy trading experience.

## 🚀 Features

### Core Functionality
- **League Management**: Create and join public/private leagues with customizable settings
- **Stock Drafting**: Snake draft system for selecting stocks
- **Real-time Analytics**: ML-powered scoring based on growth, value, and risk metrics
- **Portfolio Visualization**: Interactive charts and analytics dashboard
- **Commissioner Controls**: League settings, member management, and draft controls

### Advanced Features
- **Machine Learning Integration**: Automated stock scoring using growth potential, value, and risk models
- **Dynamic Scoring Weights**: Customizable league scoring systems
- **Member Management**: Team creation, role assignment, and league administration
- **Public/Private Leagues**: Flexible league visibility and joining options
- **Responsive Design**: Mobile-first UI with modern, intuitive interface

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library
- **Recharts** - Data visualization and charting

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Secure data access policies
- **Real-time Subscriptions** - Live updates for draft and league events

### Machine Learning
- **Python** - ML model development and training
- **Scikit-learn** - Machine learning algorithms
- **Pandas** - Data manipulation and analysis
- **Pickle** - Model serialization and deployment

## 📊 ML Models

The platform uses three core ML models for stock analysis:

1. **Growth Potential Model**: Predicts future stock growth based on historical data and market indicators
2. **Value Model**: Evaluates stock valuation using fundamental analysis metrics
3. **Risk Model**: Assesses investment risk through volatility and market analysis

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── ...             # Custom components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── pages/              # Application pages/routes
├── services/           # API and business logic
├── types/              # TypeScript type definitions
├── models/             # ML model files
└── data_collection/    # Data processing scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Python 3.8+ (for ML models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbhishekM101/portfoliGO.git
   cd portfoliGO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL migration script in `complete_league_system_fixed.sql`
   - Add your Supabase URL and anon key to environment variables

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:8082 in your browser

## 🗄️ Database Schema

### Core Tables
- **leagues**: League information and settings
- **league_members**: User memberships and roles
- **league_settings**: Customizable scoring weights
- **stocks**: Stock data and ML scores
- **rosters**: User stock selections

### Key Features
- Row Level Security for data protection
- Real-time subscriptions for live updates
- Automated member count tracking
- Commissioner role management

## 🎮 How to Play

1. **Create/Join a League**: Set up or join a league with friends
2. **Configure Settings**: Adjust scoring weights and league parameters
3. **Draft Stocks**: Participate in the snake draft to select your portfolio
4. **Monitor Performance**: Track your stocks using ML-powered analytics
5. **Compete**: Compare performance with league members

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### ML Model Training
```bash
cd src/models/
python growth_potential_model_gen.py
python risk_model_gen.py
python value_model_math.py
```

## 🚀 Deployment

### Lovable Platform
- Open [Lovable Project](https://lovable.dev/projects/b305e727-b0c6-42f8-9c26-a8ab786a3478)
- Click Share -> Publish for instant deployment

### Custom Domain
- Navigate to Project > Settings > Domains
- Connect your custom domain for professional branding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) - AI-powered development platform
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Backend services by [Supabase](https://supabase.com/)

---

**PortfoliGO** - Where fantasy meets finance, powered by machine learning.