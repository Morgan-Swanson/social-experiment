# Social Experiment

[![Tests](https://github.com/Morgan-Swanson/social-experiment/workflows/Tests/badge.svg)](https://github.com/Morgan-Swanson/social-experiment/actions)
[![codecov](https://codecov.io/gh/Morgan-Swanson/social-experiment/branch/main/graph/badge.svg)](https://codecov.io/gh/Morgan-Swanson/social-experiment)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](https://github.com/Morgan-Swanson/social-experiment/releases)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow.svg)](https://www.buymeacoffee.com/morganswanson)

An open-source platform for running AI-powered classification studies on social media data. Built with Next.js, TypeScript, and OpenAI.

## Features

- **Dataset Management**: Upload and manage CSV datasets with social media content
- **Custom Classifiers**: Create reusable AI classifiers with custom prompts
- **Constraints**: Define model constraints for consistent classification behavior
- **Batch Processing**: Run classification studies on entire datasets efficiently
- **Multiple AI Models**: Support for GPT-4o, GPT-4, GPT-3.5, O1, and more
- **Results Export**: Download classification results as CSV for analysis
- **Real-time Updates**: Auto-refreshing study status with loading indicators
- **Tabular Data Viewers**: Interactive table views for datasets and results

## Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- Docker and Docker Compose (for local storage)
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Morgan-Swanson/social-experiment.git
cd social-experiment
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/social_experiment"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
STORAGE_BUCKET="datasets"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

4. Start local storage (MinIO):
```bash
npm run docker:up
```

5. Initialize the database:
```bash
npm run db:push
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

### Default Test Account

After seeding the database, you can login with:
- Email: `test@example.com`
- Password: `password123`

## Usage

### 1. Add Your API Key

Navigate to Account settings and add your OpenAI API key. Keys are encrypted at rest.

### 2. Upload a Dataset

Go to the Data page and upload a CSV file with your social media content. Example format:

```csv
id,tweet,username,timestamp
1,"Just voted for the infrastructure bill!",@politician_jane,2024-01-15T10:30:00
2,"The new tax policy is disastrous.",@concerned_voter,2024-01-15T11:45:00
```

### 3. Create Classifiers

Define classifiers on the Classifiers page. Example:

- **Name**: Sentiment Analysis
- **Prompt**: "Classify the sentiment of this text. Return one of: positive, negative, neutral"

### 4. Run a Study

On the Studies page:
1. Select your dataset
2. Choose which classifiers to apply
3. Optionally add constraints
4. Select an AI model
5. Set sample size
6. Click "Run Study"

### 5. View Results

Once complete, click on the study to view results in a table or download as CSV.

## Architecture

The application is built with:

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Storage**: S3-compatible (MinIO for local, AWS S3 for production)
- **AI**: OpenAI API with structured JSON output
- **Auth**: NextAuth.js with email/password

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

### Running Tests

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Deployment

### Using Terraform (AWS)

The project includes Terraform configurations for AWS deployment:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This will provision:
- VPC with public/private subnets
- RDS PostgreSQL database
- S3 bucket for dataset storage
- ECS Fargate service
- Application Load Balancer

### Environment Variables for Production

Set these additional environment variables:

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
STORAGE_ENDPOINT="https://s3.amazonaws.com"
STORAGE_ACCESS_KEY="your-aws-access-key"
STORAGE_SECRET_KEY="your-aws-secret-key"
ENCRYPTION_KEY="your-production-encryption-key"
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- **Documentation**: [docs/](docs/)
- **Issue Tracker**: [GitHub Issues](https://github.com/Morgan-Swanson/social-experiment/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Morgan-Swanson/social-experiment/discussions)

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [OpenAI](https://openai.com/)
- Built with [Slate](https://slate.dev/) by [Random Labs](https://randomlabs.ai/)
