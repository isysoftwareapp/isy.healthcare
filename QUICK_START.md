# Quick Start Guide - Multi-Clinic Database

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/clinic_management
# Or for production:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinic_management
```

### 2. Initialize Database

```powershell
# Install dependencies (if not already done)
npm install

# Run database seeding
npx ts-node scripts/init-db.ts

# To clear and reseed (CAUTION!)
$env:CONFIRM_CLEAR="yes"; npx ts-node scripts/init-db.ts --clear
```

### 3. Default Credentials

After seeding, you can login with:

- **Email**: `admin@clinic.com`
- **Password**: `admin123`
- ⚠️ **Change immediately in production!**

---

## 📚 Quick Reference

### Import Models

```typescript
// Individual imports
import { User, Patient, Clinic, Service } from "@/models";

// Or specific model
import Patient from "@/models/Patient";
import type { IPatient } from "@/models/Patient";
```

### Common Operations

#### Create a Patient

```typescript
import { Patient } from "@/models";

const patient = await Patient.create({
  patientId: "P-001", // Will auto-generate if not provided
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1990-01-01"),
  gender: "Male",
  phoneNumber: "+1-555-0100",
  address: {
    street: "123 Main St",
    city: "City",
    state: "State",
    country: "Country",
    postalCode: "12345",
  },
  emergencyContact: {
    name: "Jane Doe",
    relationship: "Spouse",
    phoneNumber: "+1-555-0101",
  },
  category: "Local",
  primaryClinic: clinicId,
});
```

#### Find Patients by Clinic

```typescript
const patients = await Patient.find({
  primaryClinic: clinicId,
  isActive: true,
})
  .select("firstName lastName patientId phoneNumber")
  .sort({ lastName: 1 })
  .limit(50);
```

#### Search Patients

```typescript
// Text search
const results = await Patient.find({
  $text: { $search: "john doe" },
  primaryClinic: clinicId,
});

// By phone number
const patient = await Patient.findOne({
  phoneNumber: "+1-555-0100",
});
```

#### Check User Access

```typescript
import { User } from "@/models";

const user = await User.findById(userId);

// Check if user can access a clinic
if (!user.hasAccessToClinic(clinicId)) {
  throw new Error("Access denied");
}

// Get all users for a clinic
const staff = await User.findByClinic(clinicId, "Doctor");
```

#### Get Active Pricelists

```typescript
import { Pricelist } from "@/models";

// Get all active pricelists for a clinic
const pricelists = await Pricelist.findActiveByClinic(clinicId);

// Get price for a service
const pricelist = pricelists[0];
const price = pricelist.getPriceForService(serviceId);
```

#### Work with Templates

```typescript
import { Template } from "@/models";

// Get default consultation template
const template = await Template.getDefaultTemplate(
  clinicId,
  "ConsultationNote"
);

// Get all templates for a clinic
const templates = await Template.findByClinicAndType(clinicId, "Prescription");
```

---

## 🔐 Role-Based Access

### Role Hierarchy

**Global Access** (All Clinics):

- `Admin` - Full system access
- `Director` - Management & reporting
- `Operational` - Cross-clinic operations

**Clinic-Specific**:

- `Doctor` - Clinical operations
- `Nurse` - Patient care
- `Reception` - Front desk
- `Finance` - Billing & claims
- `Laboratory` - Lab operations
- `Radiology` - Imaging
- `Pharmacy` - Medication dispensing

### Check Access

```typescript
import { hasGlobalAccess } from "@/lib/dbTypes";

if (hasGlobalAccess(user.role)) {
  // User can access all clinics
} else {
  // Check specific clinic access
  if (!user.assignedClinics.includes(clinicId)) {
    throw new Error("Not assigned to this clinic");
  }
}
```

---

## 📊 Patient Categories & Pricing

### Categories

```typescript
enum PatientCategory {
  Local = "Local",
  LocalInsurance = "Local_Insurance",
  Tourist = "Tourist",
  TouristInsurance = "Tourist_Insurance",
}
```

### Get Correct Price

```typescript
import { Service } from "@/models";

const service = await Service.findById(serviceId);

// Get price based on patient category
let price;
switch (patient.category) {
  case "Local":
    price = service.pricing.local;
    break;
  case "Local_Insurance":
    price = service.pricing.localWithInsurance;
    break;
  case "Tourist":
    price = service.pricing.tourist;
    break;
  case "Tourist_Insurance":
    price = service.pricing.touristWithInsurance;
    break;
}
```

---

## 🌍 Multi-Currency Support

### Update Exchange Rates

```typescript
import { Clinic } from "@/models";

const clinic = await Clinic.findById(clinicId);

// Update exchange rates (daily task)
clinic.financialSettings.exchangeRates.set("EUR", 0.85);
clinic.financialSettings.exchangeRates.set("GBP", 0.73);
await clinic.save();
```

### Convert Currency

```typescript
const clinic = await Clinic.findById(clinicId);
const rate = clinic.financialSettings.exchangeRates.get("EUR") || 1;
const priceInEUR = priceInUSD * rate;
```

---

## 🔍 Advanced Queries

### Pagination

```typescript
import { applyPagination, createPaginationMetadata } from "@/lib/dbTypes";

const page = 1;
const limit = 20;

let query = Patient.find({ primaryClinic: clinicId, isActive: true });
query = applyPagination(query, { page, limit, sortBy: "lastName" });

const patients = await query;
const total = await Patient.countDocuments({
  primaryClinic: clinicId,
  isActive: true,
});

const pagination = createPaginationMetadata(total, page, limit);
```

### Complex Filters

```typescript
// Patients with insurance, aged 18-65
const patients = await Patient.find({
  primaryClinic: clinicId,
  "insuranceDetails.providerId": { $exists: true },
  dateOfBirth: {
    $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 65)),
    $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
  },
});
```

### Population

```typescript
// Get patient with insurance provider details
const patient = await Patient.findById(patientId)
  .populate("insuranceDetails.providerId")
  .populate("primaryClinic");

// Get user with clinic details
const user = await User.findById(userId)
  .populate("assignedClinics")
  .populate("primaryClinic");
```

---

## 🛡️ Security Best Practices

### Sensitive Data

```typescript
// Passport scans are excluded by default
const patient = await Patient.findById(patientId);
// patient.passportScan is undefined

// Explicitly include if authorized
const patientWithPassport = await Patient.findById(patientId).select(
  "+passportScan"
);
// Only for Finance/Admin/Director roles!
```

### Password Hashing

```typescript
import bcrypt from "bcryptjs";

// Before saving user
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
```

---

## 🧪 Testing Helpers

### Create Test Data

```typescript
import { Patient, User, Clinic } from "@/models";

// Create test clinic
const testClinic = await Clinic.create({
  clinicId: "TEST-001",
  name: "Test Clinic",
  code: "TEST",
  // ... minimal required fields
});

// Create test patient
const testPatient = await Patient.create({
  patientId: "TEST-P-001",
  firstName: "Test",
  lastName: "Patient",
  dateOfBirth: new Date("1990-01-01"),
  gender: "Male",
  phoneNumber: "+1-555-TEST",
  primaryClinic: testClinic._id,
  // ... minimal required fields
});
```

---

## 📝 Common Pitfalls

### ❌ Don't Do This

```typescript
// Don't use string IDs for references
patient.primaryClinic = "some-string-id"; // Wrong!

// Don't forget to await
Patient.find({ ... }); // Missing await!

// Don't update without checking access
await Patient.updateOne({ _id: patientId }, { ... }); // No permission check!
```

### ✅ Do This Instead

```typescript
// Use ObjectId
import { toObjectId } from "@/lib/dbTypes";
patient.primaryClinic = toObjectId(clinicIdString);

// Always await
const patients = await Patient.find({ ... });

// Check permissions first
if (!user.hasAccessToClinic(patient.primaryClinic)) {
  throw new PermissionError("Access denied");
}
await Patient.updateOne({ _id: patientId }, { ... });
```

---

## 🔗 Useful Links

- [Full Schema Documentation](./models/README.md)
- [Implementation Summary](./SCHEMA_IMPLEMENTATION.md)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## 💡 Tips

1. **Use indexes**: All major query fields are indexed
2. **Populate sparingly**: Only populate when you need the related data
3. **Use projections**: Select only fields you need with `.select()`
4. **Validate ObjectIds**: Use `isValidObjectId()` before queries
5. **Handle errors**: Wrap operations in try-catch blocks
6. **Check permissions**: Always verify user access before operations
7. **Use transactions**: For multi-document operations that must be atomic

---

## 🆘 Getting Help

If you encounter issues:

1. Check the model's TypeScript interface for required fields
2. Review the schema in `models/[ModelName].ts`
3. Check the indexes and ensure you're querying efficiently
4. Verify permissions and clinic assignments
5. Review the comprehensive README in `models/README.md`
