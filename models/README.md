# Multi-Clinic Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the clinic management system, supporting multi-clinic operations with role-based access control.

## Core Models

### 1. **Clinic Model** (`models/Clinic.ts`)

**Purpose**: Represents a physical clinic location with independent settings and configurations.

**Key Features**:

- Unique clinic identification (clinicId, code)
- Complete contact and address information
- Operational settings (operating hours, appointment slots, auto-logout)
- Financial settings (currency, exchange rates, invoice prefixes)
- Template associations (clinic-specific forms and documents)
- Custom pricelist support
- Insurance provider contracts
- Branding customization

**Indexes**:

- `clinicId` (unique)
- `code` (unique)
- Text search on name and code
- Active clinics lookup
- Location-based queries

**Methods**:

- `isCurrentlyOpen()`: Check if clinic is open now
- `findActive()`: Get all active clinics

---

### 2. **User Model** (`models/User.ts`)

**Purpose**: Manages all system users with 10 distinct roles.

**Supported Roles**:

- Admin (Global access)
- Director (Global access)
- Operational (Global access)
- Doctor (Clinic-specific)
- Nurse (Clinic-specific)
- Reception (Clinic-specific)
- Finance (Clinic-specific)
- Laboratory (Clinic-specific)
- Radiology (Clinic-specific)
- Pharmacy (Clinic-specific)

**Key Features**:

- Multi-clinic assignment support
- Primary clinic designation
- Professional details (license, specialization)
- User preferences (language, theme, default clinic)
- Security tracking (last login, password changes)

**Indexes**:

- `email` (unique)
- Role and active status
- Assigned clinics

**Methods**:

- `hasAccessToClinic(clinicId)`: Check clinic access
- `findByClinic(clinicId, role)`: Get users by clinic

---

### 3. **Patient Model** (`models/Patient.ts`)

**Purpose**: Stores comprehensive patient information across clinics.

**Key Features**:

- Auto-generated unique patientId (FR 1.2)
- Demographics and contact information
- Emergency contact details (FR 1.1)
- Insurance information with provider reference
- Patient photo and passport/ID scan (FR 1.4, 1.5)
- Patient category for pricing (FR 4.5)
- Primary clinic and visited clinics tracking
- Medical alerts (allergies, conditions, medications)

**Security**:

- `passportScan` field uses `select: false` for restricted access (NFR 1.4)

**Indexes**:

- `patientId` (unique)
- Text search on name and patientId
- Phone number lookup
- Primary clinic queries
- Insurance provider lookups

**Virtuals**:

- `fullName`: Computed full name
- `age`: Calculated from date of birth

**Hooks**:

- Pre-save: Auto-add primary clinic to visitedClinics

---

### 4. **Service Model** (`models/Service.ts`)

**Purpose**: Manages medical services and procedures with pricing.

**Key Features**:

- Service categorization (Consultation, Procedure, Laboratory, Radiology, Pharmacy, Other)
- Four-tier pricing structure (FR 4.5):
  - Local
  - Local with Insurance
  - Tourist
  - Tourist with Insurance
- Clinic assignment for multi-clinic support

**Indexes**:

- Text search on service name and ID
- Clinic and active status queries

---

### 5. **Pricelist Model** (`models/Pricelist.ts`)

**Purpose**: Manages custom pricelists for insurance contracts and special agreements (FR 4.6).

**Key Features**:

- Multiple pricelist types (Insurance, Contract, Custom, Promotional)
- Service-specific pricing with effective dates
- Discount configuration (percentage or fixed)
- Clinic assignment
- Insurance provider association
- Validity period management

**Indexes**:

- `pricelistId` (unique)
- Clinic and active status
- Insurance provider lookups
- Effective date queries

**Methods**:

- `getPriceForService(serviceId)`: Get specific service price
- `isCurrentlyValid()`: Check if pricelist is valid now
- `findActiveByClinic(clinicId)`: Get active pricelists for clinic

---

### 6. **InsuranceProvider Model** (`models/InsuranceProvider.ts`)

**Purpose**: Manages insurance companies and their clinic contracts (FR 4.3).

**Key Features**:

- Provider identification and contact info
- Multi-clinic contract management
- Coverage types specification
- Pre-authorization requirements
- Payment terms configuration
- Network type classification (HMO, PPO, EPO, POS)

**Indexes**:

- `providerId` (unique)
- Text search on name and code
- Clinic contract lookups

**Methods**:

- `getActiveContractForClinic(clinicId)`: Get current contract
- `findByClinic(clinicId)`: Get providers by clinic

---

### 7. **Template Model** (`models/Template.ts`)

**Purpose**: Manages clinic-specific document templates (FR 5.4).

**Template Types**:

- ConsultationNote
- Prescription
- LabOrder
- RadiologyOrder
- ConsentForm
- Invoice
- Other

**Key Features**:

- Dynamic section and field configuration
- SOAP format support (Subjective, Objective, Assessment, Plan)
- Multi-clinic assignment
- Role-based access control
- Version management
- Custom styling and branding
- Field validation rules

**Indexes**:

- `templateId` (unique)
- Type and active status
- Clinic assignment
- Text search on name

**Methods**:

- `findByClinicAndType(clinicId, type)`: Get templates by criteria
- `getDefaultTemplate(clinicId, type)`: Get default template

---

## Database Relationships

```
Clinic (1) ──→ (Many) Users
Clinic (1) ──→ (Many) Patients
Clinic (1) ──→ (Many) Services
Clinic (1) ──→ (Many) Pricelists
Clinic (1) ──→ (Many) Templates
Clinic (Many) ←→ (Many) InsuranceProviders

Patient (Many) ──→ (1) Clinic (primary)
Patient (Many) ──→ (Many) Clinics (visited)
Patient (Many) ──→ (1) InsuranceProvider

User (Many) ──→ (Many) Clinics (assigned)
User (Many) ──→ (1) Clinic (primary)

Service (Many) ──→ (1) Clinic
Pricelist (Many) ──→ (1) Clinic
Pricelist (1) ──→ (Many) Services
Pricelist (Many) ──→ (1) InsuranceProvider

Template (Many) ──→ (Many) Clinics
```

---

## Multi-Clinic Access Control

### Global Access Roles

These roles can access ALL clinics:

- **Admin**: Full system access
- **Director**: Management and reporting
- **Operational**: Cross-clinic operations

### Clinic-Specific Roles

These roles are restricted to assigned clinics:

- **Doctor**: Clinical operations
- **Nurse**: Patient care
- **Reception**: Front desk
- **Finance**: Billing and claims
- **Laboratory**: Lab operations
- **Radiology**: Imaging operations
- **Pharmacy**: Medication dispensing

### Implementation

Use the `User.hasAccessToClinic(clinicId)` method to verify access before operations.

---

## Seeding & Initialization

### Seed Functions

Located in `lib/seed.ts`:

1. **`seedDefaultClinic()`**: Creates main clinic
2. **`seedDefaultAdmin()`**: Creates system admin
3. **`seedDefaultConsultationTemplate()`**: Creates SOAP template
4. **`seedDatabase()`**: Runs all seed functions
5. **`clearDatabase()`**: Clears all data (use with caution!)

### Usage

```typescript
import { seedDatabase } from "./lib/seed";

// Initialize database
await seedDatabase();
```

---

## Performance Optimization

### Indexing Strategy

- **Text indexes**: Patient names, service names, clinic names
- **Compound indexes**: clinic + active status, role + active status
- **Reference indexes**: All ObjectId references
- **Date indexes**: Effective dates, expiry dates

### Query Optimization

- Use `.select()` to limit fields returned
- Use `.populate()` sparingly and only when needed
- Leverage indexes for filtering and sorting
- Use pagination for large datasets

---

## Security Considerations

### Sensitive Data Protection

1. **Passport/ID Scans** (NFR 1.4):

   - Stored with `select: false`
   - Requires explicit inclusion in queries
   - Should use additional encryption layer
   - Restricted to Finance/Admin/Director roles

2. **Password Storage**:

   - Must be hashed using bcrypt (not implemented in seed data)
   - Never expose in API responses

3. **Auto-Logout** (NFR 1.2):
   - Configurable per clinic
   - Default: 15 minutes
   - Range: 5-60 minutes

---

## Migration Notes

### Existing Data Migration

If migrating from previous schema:

1. **Users**: Convert `assignedClinics` from String[] to ObjectId[]
2. **Patients**:
   - Rename `assignedClinic` to `primaryClinic`
   - Convert to ObjectId
   - Initialize `visitedClinics` array
3. **Services**: Convert `assignedClinic` to ObjectId

### Backwards Compatibility

Models use `mongoose.models.ModelName || model()` pattern to prevent recompilation errors during hot reload.

---

## Future Enhancements

Potential additions to consider:

- Appointment model (FR 2.1-2.4)
- EHR/MedicalRecord model (FR 3.1-3.5)
- Invoice/Billing model (FR 4.1-4.4)
- Laboratory Order/Result models
- Radiology Order/Result models
- Prescription model
- Audit Log model (NFR 1.3)
- Inventory models (medications, supplies)

---

## API Integration Guidelines

### Creating Multi-Clinic Queries

```typescript
// Get all patients for a specific clinic
const patients = await Patient.find({
  primaryClinic: clinicId,
  isActive: true,
});

// Get all staff for a clinic
const staff = await User.findByClinic(clinicId);

// Get services with pricing for a patient
const services = await Service.find({
  assignedClinic: clinicId,
  isActive: true,
});
```

### Role-Based Access Example

```typescript
// Check if user can access patient data
if (!user.hasAccessToClinic(patient.primaryClinic)) {
  throw new Error("Access denied");
}
```

---

## Database Connection

Connection management is handled in `lib/mongodb.ts`:

- Singleton pattern prevents multiple connections
- Automatic reconnection on failure
- Connection pooling via Mongoose
- Environment variable configuration

---

## Version History

- **v1.0.0** (Current): Initial multi-clinic schema implementation
  - 7 core models
  - Full multi-clinic support
  - RBAC foundation
  - Seeding utilities

---

## Support & Maintenance

For schema changes or issues:

1. Update the relevant model file
2. Update this documentation
3. Create migration scripts if needed
4. Update seed data if applicable
5. Test with existing data
