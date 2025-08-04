# KYC Module Introduction

## Overview

The KYC (Know Your Customer) module is a comprehensive compliance system designed to verify the identity and assess the risk of enterprise users on the USDE platform. The module follows Singapore regulatory standards and ensures platform compliance while providing a smooth user experience.

## 🎯 Objectives

- **Identity Verification**: Verify company registration and beneficial ownership
- **Risk Assessment**: Identify politically exposed persons (PEP) and sanctioned entities
- **Compliance**: Ensure adherence to Singapore regulatory requirements
- **Access Control**: Restrict platform features based on KYC status

## 🏗️ Module Architecture

### Backend Structure

```
backend/
├── routes/
│   └── kyc.js              # KYC API endpoints
├── prisma/
│   ├── schema.prisma        # Database schema with KYC models
│   └── seed.js             # Database seeding with admin user
└── server.js               # Main server with KYC routes
```

### Frontend Structure

```
frontend/src/
├── pages/
│   └── KYC.js              # KYC application form
├── services/
│   └── api.js              # KYC API service functions
└── contexts/
    └── AuthContext.js       # Authentication with KYC status
```

## 📊 Database Design

### Core Models

#### Company Model
```prisma
model Company {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  password      String
  kycStatus     String   @default("pending") // pending, approved, rejected
  
  // KYC Company Information
  companyNameEn     String?  // Company name in English
  companyRegNumber  String?  // UEN/Registration number
  countryOfReg      String?  // Country of registration
  regAddress        String?  // Registered address
  incorporationDate DateTime? // Date of incorporation
  companyType       String?  // Type of company
  
  // KYC Compliance
  isPEP             Boolean  @default(false) // Politically Exposed Person
  isSanctioned      Boolean  @default(false) // Sanctioned country
  complianceAgreed  Boolean  @default(false) // Terms and conditions agreed
  
  // Relations
  ubos          UBO[]     // Ultimate Beneficial Owners
  kycReviews    KYCReview[] // KYC review history
}
```

#### UBO Model (Ultimate Beneficial Owner)
```prisma
model UBO {
  id              String   @id @default(cuid())
  companyId       String
  name            String
  idNumber        String   // ID/Passport number
  nationality     String
  address         String
  ownershipPercentage Float // Percentage of ownership
  addressProof    String?  // Address proof document
  
  // Relations
  company         Company  @relation(fields: [companyId], references: [id])
}
```

#### KYC Review Model
```prisma
model KYCReview {
  id          String   @id @default(cuid())
  companyId   String
  reviewerId  String?  // Admin who reviewed
  status      String   // pending, approved, rejected, request_info
  notes       String?  // Review notes
  reviewedAt  DateTime @default(now())
  
  // Relations
  company     Company  @relation(fields: [companyId], references: [id])
}
```

## 🔧 API Endpoints

### KYC Application Management

#### Submit KYC Application
```http
POST /api/kyc/submit
Content-Type: application/json
Authorization: Bearer <token>

{
  "companyNameEn": "Acme International Pte Ltd",
  "companyRegNumber": "201912345N",
  "countryOfReg": "Singapore",
  "regAddress": "123 Raffles Place, Singapore 048623",
  "incorporationDate": "2021-04-25",
  "companyType": "Private Limited Company",
  "isPEP": false,
  "isSanctioned": false,
  "complianceAgreed": true,
  "ubos": [
    {
      "name": "John Doe",
      "idNumber": "S1234567A",
      "nationality": "Singapore",
      "address": "123 Main Street, Singapore 123456",
      "ownershipPercentage": 25.5
    }
  ]
}
```

#### Get KYC Status
```http
GET /api/kyc/status
Authorization: Bearer <token>

Response:
{
  "status": "pending",
  "companyInfo": { ... },
  "compliance": { ... },
  "ubos": [ ... ],
  "documentsCount": 3,
  "latestReview": { ... }
}
```

#### Upload KYC Documents
```http
POST /api/kyc/upload-documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- documents: [files]
- documentType: "certificate_of_incorporation"
```

### UBO Management

#### Add UBO
```http
POST /api/kyc/ubo
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Smith",
  "idNumber": "S9876543B",
  "nationality": "Singapore",
  "address": "456 Second Street, Singapore 654321",
  "ownershipPercentage": 30.0
}
```

#### Update UBO
```http
PUT /api/kyc/ubo/:uboId
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Smith Updated",
  "ownershipPercentage": 35.0
}
```

#### Delete UBO
```http
DELETE /api/kyc/ubo/:uboId
Authorization: Bearer <token>
```

### Admin Functions

#### Get All KYC Applications
```http
GET /api/kyc/admin/applications?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

#### Review KYC Application
```http
PUT /api/kyc/admin/review/:companyId
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "approved",
  "notes": "All documents verified and approved"
}
```

## 🎨 Frontend Components

### KYC Application Form

The KYC page (`frontend/src/pages/KYC.js`) provides a multi-step form:

1. **Company Information Step**
   - Company name, registration number, country
   - Registered address and incorporation date
   - Company type selection

2. **UBO Details Step**
   - Add/edit/remove Ultimate Beneficial Owners
   - Ownership percentage validation
   - Address and identification details

3. **Compliance Step**
   - PEP declaration
   - Sanctioned country declaration
   - Terms and conditions agreement

4. **Status Step**
   - Application status display
   - Review notes and feedback
   - Progress tracking

### Key Features

- **Progress Tracking**: Visual step indicator
- **Form Validation**: Real-time validation with error messages
- **Dynamic UBO Management**: Add/remove beneficial owners
- **File Upload**: Document upload with type categorization
- **Status Updates**: Real-time status checking

## 🔐 Permission Control

### KYC Status-Based Access

```javascript
// Permission logic (pseudo-code)
if (user.kycStatus === 'approved') {
  allowAccessToAllFunctions();
} else {
  blockSensitiveActions();
  showKYCRequiredModal();
}
```

### Restricted Functions

When KYC is not approved, users cannot:
- 💸 Initiate deposits/withdrawals
- 💳 Create payment requests
- 🔁 Configure investment strategies
- 📈 View real asset returns

### Allowed Functions

Users with pending/rejected KYC can:
- 👀 Browse platform features
- 📝 Complete KYC application
- 📊 View demo data
- ⚙️ Update profile information

## 📋 Compliance Features

### Singapore Regulatory Compliance

1. **Company Registration Verification**
   - UEN (Unique Entity Number) validation
   - ACRA (Accounting and Corporate Regulatory Authority) integration
   - Business registration verification

2. **Beneficial Ownership Disclosure**
   - 25%+ ownership disclosure requirement
   - Ultimate beneficial owner identification
   - Ownership structure mapping

3. **Risk Assessment**
   - PEP (Politically Exposed Person) screening
   - Sanctioned country identification
   - Enhanced due diligence for high-risk entities

4. **Document Management**
   - Certificate of Incorporation
   - Memorandum & Articles of Association
   - Director identification documents
   - Address proof documents

### Data Retention

- KYC records retained for minimum 5 years (MAS requirement)
- Audit trail for all KYC activities
- Secure document storage and access

## 🚀 Implementation Guide

### Backend Setup

1. **Database Migration**
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   ```

2. **API Routes Registration**
   ```javascript
   // server.js
   const kycRoutes = require('./routes/kyc');
   app.use('/api/kyc', kycRoutes);
   ```

3. **Environment Configuration**
   ```env
   # .env
   PORT=5001
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   ```

### Frontend Integration

1. **API Service Setup**
   ```javascript
   // services/api.js
   export const kycAPI = {
     submitKYC: (data) => api.post('/kyc/submit', data),
     getKYCStatus: () => api.get('/kyc/status'),
     // ... other endpoints
   };
   ```

2. **Route Configuration**
   ```javascript
   // App.js
   <Route path="/kyc" element={<KYC />} />
   ```

3. **Permission Integration**
   ```javascript
   // AuthContext.js
   const { kycStatus } = user;
   const canAccessFeature = kycStatus === 'approved';
   ```

## 🔧 Development Commands

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database with admin user
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Testing KYC Flow
```bash
# Start services
./start-services.sh

# Test admin login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@usde.com","password":"admin123"}'
```

## 📈 Future Enhancements

### Planned Features

1. **Automated Verification**
   - Integration with external verification services
   - OCR document processing
   - Automated PEP screening

2. **Enhanced Security**
   - Two-factor authentication for KYC submission
   - Document encryption at rest
   - Audit logging for all KYC activities

3. **Compliance Reporting**
   - Automated compliance reports
   - Regulatory submission integration
   - Risk assessment dashboards

4. **Multi-language Support**
   - Chinese language interface
   - Localized compliance requirements
   - Regional regulatory adaptations

## 🛡️ Security Considerations

### Data Protection
- All KYC data encrypted in transit and at rest
- Secure file upload with virus scanning
- Access control based on user roles

### Compliance Monitoring
- Regular compliance audits
- Automated risk scoring
- Real-time sanction list checking

### Privacy Protection
- GDPR compliance for EU users
- Data minimization principles
- Right to data deletion

## 📞 Support

For technical support or compliance questions:
- Create an issue in the repository
- Contact the development team
- Review the compliance documentation

---

*This KYC module is designed to meet Singapore regulatory requirements while providing a user-friendly experience for enterprise customers.* 