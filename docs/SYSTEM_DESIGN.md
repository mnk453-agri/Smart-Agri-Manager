# Smart Agri Manager
## System Design Document — Version 1.0

**Project status:** Active development  
**Primary market:** Pakistan  
**Currency:** PKR  
**Land measurement:** Acres  
**Languages:** English and Urdu  

---

# 1. Project Purpose

Smart Agri Manager is a cloud-based agricultural management application designed for landowners, joint owners, family members, managers, and farmers.

The application will help users record and manage:

- Farm workspaces
- Owners and authorized users
- Lands
- Farmers
- Land assignments
- Crop cycles
- Purchase invoices
- General expenses
- Harvests and sales
- Farmer advances
- Supplier balances
- Buyer receivables
- Farmer settlements
- Crop profit and loss
- Financial and operational reports

The application must remain simple enough for users with limited technical knowledge while maintaining reliable financial and agricultural records.

---

# 2. Core Design Principles

## 2.1 Record Every Transaction Only Once

The user must enter each transaction only once.

From that original entry, the system will automatically update all related records, including:

- Crop expenses
- Crop income
- Farmer ledger
- Supplier ledger
- Buyer ledger
- Workspace account balance
- Purchase reports
- Sales reports
- Farmer settlement
- Crop profit or loss
- Dashboard statistics

The application must never require the user to enter the same transaction separately into multiple ledgers or reports.

---

## 2.2 Event-Driven, Not Task-Driven

Smart Agri Manager is primarily a recording and management system, not a fixed daily-task application.

Whenever an activity occurs, the user records it.

Examples:

- Fertilizer purchased
- Diesel purchased
- Labour paid
- Crop harvested
- Produce sold
- Farmer advance paid
- Supplier payment made

There is no requirement to create daily or fixed-date tasks.

Optional reminders may be introduced later, but they will not be required for normal application use.

---

## 2.3 Dashboard Shows the Current Position

The dashboard must answer:

> Where does the farm stand as of today?

The dashboard will show live, current information such as:

- Total land
- Assigned land
- Available land
- Active farmers
- Active crop cycles
- Standing crop area
- Current supplier balances
- Current buyer receivables
- Current farmer advances
- Current account balances
- Recent activities

Historical or period-based analysis belongs in Reports, not on the main dashboard.

---

## 2.4 Reports Show Historical Analysis

Reports will answer:

> What happened during a selected period?

Reports may be filtered by:

- As of today
- Current crop cycle
- Current season
- Current year
- Custom date range
- Workspace
- Land
- Farmer
- Crop
- Supplier
- Buyer

---

## 2.5 Simple User Experience

The application must:

- Use farming language instead of technical accounting language
- Show only necessary fields
- Avoid repeated typing
- Use dropdowns and saved master data
- Use large buttons suitable for mobile phones
- Clearly identify required fields
- Provide sensible default values
- Prevent accidental deletion
- Show clear success and error messages
- Support English and Urdu
- Work comfortably for users with limited technical knowledge

---

## 2.6 Multiple Workspaces

A workspace represents an independent agricultural business, farm operation, or access boundary.

One workspace may contain:

- One land
- Multiple lands
- One owner
- Multiple joint owners
- Family members
- Managers
- Farmers

A single person may belong to multiple workspaces using one login account.

Example:

- 50-Acre Farm — Owner
- 70-Acre Farm — Owner
- Joint Family Farm — Manager

Records from one workspace must never be visible inside another workspace unless the user has an authorized membership in both.

---

## 2.7 Multiple Owners

A workspace may have more than one owner.

Example:

- Brother 1 — Owner
- Brother 2 — Owner
- Brother 3 — Owner

Each owner uses an individual login account.

Owners must not share one password.

All authorized owners may manage the same workspace according to their permissions.

---

## 2.8 Role-Based Access

Version 1 will support these primary roles:

### Owner

Full control over the workspace, including:

- Lands
- Farmers
- Crops
- Purchases
- Expenses
- Sales
- Settlements
- Reports
- Users
- Workspace settings

### Manager

Operational access based on permissions granted by an owner.

A manager may record:

- Purchases
- Expenses
- Crops
- Harvests
- Sales
- Farmer advances

A manager cannot remove the last owner or take ownership without authorization.

### Farmer

A---

# 3. System Architecture

## 3.1 Technology Stack

Smart Agri Manager Version 1 will use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- GitHub for source control

The application will initially run as a responsive web application and must work well on:

- Desktop computers
- Laptops
- Tablets
- Mobile phones

---

## 3.2 Main Data Structure

The core system will use these top-level collections:

- users
- organizations
- organizationMemberships
- lands
- farmers
- landAssignments
- crops
- suppliers
- buyers
- workspaceAccounts
- inventoryItems
- units
- purchaseInvoices
- purchaseInvoiceItems
- generalExpenses
- harvests
- sales
- farmerAdvances
- farmerSettlements
- supplierPayments
- buyerReceipts
- activityLogs

Every business collection must include:

```text
organizationId