# Enterprise Treasury Control Module - API Design & Frontend Integration

## 🏗️ Backend API Design (RESTful)

### 1. Authentication & Company Management

#### Company Operations
```http
# Register parent company
POST /api/companies/parent
Content-Type: application/json
Authorization: Bearer {parent_admin_token}

{
  "companyName": "Acme Corporation",
  "companyCode": "ACME001",
  "companyAddress": "0x123..."
}

# Register subsidiary
POST /api/companies/subsidiary
{
  "companyName": "Acme Asia",
  "companyCode": "ACME002", 
  "companyAddress": "0x456...",
  "parentCompanyId": 1
}

# Get company info
GET /api/companies/{companyId}

# Get subsidiaries
GET /api/companies/{parentCompanyId}/subsidiaries

# Get consolidated balance (parent + all subs)
GET /api/companies/{parentCompanyId}/consolidated-balance?token={tokenAddress}
```

### 2. User Management (Enhanced RBAC)

```http
# Create enterprise user
POST /api/users
{
  "companyId": 1,
  "userAddress": "0x789...",
  "role": "SUPERVISOR", // ADMIN, SUPERVISOR, OPERATOR, OBSERVER
  "email": "john@acme.com"
}

# Get user profile
GET /api/users/me

# Get company users
GET /api/companies/{companyId}/users?offset=0&limit=20

# Update user role
PATCH /api/users/{userId}/role
{
  "newRole": "ADMIN"
}

# KYC approval
POST /api/users/{userId}/kyc-approval
{
  "approved": true
}

# Get pending KYC requests
GET /api/users?kycStatus=PENDING&companyId={companyId}
```

### 3. Payment Management (Multi-Company Support)

#### External Payments
```http
# Create external payment request
POST /api/payments/external
{
  "tokenAddress": "0xA0b86a33E6B3F...",
  "amount": "1000000000000000000",
  "recipient": "0xrecipient...",
  "purpose": "Vendor payment for services"
}

# Get payment requests
GET /api/payments?status=PENDING&companyId={companyId}&offset=0&limit=10

# Approve payment
POST /api/payments/{requestId}/approve

# Reject payment
POST /api/payments/{requestId}/reject
{
  "reason": "Insufficient documentation"
}
```

#### Internal Transfers (Cross-Company)
```http
# Create internal transfer request
POST /api/payments/internal-transfer
{
  "targetCompanyId": 2,
  "tokenAddress": "0xA0b86a33E6B3F...",
  "amount": "500000000000000000",
  "purpose": "Budget allocation to subsidiary"
}

# Get cross-company transfer history
GET /api/payments/internal-transfers?companyId={companyId}&offset=0&limit=10
```

### 4. Withdrawal Management

```http
# Create withdrawal request
POST /api/withdrawals
{
  "tokenAddress": "0xA0b86a33E6B3F...",
  "amount": "2000000000000000000",
  "withdrawalAddress": "0xwithdraw...",
  "purpose": "Emergency funds withdrawal"
}

# Get withdrawal requests
GET /api/withdrawals?status=PENDING&companyId={companyId}

# Approve withdrawal
POST /api/withdrawals/{requestId}/approve

# Reject withdrawal  
POST /api/withdrawals/{requestId}/reject
{
  "reason": "Exceeds daily limit"
}
```

### 5. Treasury Settings & Configuration

```http
# Configure company budget
POST /api/treasury/budget
{
  "companyId": 1,
  "monthlyBudget": "10000000000000000000000",
  "quarterlyBudget": "30000000000000000000000"
}

# Set approval rules
POST /api/treasury/approval-rules
{
  "companyId": 1,
  "rules": [
    {
      "amountThreshold": "1000000000000000000000",
      "requiredApprovals": 2
    },
    {
      "amountThreshold": "5000000000000000000000", 
      "requiredApprovals": 3
    }
  ]
}

# Get treasury settings
GET /api/treasury/settings/{companyId}

# Configure cross-border transfer permissions
PATCH /api/companies/{companyId}/transfer-config
{
  "allowCrossBorderTransfer": true,
  "dailyTransferLimit": "1000000000000000000000"
}
```

### 6. Balance & Asset Management

```http
# Deposit tokens
POST /api/balances/deposit
{
  "tokenAddress": "0xA0b86a33E6B3F...",
  "amount": "5000000000000000000"
}

# Get company balance
GET /api/balances/{companyId}?token={tokenAddress}

# Get multi-currency balance
GET /api/balances/{companyId}/all-tokens

# Get balance history
GET /api/balances/{companyId}/history?token={tokenAddress}&days=30
```

### 7. Reports & Audit Logs

```http
# Get audit logs
GET /api/audit/logs?companyId={companyId}&offset=0&limit=50

# Generate monthly report
GET /api/reports/monthly?companyId={companyId}&year=2024&month=12

# Generate quarterly report  
GET /api/reports/quarterly?companyId={companyId}&year=2024&quarter=4

# Export audit logs (CSV/PDF)
GET /api/audit/export?companyId={companyId}&format=pdf&startDate=2024-01-01&endDate=2024-12-31

# Get budget usage
GET /api/treasury/budget-usage?companyId={companyId}&year=2024&month=12
```

## 🎨 Frontend UI Components & Permission Matrix

### Permission-Based UI Display

| Feature | Admin | Supervisor | Operator | Observer |
|---------|-------|------------|----------|----------|
| **Dashboard Access** | ✅ | ✅ | ✅ | ✅ |
| **View Company Balance** | ✅ | ✅ | ✅ | ✅ |
| **View Subsidiary Balances** | ✅ | ❌ | ❌ | ✅ |
| **Create Payment Request** | ❌ | ✅ | ✅ | ❌ |
| **Approve Payments** | ✅ | ✅ | ❌ | ❌ |
| **Create Internal Transfer** | ❌ | ✅ | ✅ | ❌ |
| **View Audit Logs** | ✅ | ✅ | ❌ | ✅ |
| **Download Reports** | ✅ | ✅ | ❌ | ❌ |
| **Configure Budget** | ✅ | ❌ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ |
| **Register Subsidiaries** | ✅ | ❌ | ❌ | ❌ |

### 1. Enhanced Dashboard (Multi-Company View)

```javascript
// Dashboard component permissions
const DashboardLayout = () => {
  const { userRole, companyId, isParentCompany } = useAuth();
  
  return (
    <div className="dashboard">
      {/* Total Assets - All roles can view */}
      <AssetOverviewCard />
      
      {/* Company Selector - Parent company admin only */}
      {userRole === 'ADMIN' && isParentCompany && (
        <CompanySelector />
      )}
      
      {/* Monthly Payment/Withdrawal Totals */}
      <MonthlyStatsCard />
      
      {/* Pending Approvals - Admin & Supervisor only */}
      {['ADMIN', 'SUPERVISOR'].includes(userRole) && (
        <PendingApprovalsWidget />
      )}
      
      {/* Recent Transactions */}
      <RecentTransactionsTable />
      
      {/* Multi-Company Balance Chart - Parent admin only */}
      {userRole === 'ADMIN' && isParentCompany && (
        <ConsolidatedBalanceChart />
      )}
    </div>
  );
};
```

### 2. Account Management (Admin Only)

```javascript
const AccountManagement = () => {
  const { companyId } = useAuth();
  
  return (
    <div className="account-management">
      <Tabs>
        <TabPanel label="User List">
          <UserListTable companyId={companyId} />
        </TabPanel>
        
        <TabPanel label="Create New User">
          <CreateUserForm />
        </TabPanel>
        
        <TabPanel label="Permission Settings">
          <PermissionMatrix />
        </TabPanel>
        
        <TabPanel label="KYC Approval">
          <KYCApprovalQueue />
        </TabPanel>
        
        <TabPanel label="Subsidiary Management">
          <SubsidiaryManagementPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
};
```

### 3. Payment Approval Center (Admin & Supervisor)

```javascript
const PaymentApprovalCenter = () => {
  return (
    <div className="approval-center">
      <div className="approval-stats">
        <StatCard title="Pending External Payments" count={12} />
        <StatCard title="Pending Internal Transfers" count={5} />
        <StatCard title="Pending Withdrawals" count={3} />
      </div>
      
      <Tabs>
        <TabPanel label="External Payments">
          <PaymentRequestTable type="external" />
        </TabPanel>
        
        <TabPanel label="Internal Transfers">
          <PaymentRequestTable type="internal" />
        </TabPanel>
        
        <TabPanel label="Withdrawals">
          <WithdrawalRequestTable />
        </TabPanel>
        
        <TabPanel label="Batch Actions">
          <BatchApprovalPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
};
```

### 4. Treasury Settings (Admin Only)

```javascript
const TreasurySettings = () => {
  const { companyId } = useAuth();
  
  return (
    <div className="treasury-settings">
      <Tabs>
        <TabPanel label="Budget Settings">
          <BudgetConfigurationForm companyId={companyId} />
        </TabPanel>
        
        <TabPanel label="Approval Rules">
          <ApprovalRulesManager companyId={companyId} />
        </TabPanel>
        
        <TabPanel label="Transfer Permissions">
          <TransferPermissionsConfig />
        </TabPanel>
        
        <TabPanel label="Auto-Trigger Conditions">
          <AutoTriggerSettings />
        </TabPanel>
        
        <TabPanel label="Company Configuration">
          <CompanyConfigPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
};
```

### 5. Multi-Company Balance View

```javascript
const MultiCompanyBalanceView = () => {
  const { parentCompanyId, subsidiaries } = useCompanyContext();
  
  return (
    <div className="multi-company-balance">
      <div className="consolidated-overview">
        <ConsolidatedBalanceCard />
        <BalanceDistributionChart />
      </div>
      
      <div className="company-breakdown">
        <ParentCompanyBalanceCard companyId={parentCompanyId} />
        
        {subsidiaries.map(subsidiary => (
          <SubsidiaryBalanceCard 
            key={subsidiary.id} 
            companyId={subsidiary.id}
            companyName={subsidiary.name}
          />
        ))}
      </div>
      
      <div className="cross-company-transfers">
        <RecentTransfersTable />
        <CreateTransferButton />
      </div>
    </div>
  );
};
```

### 6. Reports & Audit Logs

```javascript
const ReportsAuditLogs = () => {
  const { userRole, companyId } = useAuth();
  
  return (
    <div className="reports-audit">
      <Tabs>
        <TabPanel label="Operation Logs">
          <AuditLogsTable companyId={companyId} />
        </TabPanel>
        
        {/* Download access for Admin & Supervisor only */}
        {['ADMIN', 'SUPERVISOR'].includes(userRole) && (
          <TabPanel label="Financial Reports">
            <ReportGenerator companyId={companyId} />
          </TabPanel>
        )}
        
        <TabPanel label="User Activity Logs">
          <UserActivityTable companyId={companyId} />
        </TabPanel>
        
        {['ADMIN', 'SUPERVISOR'].includes(userRole) && (
          <TabPanel label="Export & Download">
            <ExportPanel companyId={companyId} />
          </TabPanel>
        )}
      </Tabs>
    </div>
  );
};
```

## 🔧 Frontend Implementation Examples

### React Components with Permission Control

#### 1. Permission Hook
```javascript
// hooks/usePermissions.js
export const usePermissions = () => {
  const { user } = useAuth();
  
  const permissions = {
    canViewBalance: ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'OBSERVER'].includes(user.role),
    canCreatePayment: ['SUPERVISOR', 'OPERATOR'].includes(user.role),
    canApprovePayment: ['ADMIN', 'SUPERVISOR'].includes(user.role),
    canManageUsers: user.role === 'ADMIN',
    canConfigureTreasury: user.role === 'ADMIN',
    canViewAuditLogs: ['ADMIN', 'SUPERVISOR', 'OBSERVER'].includes(user.role),
    canDownloadReports: ['ADMIN', 'SUPERVISOR'].includes(user.role),
    canManageSubsidiaries: user.role === 'ADMIN' && user.companyId === user.parentCompanyId,
    canViewConsolidatedBalance: user.role === 'ADMIN' && user.isParentCompany
  };
  
  return permissions;
};
```

#### 2. Protected Route Component
```javascript
// components/ProtectedRoute.jsx
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  if (requiredRole && !requiredRole.includes(user.role)) {
    return <AccessDenied message="Insufficient role permissions" />;
  }
  
  if (requiredPermission && !permissions[requiredPermission]) {
    return <AccessDenied message="Access denied for this feature" />;
  }
  
  return children;
};
```

#### 3. Multi-Company Payment Form
```javascript
// components/PaymentForm.jsx
const PaymentForm = () => {
  const { companyId, subsidiaries } = useAuth();
  const [paymentType, setPaymentType] = useState('external');
  const [formData, setFormData] = useState({
    tokenAddress: '',
    amount: '',
    recipient: '',
    targetCompanyId: '',
    purpose: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const endpoint = paymentType === 'external' 
      ? '/api/payments/external' 
      : '/api/payments/internal-transfer';
      
    const payload = paymentType === 'external'
      ? {
          tokenAddress: formData.tokenAddress,
          amount: formData.amount,
          recipient: formData.recipient,
          purpose: formData.purpose
        }
      : {
          targetCompanyId: formData.targetCompanyId,
          tokenAddress: formData.tokenAddress,
          amount: formData.amount,
          purpose: formData.purpose
        };
    
    try {
      await api.post(endpoint, payload);
      toast.success('Payment request created successfully');
      // Reset form and refresh
    } catch (error) {
      toast.error('Failed to create payment request');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group">
        <label>Payment Type</label>
        <select 
          value={paymentType} 
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="external">External Payment</option>
          {subsidiaries.length > 0 && (
            <option value="internal">Internal Transfer</option>
          )}
        </select>
      </div>
      
      {paymentType === 'internal' && (
        <div className="form-group">
          <label>Target Company</label>
          <select 
            value={formData.targetCompanyId}
            onChange={(e) => setFormData({...formData, targetCompanyId: e.target.value})}
            required
          >
            <option value="">Select Company</option>
            {subsidiaries.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="form-group">
        <label>Token</label>
        <TokenSelector 
          value={formData.tokenAddress}
          onChange={(token) => setFormData({...formData, tokenAddress: token})}
        />
      </div>
      
      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          step="0.000000000000000001"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          required
        />
      </div>
      
      {paymentType === 'external' && (
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => setFormData({...formData, recipient: e.target.value})}
            placeholder="0x..."
            required
          />
        </div>
      )}
      
      <div className="form-group">
        <label>Purpose</label>
        <textarea
          value={formData.purpose}
          onChange={(e) => setFormData({...formData, purpose: e.target.value})}
          required
        />
      </div>
      
      <button type="submit" className="btn-primary">
        Create Payment Request
      </button>
    </form>
  );
};
```

#### 4. Consolidated Balance Dashboard
```javascript
// components/ConsolidatedBalanceDashboard.jsx
const ConsolidatedBalanceDashboard = () => {
  const { parentCompanyId } = useAuth();
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [balanceData, setBalanceData] = useState(null);
  
  useEffect(() => {
    fetchConsolidatedBalance();
  }, [selectedToken, parentCompanyId]);
  
  const fetchConsolidatedBalance = async () => {
    try {
      const response = await api.get(
        `/api/companies/${parentCompanyId}/consolidated-balance?token=${selectedToken}`
      );
      setBalanceData(response.data);
    } catch (error) {
      console.error('Failed to fetch consolidated balance:', error);
    }
  };
  
  return (
    <div className="consolidated-balance-dashboard">
      <div className="dashboard-header">
        <h2>Consolidated Balance Overview</h2>
        <TokenSelector value={selectedToken} onChange={setSelectedToken} />
      </div>
      
      <div className="balance-cards">
        <BalanceCard 
          title="Total Balance" 
          amount={balanceData?.totalBalance}
          token={selectedToken}
        />
        <BalanceCard 
          title="Available" 
          amount={balanceData?.totalAvailable}
          token={selectedToken}
          status="available"
        />
        <BalanceCard 
          title="Locked/Staking" 
          amount={balanceData?.totalLocked + balanceData?.totalStaking}
          token={selectedToken}
          status="locked"
        />
        <BalanceCard 
          title="Pending" 
          amount={balanceData?.totalPending}
          token={selectedToken}
          status="pending"
        />
      </div>
      
      <div className="balance-distribution">
        <BalanceDistributionChart 
          parentCompanyId={parentCompanyId}
          token={selectedToken}
        />
      </div>
      
      <div className="recent-transfers">
        <h3>Recent Cross-Company Transfers</h3>
        <RecentTransfersTable companyId={parentCompanyId} />
      </div>
    </div>
  );
};
```

## 🛡️ Security & Validation

### API Security Middleware
```javascript
// middleware/auth.js
const validateCompanyAccess = (req, res, next) => {
  const { companyId } = req.params;
  const { user } = req.auth;
  
  // Check if user belongs to the company or parent company
  if (user.companyId !== parseInt(companyId)) {
    // Check if user is parent company admin
    if (user.role !== 'ADMIN' || user.companyId !== getParentCompanyId(companyId)) {
      return res.status(403).json({ error: 'Access denied to company data' });
    }
  }
  
  next();
};

const validateRole = (allowedRoles) => {
  return (req, res, next) => {
    const { user } = req.auth;
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }
    
    if (user.kycStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'KYC approval required' });
    }
    
    next();
  };
};
```

### Smart Contract Integration
```javascript
// services/contractService.js
class TreasuryContractService {
  constructor(web3, contractAddress, abi) {
    this.web3 = web3;
    this.contract = new web3.eth.Contract(abi, contractAddress);
  }
  
  async createPaymentRequest(userAddress, tokenAddress, amount, recipient, purpose) {
    return await this.contract.methods
      .createPaymentRequest(tokenAddress, amount, recipient, purpose)
      .send({ from: userAddress });
  }
  
  async createInternalTransfer(userAddress, targetCompanyId, tokenAddress, amount, purpose) {
    return await this.contract.methods
      .createInternalTransferRequest(targetCompanyId, tokenAddress, amount, purpose)
      .send({ from: userAddress });
  }
  
  async approvePaymentRequest(userAddress, requestId) {
    return await this.contract.methods
      .approvePaymentRequest(requestId)
      .send({ from: userAddress });
  }
  
  async getCompanyBalance(companyId, tokenAddress) {
    return await this.contract.methods
      .getCompanyBalance(companyId, tokenAddress)
      .call();
  }
  
  async getConsolidatedBalance(parentCompanyId, tokenAddress) {
    return await this.contract.methods
      .getConsolidatedBalance(parentCompanyId, tokenAddress)
      .call();
  }
}
```

## 📊 Key Features Summary

### ✅ Enhanced Multi-Company Features:
1. **Hierarchical Company Structure**: Parent company can manage multiple subsidiaries
2. **Cross-Company Transfers**: Internal fund transfers with approval workflow
3. **Consolidated Balance View**: Parent company sees aggregated balances
4. **Company-Specific Permissions**: Role-based access within company boundaries
5. **Centralized Treasury Management**: Parent company controls subsidiary settings

### ✅ Preserved Original RBAC:
1. **4-Tier Role System**: Admin, Supervisor, Operator, Observer
2. **Granular Permissions**: Feature-level access control
3. **KYC Integration**: Identity verification workflow
4. **Audit Trail**: Complete operation logging
5. **Budget Management**: Monthly/quarterly spending limits

### ✅ New API Endpoints:
- Company registration and management
- Cross-company transfer requests
- Consolidated balance queries
- Multi-company audit logs
- Subsidiary permission management

This upgrade maintains backward compatibility while adding powerful multi-company capabilities to your existing Treasury Control Module. The permission system ensures security across company boundaries while providing the flexibility needed for enterprise operations.