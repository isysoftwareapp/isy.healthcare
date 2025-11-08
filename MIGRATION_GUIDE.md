# Migration Guide - Existing Code to New Schema

## Overview

This guide helps you update existing code to work with the new multi-clinic database schema.

---

## 🔄 Breaking Changes

### 1. **Clinic References**

**Before**: String-based clinic IDs

```typescript
assignedClinics: string[]
assignedClinic: string
```

**After**: MongoDB ObjectId references

```typescript
assignedClinics: mongoose.Types.ObjectId[]
primaryClinic: mongoose.Types.ObjectId
```

### 2. **Patient Clinic Assignment**

**Before**: `assignedClinic` (single clinic)

```typescript
patient.assignedClinic = "clinic-id";
```

**After**: `primaryClinic` + `visitedClinics` (multi-clinic tracking)

```typescript
patient.primaryClinic = clinicObjectId;
patient.visitedClinics = [clinicObjectId]; // Auto-populated
```

### 3. **Insurance Details**

**Before**: Simple string provider

```typescript
insuranceDetails: {
  provider: string;
  policyNumber: string;
}
```

**After**: Reference to InsuranceProvider model

```typescript
insuranceDetails: {
  providerId: mongoose.Types.ObjectId;
  provider: string; // Display name
  policyNumber: string;
  groupNumber?: string;
  copayAmount?: number;
}
```

---

## 📝 Update Checklist

### API Routes

#### ✅ Update Session Type Definitions

**File**: `types/next-auth.d.ts`

**Before**:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    role: string;
    assignedClinics: string[];
  };
}
```

**After**:

```typescript
import { Types } from "mongoose";

interface Session {
  user: {
    id: string;
    email: string;
    role: string;
    assignedClinics: Types.ObjectId[];
    primaryClinic?: Types.ObjectId;
  };
}
```

#### ✅ Update Pricelist Route

**File**: `app/api/pricelists/route.ts`

**Changes Needed**:

1. **Import new models**:

```typescript
import Service from "@/models/Service";
import { Clinic } from "@/models";
import { toObjectId } from "@/lib/dbTypes";
```

2. **Update query logic**:

```typescript
// Before
query.assignedClinic = { $in: session.user.assignedClinics };

// After (with ObjectId)
import { Types } from "mongoose";
query.assignedClinic = {
  $in: session.user.assignedClinics.map((id) => new Types.ObjectId(id)),
};
```

3. **Update population**:

```typescript
// Before
.populate("assignedClinic", "clinicId clinicName")

// After (Clinic model has different fields)
.populate("assignedClinic", "clinicId name code")
```

#### ✅ Create Clinic API Routes

**New File**: `app/api/clinics/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import { Clinic } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Global roles see all clinics
    if (["Admin", "Director", "Operational"].includes(session.user.role)) {
      const clinics = await Clinic.find({ isActive: true });
      return NextResponse.json({ clinics }, { status: 200 });
    }

    // Clinic-specific roles see only assigned clinics
    const clinics = await Clinic.find({
      _id: { $in: session.user.assignedClinics },
      isActive: true,
    });

    return NextResponse.json({ clinics }, { status: 200 });
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinics" },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Authentication Updates

### NextAuth Configuration

**File**: `app/api/auth/[...nextauth]/route.ts`

**Update JWT callback**:

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user._id.toString();
    token.role = user.role;
    // Convert ObjectIds to strings for JWT
    token.assignedClinics = user.assignedClinics.map((id) => id.toString());
    token.primaryClinic = user.primaryClinic?.toString();
  }
  return token;
},
```

**Update session callback**:

```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id as string;
    session.user.role = token.role as string;
    session.user.assignedClinics = token.assignedClinics as string[];
    session.user.primaryClinic = token.primaryClinic as string;
  }
  return session;
},
```

---

## 🎨 Frontend Updates

### Patient List Component

**Before**:

```typescript
const patients = await fetch("/api/patients?clinic=" + clinicId);
```

**After** (with proper ObjectId handling):

```typescript
// clinicId is now a string representation of ObjectId
const patients = await fetch(`/api/patients?clinic=${clinicId}`);

// In the API route, convert to ObjectId:
const clinicObjectId = new Types.ObjectId(clinicId);
const patients = await Patient.find({ primaryClinic: clinicObjectId });
```

### Clinic Selector Component

**New Component**: `components/ClinicSelector.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ClinicSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (clinicId: string) => void;
}) {
  const { data: session } = useSession();
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    fetch("/api/clinics")
      .then((res) => res.json())
      .then((data) => setClinics(data.clinics));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2"
    >
      {clinics.map((clinic: any) => (
        <option key={clinic._id} value={clinic._id}>
          {clinic.name} ({clinic.code})
        </option>
      ))}
    </select>
  );
}
```

---

## 📊 Data Migration Script

**Create**: `scripts/migrate-to-new-schema.ts`

```typescript
import dbConnect from "../lib/mongodb";
import { User, Patient, Service, Clinic } from "../models";
import mongoose from "mongoose";

async function migrateData() {
  await dbConnect();

  console.log("Starting migration...");

  // 1. Get or create default clinic
  let defaultClinic = await Clinic.findOne({ code: "MAIN" });

  if (!defaultClinic) {
    console.log("Creating default clinic...");
    defaultClinic = await Clinic.create({
      clinicId: "CLINIC-001",
      name: "Main Clinic",
      code: "MAIN",
      // ... other required fields
    });
  }

  const defaultClinicId = defaultClinic._id;

  // 2. Migrate Users
  console.log("Migrating users...");
  const users = await User.find({});

  for (const user of users) {
    // Convert string clinic IDs to ObjectIds
    if (user.assignedClinics && user.assignedClinics.length > 0) {
      const clinicIds = user.assignedClinics.map((id: any) => {
        if (typeof id === "string") {
          return defaultClinicId; // Or map to actual clinic
        }
        return id;
      });

      user.assignedClinics = clinicIds;
      user.primaryClinic = clinicIds[0];
      await user.save();
    }
  }

  // 3. Migrate Patients
  console.log("Migrating patients...");
  const patients = await Patient.find({});

  for (const patient of patients) {
    // Migrate assignedClinic to primaryClinic
    if ((patient as any).assignedClinic) {
      const clinicId =
        typeof (patient as any).assignedClinic === "string"
          ? defaultClinicId
          : (patient as any).assignedClinic;

      patient.primaryClinic = clinicId;
      patient.visitedClinics = [clinicId];

      // Remove old field
      delete (patient as any).assignedClinic;

      await patient.save();
    }
  }

  // 4. Migrate Services
  console.log("Migrating services...");
  const services = await Service.find({});

  for (const service of services) {
    if (typeof (service as any).assignedClinic === "string") {
      service.assignedClinic = defaultClinicId;
      await service.save();
    }
  }

  console.log("Migration completed!");
}

// Run migration
migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
```

**Run migration**:

```powershell
npx ts-node scripts/migrate-to-new-schema.ts
```

---

## 🧪 Testing After Migration

### 1. Test User Access

```typescript
import { User } from "@/models";

const user = await User.findOne({ email: "admin@clinic.com" });
console.log("Assigned Clinics:", user.assignedClinics);
console.log("Primary Clinic:", user.primaryClinic);
console.log("Has access:", user.hasAccessToClinic(clinicId));
```

### 2. Test Patient Queries

```typescript
import { Patient } from "@/models";

const patients = await Patient.find({
  primaryClinic: clinicId,
}).populate("primaryClinic");

console.log("Found patients:", patients.length);
```

### 3. Test Service Pricing

```typescript
import { Service } from "@/models";

const service = await Service.findOne({}).populate("assignedClinic");
console.log("Service clinic:", service.assignedClinic.name);
console.log("Pricing:", service.pricing);
```

---

## ⚠️ Common Issues

### Issue 1: "Cast to ObjectId failed"

**Problem**: Passing string where ObjectId is expected

**Solution**:

```typescript
import { toObjectId } from "@/lib/dbTypes";

// Convert string to ObjectId
const clinicId = toObjectId(clinicIdString);
```

### Issue 2: "assignedClinic is not defined"

**Problem**: Old field name used

**Solution**: Update to `primaryClinic`

```typescript
// Before
patient.assignedClinic;

// After
patient.primaryClinic;
```

### Issue 3: Population fails

**Problem**: Trying to populate with old field names

**Solution**:

```typescript
// Before
.populate("assignedClinic", "clinicId clinicName")

// After
.populate("assignedClinic", "clinicId name code")
```

---

## 📋 Step-by-Step Migration Process

1. ✅ **Backup database**

   ```powershell
   mongodump --uri="your-mongodb-uri" --out="./backup"
   ```

2. ✅ **Install dependencies**

   ```powershell
   npm install
   ```

3. ✅ **Run seed script** (creates default clinic)

   ```powershell
   npx ts-node scripts/init-db.ts
   ```

4. ✅ **Run migration script**

   ```powershell
   npx ts-node scripts/migrate-to-new-schema.ts
   ```

5. ✅ **Update API routes**

   - Update `pricelists/route.ts`
   - Create `clinics/route.ts`
   - Update other routes as needed

6. ✅ **Update NextAuth configuration**

   - Update JWT callback
   - Update session callback

7. ✅ **Update frontend components**

   - Add ClinicSelector where needed
   - Update patient lists
   - Update service/pricelist displays

8. ✅ **Test thoroughly**

   - Test user login
   - Test clinic selection
   - Test patient operations
   - Test multi-clinic access

9. ✅ **Deploy**
   - Test in staging first
   - Monitor for errors
   - Have rollback plan ready

---

## 🔄 Rollback Plan

If migration fails:

1. **Stop application**

   ```powershell
   # Stop your Next.js app
   ```

2. **Restore backup**

   ```powershell
   mongorestore --uri="your-mongodb-uri" --drop ./backup
   ```

3. **Revert code changes**

   ```powershell
   git checkout previous-commit
   ```

4. **Restart application**

---

## 📞 Support

If you encounter issues:

1. Check the error logs
2. Verify ObjectId conversions
3. Ensure all models are imported correctly
4. Review the Quick Start Guide
5. Check the Schema Documentation

---

**Status**: Ready for migration
**Estimated Time**: 1-2 hours (depending on data volume)
**Risk Level**: Medium (test thoroughly in development first)
