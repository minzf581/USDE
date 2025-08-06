# Enterprise Treasury Control Module Introduction

## Overview

The Enterprise Treasury Control Module is a comprehensive financial management system designed for enterprise-level users. It provides granular permission control, approval workflows, budget management, and audit capabilities to ensure secure and compliant financial operations.

## Key Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin**: Full system access including user management, settings, and all approvals
- **Finance Manager**: Can approve payments/withdrawals, view reports, and manage logs
- **Finance Operator**: Can initiate payments/withdrawals and view reports
- **Observer**: Read-only access for compliance and audit purposes

### 📊 Dashboard & Analytics
- Real-time financial overview with total assets, monthly payments/withdrawals
- Pending approvals count and recent transaction history
- User role and enterprise status display

### 👥 User Management
- Create and manage enterprise sub-accounts
- Assign roles and permissions to users
- Monitor KYC status and account activity
- Bulk user operations and role updates

### ✅ Approval Workflow Engine
- Configurable approval workflows (single, dual, committee)
- Amount-based approval thresholds
- Notes and audit trail for all approvals
- Automatic workflow progression

### 💰 Budget & Risk Management
- Monthly and quarterly budget limits
- Risk flag thresholds for large transactions
- Auto-approval settings for small amounts
- Real-time budget tracking and alerts

### 📈 Reports & Audit
- Monthly financial reports with transaction details
- Comprehensive audit logs with IP tracking
- Exportable data for compliance
- User activity monitoring

## File Structure

### Backend Files

```
backend/
├── routes/
│   └── treasury.js                    # Main treasury API routes
├── prisma/
│   ├── schema.prisma                  # Updated database schema with RBAC
│   └── seed-rbac.js                   # RBAC system initialization
└── server.js                          # Updated with treasury routes
```

### Frontend Files

```
frontend/src/
├── pages/
│   └── Treasury.js                    # Main treasury control page
├── components/
│   └── Layout.js                      # Updated with treasury navigation
└── App.js                             # Updated with treasury routes
```

## Database Schema

### New Models Added

#### Role-Based Access Control
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // admin, finance_manager, finance_operator, observer
  description String?
  permissions Permission[]
  users       UserRole[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique // view_balance, initiate_payment, approve_payment, etc.
  description String?
  roles       Role[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  companyId String?  // For enterprise users
  assignedAt DateTime @default(now())
  
  user      Company  @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])
  company   Company? @relation("CompanyUserRoles", fields: [companyId], references: [id])
}
```

#### Treasury Control Models
```prisma
model TreasurySettings {
  id                    String   @id @default(cuid())
  companyId             String   @unique
  monthlyBudget         Float    @default(0)
  quarterlyBudget       Float    @default(0)
  approvalThreshold     Float    @default(1000)
  autoApprovalEnabled   Boolean  @default(false)
  riskFlagThreshold     Float    @default(5000)
  approvalWorkflow      String   @default("single")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  company               Company  @relation(fields: [companyId], references: [id])
}

model ApprovalWorkflow {
  id          String   @id @default(cuid())
  companyId   String
  type        String   // payment, withdrawal, kyc
  requestId   String   // ID of the request
  status      String   @default("pending")
  currentStep Int      @default(1)
  totalSteps  Int      @default(1)
  approvers   String   // JSON array of approver IDs
  approvals   Approval[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(fields: [companyId], references: [id])
}

model Approval {
  id          String   @id @default(cuid())
  workflowId  String
  approverId  String
  status      String   @default("pending")
  notes       String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  
  workflow    ApprovalWorkflow @relation(fields: [workflowId], references: [id])
  approver    Company          @relation(fields: [approverId], references: [id])
}
```

### Updated Company Model
```prisma
model Company {
  // ... existing fields ...
  isEnterprise  Boolean  @default(false) // Enterprise account flag
  parentCompanyId String? // For sub-accounts in enterprise
  
  // New treasury relations
  userRoles     UserRole[] @relation("CompanyUserRoles")
  treasurySettings TreasurySettings?
  approvalWorkflows ApprovalWorkflow[]
  approvals     Approval[]
}
```

## API Endpoints

### Treasury Dashboard
- `GET /api/treasury/dashboard` - Get user's treasury dashboard data
- `GET /api/treasury/settings` - Get treasury settings
- `POST /api/treasury/settings` - Update treasury settings

### User Management
- `GET /api/treasury/users` - Get all enterprise users
- `POST /api/treasury/users` - Create new enterprise user
- `PATCH /api/treasury/users/:id/role` - Update user role

### Approval System
- `GET /api/treasury/approvals` - Get pending approvals
- `POST /api/treasury/approvals/:id/approve` - Approve request
- `POST /api/treasury/approvals/:id/reject` - Reject request

### Reports & Audit
- `GET /api/treasury/reports/monthly` - Get monthly reports
- `GET /api/treasury/logs` - Get audit logs

## Permission System

### Available Permissions
- `view_balance` - View account balance
- `initiate_payment` - Initiate payments
- `approve_payment` - Approve payment requests
- `view_reports` - View financial reports
- `manage_settings` - Manage treasury settings
- `manage_users` - Manage enterprise users
- `view_approvals` - View approval requests
- `view_logs` - View audit logs
- `download_logs` - Download audit logs
- `initiate_withdrawal` - Initiate withdrawals
- `approve_withdrawal` - Approve withdrawal requests
- `view_kyc` - View KYC information
- `approve_kyc` - Approve KYC requests

### Role Permissions Matrix

| Permission | Admin | Finance Manager | Finance Operator | Observer |
|------------|-------|-----------------|------------------|----------|
| view_balance | ✅ | ✅ | ✅ | ✅ |
| initiate_payment | ❌ | ✅ | ✅ | ❌ |
| approve_payment | ✅ | ✅ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ✅ | ✅ |
| manage_settings | ✅ | ❌ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ | ❌ |
| view_approvals | ✅ | ✅ | ✅ | ❌ |
| view_logs | ✅ | ✅ | ❌ | ❌ |
| download_logs | ✅ | ✅ | ❌ | ❌ |
| initiate_withdrawal | ❌ | ✅ | ✅ | ❌ |
| approve_withdrawal | ✅ | ✅ | ❌ | ❌ |
| view_kyc | ✅ | ✅ | ✅ | ✅ |
| approve_kyc | ✅ | ✅ | ❌ | ❌ |

## Frontend Components

### Main Treasury Page (`Treasury.js`)
- **Dashboard Tab**: Financial overview, recent transactions, user info
- **Users Tab**: User management with role assignment
- **Approvals Tab**: Approval center with workflow management
- **Settings Tab**: Treasury configuration and budget settings
- **Reports Tab**: Monthly financial reports
- **Logs Tab**: Audit log viewer

### Key Features
- Responsive design with mobile support
- Real-time data updates
- Role-based UI visibility
- Interactive approval workflows
- Form validation and error handling

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based API protection
- Session management

### Audit & Compliance
- Comprehensive audit logging
- IP address tracking
- User action history
- Exportable audit trails

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Setup Instructions

### 1. Database Migration
```bash
cd backend
npx prisma migrate dev --name add-treasury-control
```

### 2. Seed RBAC System
```bash
cd backend
node prisma/seed-rbac.js
```

### 3. Update Dependencies
```bash
# Backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Environment Configuration
Ensure the following environment variables are set:
```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
NODE_ENV="production"
```

## Usage Examples

### Creating Enterprise User
```javascript
// API call to create enterprise user
const response = await api.post('/treasury/users', {
  name: 'John Doe',
  email: 'john@company.com',
  password: 'securepassword',
  roleName: 'finance_operator'
});
```

### Approving Payment
```javascript
// API call to approve payment
const response = await api.post('/treasury/approvals/workflow-id/approve', {
  notes: 'Payment approved after review'
});
```

### Updating Treasury Settings
```javascript
// API call to update settings
const response = await api.post('/treasury/settings', {
  monthlyBudget: 50000,
  approvalThreshold: 2000,
  autoApprovalEnabled: true
});
```

## Best Practices

### Security
- Always validate user permissions before API calls
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

### Performance
- Use database indexing for frequent queries
- Implement caching for dashboard data
- Paginate large result sets
- Optimize database queries

### Maintenance
- Regular database backups
- Monitor system logs
- Update dependencies regularly
- Test approval workflows

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check user role and permissions
2. **Database Errors**: Verify schema migrations
3. **API Timeouts**: Check database connection
4. **UI Not Loading**: Verify frontend build

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Confirm database schema is up to date
4. Validate user authentication status

## Future Enhancements

### Planned Features
- Multi-currency support
- Advanced reporting with charts
- Email notifications for approvals
- Mobile app integration
- API rate limiting
- Advanced audit features

### Scalability Considerations
- Database sharding for large enterprises
- Microservices architecture
- Caching layer implementation
- Load balancing setup

This module provides a robust foundation for enterprise financial management with comprehensive security, audit capabilities, and user-friendly interfaces. 