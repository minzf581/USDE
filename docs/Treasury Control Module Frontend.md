# Enterprise Treasury Control Module - Frontend Update Guide

## 🆕 What's New in Version 2.0

### **Multi-Company Architecture Support**
The Enterprise Treasury Control Module now supports parent-subsidiary company structures, enabling enterprise-level financial management across multiple entities.

---

## 🏢 New Features Overview

### **1. Company Management Hub**
- **Parent Company Registration**: Create and manage parent company entities
- **Subsidiary Management**: Add, configure, and monitor subsidiary companies
- **Hierarchical Permissions**: Control access across company boundaries
- **Consolidated Reporting**: View aggregated financial data across all entities

### **2. Enhanced User Management**
- **Multi-Company User Creation**: Assign users to specific companies
- **Cross-Company Visibility**: Parent company admins can view subsidiary users
- **Company-Scoped Roles**: Role permissions now apply within company boundaries
- **Bulk User Operations**: Manage users across multiple subsidiaries

### **3. Advanced Financial Controls**
- **Internal Transfer System**: Move funds between parent and subsidiary companies
- **Cross-Company Budget Management**: Set and monitor budgets for each entity
- **Consolidated Balance View**: Real-time overview of all company balances
- **Multi-Entity Approval Workflows**: Approval rules that span company boundaries

---

## 🎯 Updated User Interface Components

### **A. Enhanced Dashboard (All Users)**

#### **New Dashboard Features:**
```
┌─────────────────────────────────────────────────────┐
│ 🏢 COMPANY SELECTOR (Parent Company Admins Only)   │
├─────────────────────────────────────────────────────┤
│ [Parent Company ▼] [All Subsidiaries ▼]            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💰 CONSOLIDATED BALANCE OVERVIEW                   │
├─────────────────────────────────────────────────────┤
│ Total Across All Companies: $12,450,000            │
│ ├─ Parent Company: $8,200,000                      │
│ ├─ Subsidiary A: $2,800,000                        │
│ └─ Subsidiary B: $1,450,000                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔄 RECENT CROSS-COMPANY TRANSFERS                  │
├─────────────────────────────────────────────────────┤
│ Parent → Sub A    $500,000 USDC    [Completed]     │
│ Sub B → Parent    $200,000 USDT    [Pending]       │
│ Parent → Sub B    $150,000 DAI     [Approved]      │
└─────────────────────────────────────────────────────┘
```

### **B. Company Management Panel (Admin Only)**

#### **Navigation Enhancement:**
```
Profile Settings > Treasury Settings > Company Management
```

#### **New Company Management Interface:**

```
┌─────────────────────────────────────────────────────┐
│ 🏢 COMPANY MANAGEMENT                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [📋 Company Overview] [➕ Add Subsidiary]          │
│ [👥 Multi-Company Users] [⚙️ Global Settings]     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🏛️ PARENT COMPANY                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Acme Corporation (ACME001)                      │ │
│ │ 📍 0x1234...5678                               │ │
│ │ 💰 Total Assets: $8,200,000                    │ │
│ │ 👥 Users: 12                                   │ │
│ │ [⚙️ Configure] [📊 View Details]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🏢 SUBSIDIARIES (2)                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ├─ Acme Asia Pacific (ACME002)                 │ │
│ │ │  📍 0x2345...6789                           │ │
│ │ │  💰 Assets: $2,800,000                      │ │
│ │ │  👥 Users: 8                                │ │
│ │ │  [⚙️ Configure] [📊 Details] [🔄 Transfer] │ │
│ │ │                                             │ │
│ │ └─ Acme Europe (ACME003)                      │ │
│ │    📍 0x3456...7890                           │ │
│ │    💰 Assets: $1,450,000                      │ │
│ │    👥 Users: 5                                │ │
│ │    [⚙️ Configure] [📊 Details] [🔄 Transfer]  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### **C. Enhanced User Creation Form**

#### **Updated User Management Interface:**

```
┌─────────────────────────────────────────────────────┐
│ 👥 CREATE NEW USER                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🏢 Company Assignment                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Select Company: [Acme Corporation     ▼]        │ │
│ │                                                 │ │
│ │ Available Companies:                            │ │
│ │ ✓ Acme Corporation (Parent)                     │ │
│ │ ├─ Acme Asia Pacific                           │ │
│ │ └─ Acme Europe                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 👤 User Information                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Wallet Address: [0x...]                         │ │
│ │ Email Address:  [user@company.com]              │ │
│ │ Role:          [Treasury Supervisor  ▼]         │ │
│ │                                                 │ │
│ │ Available Roles:                                │ │
│ │ • Enterprise Admin     (Full access)           │ │
│ │ • Treasury Supervisor  (Approve payments)      │ │
│ │ • Treasury Operator    (Create requests)       │ │
│ │ • Observer            (Read-only)              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🔐 Initial Permissions                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☐ Allow Cross-Company Transfers                 │ │
│ │ ☐ View Subsidiary Data (Admin only)             │ │
│ │ ☐ Manage Company Settings                       │ │
│ │ ☐ Export Financial Reports                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel] [Create User] [Create & Add Another]       │
└─────────────────────────────────────────────────────┘
```

### **D. Add Subsidiary Form**

#### **New Subsidiary Registration Interface:**

```
┌─────────────────────────────────────────────────────┐
│ ➕ REGISTER NEW SUBSIDIARY                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🏢 Company Details                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Company Name:     [                           ] │ │
│ │ Company Code:     [ACME004                    ] │ │
│ │ Wallet Address:   [0x...                      ] │ │
│ │ Parent Company:   [Acme Corporation] (Fixed)    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 💰 Initial Configuration                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Monthly Budget:      [$100,000              ]   │ │
│ │ Quarterly Budget:    [$300,000              ]   │ │
│ │ Daily Transfer Limit: [$10,000               ]   │ │
│ │                                                 │ │
│ │ ☐ Allow Cross-Border Transfers                  │ │
│ │ ☐ Enable Auto-Approval (< $1,000)              │ │
│ │ ☐ Require Parent Approval for Large Transfers   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🔐 Approval Rules                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Amount Threshold    Required Approvals          │ │
│ │ $0 - $1,000        [1 ▼]                       │ │
│ │ $1,000 - $10,000   [2 ▼]                       │ │
│ │ $10,000+           [3 ▼]                       │ │
│ │                                                 │ │
│ │ [+ Add Custom Rule]                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 👤 Initial Admin User                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Admin Wallet:    [0x...                       ] │ │
│ │ Admin Email:     [admin@subsidiary.com        ] │ │
│ │ ☐ Send invitation email                         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel] [Register Subsidiary]                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Enhanced Payment & Transfer System

### **Updated Payment Creation Interface:**

```
┌─────────────────────────────────────────────────────┐
│ 💸 CREATE PAYMENT REQUEST                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🎯 Payment Type                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ◉ External Payment     ○ Internal Transfer       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🏢 Company Selection (Internal Transfer Only)      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ From: [Current Company] (Auto-selected)          │ │
│ │ To:   [Select Subsidiary ▼]                     │ │
│ │                                                 │ │
│ │ Available Recipients:                           │ │
│ │ ├─ Acme Asia Pacific                           │ │
│ │ ├─ Acme Europe                                 │ │
│ │ └─ Acme Corporation (Parent)                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 💰 Payment Details                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Token:      [USDC ▼] Balance: 500,000          │ │
│ │ Amount:     [                               ]   │ │
│ │ Recipient:  [0x... (External only)         ]   │ │
│ │ Purpose:    [Budget allocation to subsidiary]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ⚠️ Approval Requirements                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Amount: $50,000 requires 2 approvals            │ │
│ │ Eligible Approvers:                             │ │
│ │ • Treasury Supervisor (2 available)             │ │
│ │ • Enterprise Admin (1 available)                │ │
│ │                                                 │ │
│ │ ⏱️ Estimated approval time: 2-4 hours          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel] [Create Request]                           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Enhanced Approval Center Interface

### **Multi-Company Approval Dashboard:**

```
┌─────────────────────────────────────────────────────┐
│ ✅ PAYMENT APPROVAL CENTER                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📈 Approval Statistics                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Pending External: 8    Pending Internal: 3      │ │
│ │ Pending Withdrawals: 2  Overdue: 1              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🏢 Company Filter                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [All Companies ▼] [All Types ▼] [All Status ▼] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📋 PENDING REQUESTS                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ #2024001 🔄 Internal Transfer                   │ │
│ │ Acme Corp → Acme Asia    $50,000 USDC          │ │
│ │ 👤 Requested by: treasury@acme.com              │ │
│ │ ⏰ 2 hours ago    ✅ 1/2 approvals             │ │
│ │ 📝 "Q4 budget allocation"                       │ │
│ │ [✅ Approve] [❌ Reject] [📋 Details]          │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ #2024002 💸 External Payment                    │ │
│ │ Acme Asia → External     $25,000 USDT          │ │
│ │ 👤 Requested by: finance@acme-asia.com          │ │
│ │ ⏰ 4 hours ago    ✅ 0/2 approvals             │ │
│ │ 📝 "Vendor payment - Marketing services"        │ │
│ │ [✅ Approve] [❌ Reject] [📋 Details]          │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ #2024003 💰 Withdrawal                          │ │
│ │ Acme Europe → Wallet     $15,000 DAI           │ │
│ │ 👤 Requested by: cfo@acme-europe.com            │ │
│ │ ⏰ 6 hours ago    ⚠️ OVERDUE                   │ │
│ │ 📝 "Emergency operational funds"                │ │
│ │ [✅ Approve] [❌ Reject] [📋 Details]          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🔧 Batch Actions                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☐ Select All   [Bulk Approve] [Bulk Reject]     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Guidelines for Developers

### **1. Component Updates Required**

#### **A. Dashboard Component**
```javascript
// Add company selector for parent company admins
const CompanySelector = () => {
  const { isParentCompany, subsidiaries } = useCompanyContext();
  
  if (!isParentCompany) return null;
  
  return (
    <div className="company-selector">
      <select onChange={handleCompanyChange}>
        <option value="all">All Companies</option>
        <option value={parentCompanyId}>Parent Company</option>
        {subsidiaries.map(sub => (
          <option key={sub.id} value={sub.id}>{sub.name}</option>
        ))}
      </select>
    </div>
  );
};
```

#### **B. User Creation Form**
```javascript
// Enhanced user form with company selection
const CreateUserForm = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const { availableCompanies } = useCompanyContext();
  
  return (
    <form onSubmit={handleCreateUser}>
      <CompanySelectField 
        companies={availableCompanies}
        value={selectedCompany}
        onChange={setSelectedCompany}
        required
      />
      {/* Existing form fields */}
    </form>
  );
};
```

#### **C. Payment Form Enhancement**
```javascript
// Add internal transfer option
const PaymentForm = () => {
  const [paymentType, setPaymentType] = useState('external');
  const [targetCompany, setTargetCompany] = useState('');
  
  return (
    <form>
      <PaymentTypeSelector 
        value={paymentType}
        onChange={setPaymentType}
        options={['external', 'internal']}
      />
      
      {paymentType === 'internal' && (
        <CompanySelectField 
          companies={availableTargetCompanies}
          value={targetCompany}
          onChange={setTargetCompany}
          label="Transfer To"
        />
      )}
      
      {/* Rest of form */}
    </form>
  );
};
```

### **2. New API Endpoints to Integrate**

```javascript
// Company management endpoints
const companyAPI = {
  // Get available companies for user
  getAvailableCompanies: () => api.get('/api/companies/available'),
  
  // Register new subsidiary
  registerSubsidiary: (data) => api.post('/api/companies/subsidiary', data),
  
  // Get consolidated balance
  getConsolidatedBalance: (parentId, token) => 
    api.get(`/api/companies/${parentId}/consolidated-balance?token=${token}`),
  
  // Configure subsidiary settings
  configureSubsidiary: (companyId, config) => 
    api.patch(`/api/companies/${companyId}/config`, config)
};

// Enhanced user management
const userAPI = {
  // Create user with company assignment
  createUser: (userData) => api.post('/api/users', {
    ...userData,
    companyId: userData.selectedCompany
  }),
  
  // Get users across companies (admin only)
  getMultiCompanyUsers: (parentCompanyId) => 
    api.get(`/api/users/multi-company/${parentCompanyId}`)
};

// Internal transfer endpoints
const transferAPI = {
  // Create internal transfer
  createInternalTransfer: (transferData) => 
    api.post('/api/payments/internal-transfer', transferData),
  
  // Get cross-company transfer history
  getTransferHistory: (companyId) => 
    api.get(`/api/payments/internal-transfers?companyId=${companyId}`)
};
```

### **3. State Management Updates**

```javascript
// Enhanced company context
const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [isParentCompany, setIsParentCompany] = useState(false);
  
  const contextValue = {
    currentCompany,
    subsidiaries,
    isParentCompany,
    availableCompanies: isParentCompany ? [currentCompany, ...subsidiaries] : [currentCompany],
    switchCompany: setCurrentCompany,
    refreshSubsidiaries: fetchSubsidiaries
  };
  
  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};
```

---

## 🚀 Migration Steps for Existing Users

### **For System Administrators:**

1. **Update Smart Contract**: Deploy the new multi-company contract
2. **Migrate Existing Data**: Convert current single-company data to parent company structure
3. **Update Frontend**: Deploy new UI components with multi-company support
4. **User Training**: Provide training on new multi-company features

### **For Enterprise Admins:**

1. **Review Company Structure**: Determine subsidiary organization
2. **Register Subsidiaries**: Use new subsidiary registration form
3. **Migrate Users**: Assign existing users to appropriate companies
4. **Configure Permissions**: Set up cross-company transfer rules
5. **Test Workflows**: Verify approval processes work across companies

### **For End Users:**

1. **No Action Required**: Existing users will be automatically assigned to parent company
2. **Updated Interface**: Familiarize with new company selector (if applicable)
3. **New Transfer Options**: Internal transfers now available between companies

---

## 📞 Support & Documentation

### **Need Help?**
- 📚 **Full Documentation**: Available in the Treasury Settings → Help section
- 💬 **Support Chat**: Contact technical support through the platform
- 🎥 **Video Tutorials**: Step-by-step guides for new features
- 📧 **Email Support**: technical-support@treasury-platform.com

### **What's Next?**
Version 2.1 will include:
- **Advanced Reporting**: Cross-company financial analytics
- **API Webhooks**: Real-time notifications for multi-company events
- **Mobile App**: Native mobile support for multi-company management
- **Compliance Tools**: Enhanced audit trails for regulatory reporting

---

*This update maintains backward compatibility while adding powerful multi-company capabilities. All existing workflows will continue to function as before, with new features available for enterprises requiring multi-entity management.*