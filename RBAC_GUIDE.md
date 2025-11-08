# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the complete RBAC (Role-Based Access Control) system for the clinic management application, supporting 10 distinct user roles with granular permissions.

---

## 🎭 User Roles

### Global Access Roles

These roles have access to **all clinics**:

1. **Admin** - Full system access and configuration
2. **Director** - Management oversight and reporting across all clinics
3. **Operational** - Cross-clinic operational management

### Clinic-Specific Roles

These roles are restricted to **assigned clinics only**:

4. **Doctor** - Clinical operations and patient care
5. **Nurse** - Patient care and vitals management
6. **Reception** - Front desk operations and scheduling
7. **Finance** - Billing, payments, and financial reporting
8. **Laboratory** - Lab orders and results
9. **Radiology** - Imaging orders and results
10. **Pharmacy** - Medication dispensing and inventory

---

## 📋 Permission System

### Resources

The system defines the following resources:

**Patient Management**

- `patient` - Patient records
- `patient_photo` - Patient photos
- `patient_passport` - Passport/ID scans (highly restricted)

**Clinical**

- `ehr` - Electronic Health Records
- `consultation` - Consultation notes
- `prescription` - Prescriptions
- `lab_order` - Laboratory orders
- `radiology_order` - Radiology orders

**Administrative**

- `appointment` - Appointments
- `user` - User management
- `clinic` - Clinic settings
- `template` - Document templates

**Financial**

- `invoice` - Invoices
- `payment` - Payments
- `pricelist` - Price lists
- `insurance_claim` - Insurance claims
- `financial_report` - Financial reports

**Laboratory**

- `lab_result` - Lab results
- `lab_inventory` - Lab supplies

**Radiology**

- `radiology_result` - Radiology results
- `radiology_image` - Radiology images

**Pharmacy**

- `medication` - Medications
- `pharmacy_inventory` - Pharmacy inventory
- `dispensing` - Medication dispensing

**System**

- `audit_log` - Audit logs
- `system_settings` - System configuration

### Actions

Available actions on resources:

- `create` - Create new records
- `read` - View records
- `update` - Modify existing records
- `delete` - Remove records
- `read_sensitive` - Access sensitive data (passport/ID scans)
- `approve` - Approve requests
- `export` - Export data
- `print` - Print documents

### Permission Scopes

- `own` - User's own resources only
- `clinic` - Clinic-specific (assigned clinics)
- `global` - All clinics

---

## 🔐 Permission Matrix

### Admin Role

```typescript
Full access to ALL resources with ALL actions across ALL clinics
Scope: global
```

### Director Role

```typescript
Resources: All (Read-only, except Clinic and Pricelist updates)
- Can view all patient and clinical data
- Can manage clinic settings
- Can access financial reports
- Can view audit logs
Scope: global
```

### Operational Role

```typescript
Resources: Patient,
  Appointment,
  Clinic(read - only),
  Template,
  User(read - only);
Actions: Read, Update, Create(appointments);
Scope: global;
```

### Doctor Role

```typescript
Resources: Patient, EHR, Consultation, Prescription, Lab/Radiology Orders & Results
Actions: Create, Read, Update
Scope: clinic (assigned clinics only)
```

### Nurse Role

```typescript
Resources: Patient, EHR, Consultation (read-only), Prescription (read-only)
Actions: Read, Update (EHR vitals)
Scope: clinic
```

### Reception Role

```typescript
Resources: Patient, Appointment, Invoice, Payment;
Actions: Create, Read, Update(patients / appointments), Delete(appointments);
Scope: clinic;
```

### Finance Role

```typescript
Resources: Patient (read-only), Invoice, Payment, Pricelist, Insurance Claims, Financial Reports
Actions: Create, Read, Update
Special: Can access patient_passport (sensitive data)
Scope: clinic
```

### Laboratory Role

```typescript
Resources: Patient (read-only), Lab Orders, Lab Results, Lab Inventory
Actions: Read, Update, Create (results)
Scope: clinic
```

### Radiology Role

```typescript
Resources: Patient (read-only), Radiology Orders, Results, Images
Actions: Read, Update, Create (results/images)
Scope: clinic
```

### Pharmacy Role

```typescript
Resources: Patient (read-only), Prescription (read-only), Medications, Pharmacy Inventory, Dispensing
Actions: Read, Update, Create (dispensing records)
Scope: clinic
```

---

## 🛠️ Implementation

### Core Files

#### 1. `lib/permissions.ts`

Defines all permissions and the permission matrix.

```typescript
import { hasPermission, getPermissionScope } from "@/lib/permissions";

// Check if user has permission
const canCreate = hasPermission(
  UserRole.Doctor,
  Resource.Patient,
  Action.Create
);

// Get permission scope
const scope = getPermissionScope(UserRole.Doctor, Resource.Patient);
// Returns: "clinic"
```

#### 2. `lib/rbac.ts`

RBAC middleware functions for authentication and authorization.

```typescript
import {
  requireAuth,
  requirePermission,
  requireClinicAccess,
} from "@/lib/rbac";

// In API route
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const user = authResult.user;
  // ... proceed with logic
}
```

#### 3. `lib/apiHelpers.ts`

Wrapper functions to simplify RBAC in API routes.

```typescript
import { withPermission, successResponse } from "@/lib/apiHelpers";

// Simple permission-protected route
export const GET = withPermission(
  Resource.Patient,
  Action.Read,
  async (req, user) => {
    const patients = await Patient.find({});
    return successResponse({ patients });
  }
);
```

---

## 📝 Usage Examples

### Example 1: Basic Authentication

```typescript
import { withAuth, successResponse } from "@/lib/apiHelpers";

export const GET = withAuth(async (req, user) => {
  // User is authenticated
  return successResponse({ message: "Hello " + user.email });
});
```

### Example 2: Role-Based Access

```typescript
import { withRole } from "@/lib/apiHelpers";
import { UserRole } from "@/lib/dbTypes";

// Only Admin and Director can access
export const GET = withRole(
  [UserRole.Admin, UserRole.Director],
  async (req, user) => {
    // Fetch admin data
    return successResponse({ data: "Admin data" });
  }
);
```

### Example 3: Permission-Based Access

```typescript
import { withPermission, successResponse } from "@/lib/apiHelpers";
import { Resource, Action } from "@/lib/permissions";

export const POST = withPermission(
  Resource.Patient,
  Action.Create,
  async (req, user) => {
    const body = await req.json();
    const patient = await Patient.create(body);
    return successResponse({ patient }, 201);
  }
);
```

### Example 4: Clinic Access Check

```typescript
import { withClinicAccess, getQueryParam } from "@/lib/apiHelpers";

export const GET = withClinicAccess(
  (req) => getQueryParam(req, "clinicId") || "",
  async (req, user, context) => {
    // User has access to context.clinicId
    const patients = await Patient.find({
      primaryClinic: context.clinicId,
    });
    return successResponse({ patients });
  }
);
```

### Example 5: Permission + Clinic Access

```typescript
import { withPermissionAndClinic } from "@/lib/apiHelpers";
import { Resource, Action } from "@/lib/permissions";

export const POST = withPermissionAndClinic(
  Resource.Patient,
  Action.Create,
  (req) => getQueryParam(req, "clinicId") || "",
  async (req, user, context) => {
    // User has permission AND clinic access
    const body = await req.json();
    const patient = await Patient.create({
      ...body,
      primaryClinic: context.clinicId,
    });
    return successResponse({ patient }, 201);
  }
);
```

### Example 6: Sensitive Data Access

```typescript
import { withSensitiveDataAccess } from "@/lib/apiHelpers";

// Only Admin, Director, Finance can access
export const GET = withSensitiveDataAccess(async (req, user) => {
  const patient = await Patient.findById(patientId).select("+passportScan"); // Include sensitive field

  return successResponse({ patient });
});
```

### Example 7: With Audit Logging

```typescript
import { withAuditLog } from "@/lib/apiHelpers";
import { Resource, Action } from "@/lib/permissions";

export const PUT = withAuditLog(
  Resource.Patient,
  Action.Update,
  async (req, user, context) => {
    // Update logic
    // Audit log created automatically on success
    return successResponse({ updated: true });
  }
);
```

### Example 8: Query Filtering by Clinic Access

```typescript
import { buildClinicFilter, getUserClinicIds } from "@/lib/rbac";

export const GET = withAuth(async (req, user) => {
  await dbConnect();

  // Automatically filters based on user's clinic access
  const query = {
    isActive: true,
    ...buildClinicFilter(user), // Adds clinic filter
  };

  const patients = await Patient.find(query);
  return successResponse({ patients });
});
```

---

## 🔒 Security Best Practices

### 1. Always Authenticate

```typescript
// ❌ Bad - No authentication
export async function GET(req: NextRequest) {
  const patients = await Patient.find({});
  return NextResponse.json({ patients });
}

// ✅ Good - With authentication
export const GET = withAuth(async (req, user) => {
  const patients = await Patient.find({});
  return successResponse({ patients });
});
```

### 2. Check Permissions Explicitly

```typescript
// ❌ Bad - Only role check
export const DELETE = withRole([UserRole.Admin], async (req, user) => {
  await Patient.deleteMany({});
  return successResponse({ deleted: true });
});

// ✅ Good - Permission check
export const DELETE = withPermission(
  Resource.Patient,
  Action.Delete,
  async (req, user) => {
    // More granular control
    await Patient.findByIdAndDelete(id);
    return successResponse({ deleted: true });
  }
);
```

### 3. Verify Clinic Access

```typescript
// ❌ Bad - No clinic check
export const GET = withAuth(async (req, user) => {
  const clinicId = getQueryParam(req, "clinicId");
  const patients = await Patient.find({ primaryClinic: clinicId });
  return successResponse({ patients });
});

// ✅ Good - Verify clinic access
export const GET = withClinicAccess(
  (req) => getQueryParam(req, "clinicId") || "",
  async (req, user, context) => {
    const patients = await Patient.find({
      primaryClinic: context.clinicId,
    });
    return successResponse({ patients });
  }
);
```

### 4. Protect Sensitive Data

```typescript
// ❌ Bad - Always include sensitive data
const patient = await Patient.findById(id);

// ✅ Good - Exclude by default, require special permission
const patient = await Patient.findById(id).select("-passportScan"); // Excluded

// Only with proper permission:
export const GET = withSensitiveDataAccess(async (req, user) => {
  const patient = await Patient.findById(id).select("+passportScan"); // Explicitly include
  return successResponse({ patient });
});
```

### 5. Use Audit Logging

```typescript
// ✅ Log important operations
export const PUT = withAuditLog(
  Resource.EHR,
  Action.Update,
  async (req, user, context) => {
    // Update EHR
    // Audit log created automatically
    return successResponse({ updated: true });
  }
);
```

---

## 🧪 Testing RBAC

### Test User Access

```typescript
import { hasPermission } from "@/lib/permissions";
import { UserRole, Resource, Action } from "@/lib/permissions";

// Test if Doctor can create patients
console.log(hasPermission(UserRole.Doctor, Resource.Patient, Action.Create)); // true

// Test if Nurse can delete patients
console.log(hasPermission(UserRole.Nurse, Resource.Patient, Action.Delete)); // false
```

### Test Clinic Access

```typescript
import { hasGlobalAccess } from "@/lib/dbTypes";

console.log(hasGlobalAccess(UserRole.Admin)); // true
console.log(hasGlobalAccess(UserRole.Doctor)); // false
```

---

## 📊 Permission Summary Table

| Role        | Global Access | Can Create Patients | Can View EHR | Can Access Financials | Can Access Passport Scans |
| ----------- | ------------- | ------------------- | ------------ | --------------------- | ------------------------- |
| Admin       | ✅            | ✅                  | ✅           | ✅                    | ✅                        |
| Director    | ✅            | ❌                  | ✅ (Read)    | ✅ (Read)             | ✅                        |
| Operational | ✅            | ❌                  | ❌           | ❌                    | ❌                        |
| Doctor      | ❌            | ✅                  | ✅           | ❌                    | ❌                        |
| Nurse       | ❌            | ❌                  | ✅ (Read)    | ❌                    | ❌                        |
| Reception   | ❌            | ✅                  | ❌           | ✅ (Create/Read)      | ❌                        |
| Finance     | ❌            | ❌                  | ❌           | ✅                    | ✅                        |
| Laboratory  | ❌            | ❌                  | ❌           | ❌                    | ❌                        |
| Radiology   | ❌            | ❌                  | ❌           | ❌                    | ❌                        |
| Pharmacy    | ❌            | ❌                  | ❌           | ❌                    | ❌                        |

---

## 🚀 Next Steps

1. **Implement API Routes**: Use RBAC wrappers in all API routes
2. **Add Audit Logging**: Create AuditLog model and enable logging
3. **Frontend Integration**: Create permission-aware UI components
4. **Testing**: Write integration tests for each role
5. **Documentation**: Document role-specific workflows

---

## 📖 Related Documentation

- [Database Schema](./models/README.md)
- [Quick Start Guide](./QUICK_START.md)
- [API Helpers Reference](./lib/apiHelpers.ts)

---

**Status**: ✅ RBAC System Implemented and Ready for Use
