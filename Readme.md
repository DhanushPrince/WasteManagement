# Sutham - AI-Driven Waste Management Platform

> Transforming waste from a civic liability into a localized economic resource for rural and semi-urban India (Bharat)

## Overview

Sutham is a mobile-first, zero-IoT waste management platform that uses AI-powered image analysis to optimize waste collection, predict disease outbreaks, and create circular economy opportunities. By leveraging smartphone cameras and AWS Bedrock (Claude 4.5), Sutham brings enterprise-grade waste management to communities without expensive sensor infrastructure.

## Key Features

### 🗺️ Hotspot Map Generation
- AI-powered waste detection from smartphone photos
- Automatic volume estimation and waste type classification
- GPS-tagged hotspot creation and aggregation

### 🚛 Optimized Route Planning
- Dynamic route generation to minimize fuel consumption
- Priority-based routing (Code Red for sensitive zones)
- Real-time route recalculation

### 🏥 Sensitive Zone Protection
- Automatic priority elevation for schools and hospitals
- Geofencing with 200m radius
- Immediate alerts to sanitation workers

### 🦟 Dengue Defence
- Stagnant water detection in waste images
- 7-10 day advance disease outbreak predictions
- Real-time risk assessment updates

### ✅ Clean Sweep Validation
- Before/after photo verification with AI
- Location-based validation (20m accuracy)
- Accountability through photo proof

### ♻️ Recyclable Allocation Engine
- High-value material identification (PET, metals, electronics)
- Automated alerts to recovery agents (ragpickers)
- Income generation for informal waste collectors

### 🚗 Smart Vehicle Dispatcher
- Match waste volume to vehicle capacity
- E-rickshaw, pickup, or compactor recommendations
- Route splitting for capacity optimization

### 🔥 Carbon Footprint Monitoring
- Illegal burning detection (smoke, flames, char marks)
- CO2 emission prevention tracking
- Seasonal risk predictions

### 🌾 Kuppai to Uram (Waste to Fertilizer)
- Organic waste composting tracking
- 60-90 day composting timeline
- Farmer notifications when compost is ready

## Technology Stack

### Mobile
- **React Native** - Cross-platform mobile apps
- **SQLite** - Offline-first data storage
- **React Native Maps** - Geolocation and routing

### Backend
- **Node.js + Express** - API services
- **AWS Lambda** - Serverless compute
- **AWS API Gateway** - RESTful API management

### AI/ML
- **AWS Bedrock (Claude 4.5)** - Multimodal image analysis
- **Amazon SageMaker** - Predictive analytics

### Data
- **Amazon Aurora PostgreSQL** - Relational database with PostGIS
- **Amazon S3** - Image storage
- **Amazon ElastiCache (Redis)** - Caching

### Infrastructure
- **AWS CloudFormation** - Infrastructure as code
- **Amazon CloudWatch** - Monitoring and logging
- **AWS SNS** - Push notifications and SMS

## Architecture

```
Mobile Apps (React Native)
        ↓
API Gateway + Lambda
        ↓
Application Services
        ↓
AWS Bedrock (AI) + Aurora DB + S3
```

## User Roles

- **Sanitation Workers** - Waste collection and cleanup
- **Recovery Agents** - Recyclable material collection
- **Farmers** - Compost collection
- **Municipal Administrators** - Operations management
- **Community Health Workers** - Disease prevention monitoring

## Getting Started

### Prerequisites
- Node.js 18 LTS
- React Native CLI
- AWS Account
- PostgreSQL 15 with PostGIS
- Redis 7

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sutham.git
cd sutham

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install

# iOS specific
cd ios && pod install && cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials and API keys
```

### Running Locally

```bash
# Start backend services
cd backend
npm run dev

# Start mobile app (iOS)
cd mobile
npm run ios

# Start mobile app (Android)
npm run android
```

## Project Structure

```
sutham/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   └── package.json
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── utils/         # Utilities
│   └── package.json
├── infrastructure/        # AWS CloudFormation templates
├── docs/                  # Documentation
└── .kiro/specs/          # Feature specifications
    └── sutham-waste-management/
        ├── requirements.md
        ├── design.md
        ├── tasks.md
        └── TECHNOLOGY_STACK.md
```

## Documentation

- [Requirements Document](.kiro/specs/sutham-waste-management/requirements.md) - Detailed requirements and acceptance criteria
- [Design Document](.kiro/specs/sutham-waste-management/design.md) - System architecture and design decisions
- [Technology Stack](.kiro/specs/sutham-waste-management/TECHNOLOGY_STACK.md) - Complete technology breakdown
- [API Documentation](docs/api.md) - API endpoints and usage

## Key Differentiators

### vs. Traditional IoT Solutions
- **Zero Hardware Dependency** - No expensive sensors or smart bins
- **Theft-Proof** - Smartphone-based, no physical infrastructure to steal
- **Lower Cost** - 90% cheaper than IoT-based systems

### vs. Grievance Apps
- **Predictive, Not Reactive** - Anticipates problems before they escalate
- **Integrated Ecosystem** - Connects sanitation, health, livelihoods, and agriculture
- **AI-Driven** - Automated waste detection and volume estimation

## Impact Metrics

- **Fuel Savings** - 30-40% reduction through route optimization
- **Response Time** - Code Red tasks addressed within 30 minutes
- **Disease Prevention** - 7-10 day advance outbreak warnings
- **Livelihood Creation** - Income opportunities for 1000+ recovery agents
- **Carbon Reduction** - Prevent illegal burning, track CO2 savings
- **Circular Economy** - 100% organic waste converted to compost

## Roadmap

### Phase 1 (MVP) - Q2 2026
- ✅ Mobile app for sanitation workers
- ✅ AI-powered waste detection
- ✅ Basic route optimization
- ✅ Before/after validation

### Phase 2 - Q3 2026
- 🔄 Recovery agent allocation
- 🔄 Dengue Defence predictions
- 🔄 Administrator dashboard
- 🔄 Multi-language support

### Phase 3 - Q4 2026
- 📋 Kuppai to Uram compost tracking
- 📋 Carbon monitoring
- 📋 Advanced analytics
- 📋 WhatsApp integration

### Phase 4 - 2027
- 📋 Multi-city expansion
- 📋 Integration with municipal systems
- 📋 Payment processing for recovery agents
- 📋 AR-based waste identification training

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Email**: support@sutham.in
- **Documentation**: https://docs.sutham.in
- **Issues**: https://github.com/your-org/sutham/issues

## Acknowledgments

- AWS for Bedrock AI services
- Municipal corporations partnering with us
- Sanitation workers and recovery agents on the ground
- Open-source community

---


*Sutham - Clean communities, healthy lives, circular economy*
