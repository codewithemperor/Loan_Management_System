## Overview
The Loan Management System is a comprehensive web application designed to streamline and automate the entire loan lifecycle for financial institutions. This system provides end-to-end functionality from loan application and approval to disbursement, repayment tracking, and closure. Built with modern technologies, it offers a secure, scalable, and user-friendly platform for managing various types of loans including personal loans, business loans, mortgages, and auto loans.

## Methodology
The project follows a structured development methodology:

1. **Requirements Analysis**: Identifying key functional requirements for loan processing
2. **System Design**: Creating database schema, API contracts, and UI wireframes
3. **Agile Development**: Implementing features in 2-week sprints
4. **Continuous Testing**: Unit tests, integration tests, and end-to-end testing
5. **Deployment**: CI/CD pipeline for automated testing and deployment
6. **Maintenance**: Regular updates and feature enhancements

The system is designed with a focus on:
- Security and compliance with financial regulations
- User experience for both borrowers and loan officers
- Scalability to handle growing loan portfolios
- Integration with external payment gateways and credit bureaus

## Tech Stack
- **Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Recharts for data visualization
- **Backend**:
- Node.js
- Express.js
- TypeScript
- **Database**:
- PostgreSQL
- Prisma ORM
- **Authentication**:
- NextAuth.js
- JWT tokens
- **Payment Integration**:
- Stripe API
- **File Storage**:
- AWS S3
- **Deployment**:
- Vercel (frontend)
- Railway (backend)
- AWS RDS (database)
- **Development Tools**:
- ESLint
- Prettier
- Husky (git hooks)
- Commitlint

## File Structure
\`\`\`
Loan_Management_System/
├── app/                    # Next.js app directory (App Router)
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── loans/         # Loan-related endpoints
│   │   ├── payments/      # Payment endpoints
│   │   ├── customers/     # Customer endpoints
│   │   └── reports/       # Report endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── loans/             # Loan management pages
│   ├── customers/         # Customer management pages
│   ├── payments/          # Payment tracking pages
│   ├── reports/           # Report generation pages
│   ├── settings/          # System settings pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── ui/                # Shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── charts/            # Chart components
│   ├── forms/             # Form components
│   ├── loans/             # Loan-specific components
│   └── layout/            # Layout components
├── lib/                   # Utility functions
│   ├── auth.ts            # Authentication configuration
│   ├── db.ts              # Database connection
│   ├── utils.ts           # Helper functions
│   ├── validations.ts     # Validation schemas
│   └── stripe.ts          # Stripe integration
├── prisma/                # Database schema and migrations
│   ├── migrations/        # Database migration files
│   └── schema.prisma      # Database schema definition
├── public/                # Static assets
│   ├── images/            # Images and icons
│   └── favicon.ico        # Favicon
├── .env.example           # Environment variables example
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore rules
├── components.json        # Shadcn/ui configuration
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
\`\`\`

## Database Schema
The system uses PostgreSQL as the database with the following main entities:

### Users
- \`id\`: Primary key
- \`email\`: User's email address (unique)
- \`name\`: User's full name
- \`role\`: User role (admin, loan_officer, customer)
- \`passwordHash\`: Hashed password
- \`createdAt\`: Timestamp of account creation
- \`updatedAt\`: Timestamp of last update

### Customers
- \`id\`: Primary key
- \`userId\`: Foreign key to Users
- \`customerNumber\`: Unique customer identifier
- \`dateOfBirth\`: Customer's date of birth
- \`phone\`: Phone number
- \`address\`: Physical address
- \`creditScore\`: Credit score
- \`annualIncome\`: Annual income
- \`employmentStatus\`: Employment status
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### LoanProducts
- \`id\`: Primary key
- \`name\`: Product name (Personal Loan, Business Loan, etc.)
- \`description\`: Product description
- \`interestRate\`: Annual interest rate
- \`minAmount\`: Minimum loan amount
- \`maxAmount\`: Maximum loan amount
- \`minTerm\`: Minimum loan term (months)
- \`maxTerm\`: Maximum loan term (months)
- \`processingFee\`: Processing fee percentage
- \`isActive\`: Product availability status
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### Loans
- \`id\`: Primary key
- \`loanNumber\`: Unique loan identifier
- \`customerId\`: Foreign key to Customers
- \`productId\`: Foreign key to LoanProducts
- \`amount\`: Loan amount
- \`term\`: Loan term (months)
- \`interestRate\`: Applied interest rate
- \`status\`: Loan status (applied, approved, disbursed, active, closed, defaulted)
- \`appliedDate\`: Date of application
- \`approvedDate\`: Date of approval (nullable)
- \`disbursedDate\`: Date of disbursement (nullable)
- \`dueDate\`: Final due date
- \`processingFee\`: Processing fee amount
- \`assignedTo\`: Foreign key to Users (loan officer)
- \`notes\`: Additional notes
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### Repayments
- \`id\`: Primary key
- \`loanId\`: Foreign key to Loans
- \`amount\`: Repayment amount
- \`paymentDate\`: Date of payment
- \`paymentMethod\`: Payment method (bank_transfer, check, cash)
- \`transactionId\`: Transaction identifier from payment gateway
- \`status\`: Payment status (pending, completed, failed)
- \`lateFee\`: Late fee applied
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### Collaterals
- \`id\`: Primary key
- \`loanId\`: Foreign key to Loans
- \`type\`: Collateral type (property, vehicle, etc.)
- \`description\`: Collateral description
- \`value\`: Collateral value
- \`documentUrl\`: URL to collateral document
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### Documents
- \`id\`: Primary key
- \`customerId\`: Foreign key to Customers (nullable)
- \`loanId\`: Foreign key to Loans (nullable)
- \`type\`: Document type (id_proof, income_proof, bank_statement, etc.)
- \`name\`: Document name
- \`fileUrl\`: URL to stored file
- \`uploadedBy\`: Foreign key to Users
- \`verified\`: Verification status
- \`verifiedBy\`: Foreign key to Users (verifier)
- \`verifiedAt\`: Timestamp of verification (nullable)
- \`createdAt\`: Timestamp of creation
- \`updatedAt\`: Timestamp of last update

### Notifications
- \`id\`: Primary key
- \`userId\`: Foreign key to Users
- \`title\`: Notification title
- \`message\`: Notification message
- \`type\`: Notification type (info, warning, alert)
- \`isRead\`: Read status
- \`createdAt\`: Timestamp of creation

## Installation
1. Clone the repository:
\`\`\`bash
git clone https://github.com/codewithemperor/Loan_Management_System.git
cd Loan_Management_System
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
- Copy \`.env.example\` to \`.env.local\`
- Fill in the required environment variables:
    \`\`\`
    DATABASE_URL="your_database_url"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your_nextauth_secret"
    STRIPE_SECRET_KEY="your_stripe_secret_key"
    STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
    AWS_ACCESS_KEY_ID="your_aws_access_key"
    AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
    AWS_BUCKET_NAME="your_s3_bucket_name"
    AWS_REGION="your_aws_region"
    \`\`\`

4. Set up the database:
\`\`\`bash
npx prisma migrate dev
npx prisma generate
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
- **Administrators**: Can manage users, loan products, system settings, and view system-wide reports.
- **Loan Officers**: Can process loan applications, approve/reject loans, manage customer accounts, and track repayments.
- **Customers**: Can apply for loans, upload documents, view loan status, and make repayments.

## Features
- **Loan Application**: Online loan application with document upload
- **Loan Processing**: Workflow for loan approval and disbursement
- **Customer Management**: Complete customer profile and document management
- **Repayment Tracking**: Automated repayment schedule and tracking
- **Payment Processing**: Integration with payment gateways
- **Collateral Management**: Tracking and valuation of loan collateral
- **Reporting**: Comprehensive reports for loan portfolio performance
- **Notification System**: Automated alerts for payments, due dates, and status changes
- **Document Management**: Secure storage and verification of customer documents
- **User Management**: Role-based access control
- **Dashboard**: Real-time analytics and key metrics

