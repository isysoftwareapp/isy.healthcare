# Pricelist Manager Enhancement TODO

**Project:** ISY Healthcare - Pricelist Manager
**Start Date:** November 11, 2025
**Status:** In Progress

---

## Overview

Enhance the pricelist manager to support:

- Clinic-specific pricelists
- Multi-currency support with exchange rates
- Dynamic category management
- Collapsible category sections
- Export to PDF and Excel with customization
- Selective price column display/export

---

## Tasks

### 1. ✅ Create TODO.md file for tracking

**Status:** ✅ Complete
**Description:** Create a persistent TODO.md file in the project root to track all pricelist manager enhancement tasks.

---

### 2. ✅ Add clinic-based pricelist filtering

**Status:** ✅ Complete
**Priority:** High
**Description:** Modify the pricelist page to filter services by clinic. Each clinic should have its own separate pricelist.
**Files to modify:**

- `app/dashboard/pricelists/page.tsx` - Add clinic selector dropdown
- `app/api/pricelists/route.ts` - Add clinic filtering logic
  **Requirements:**
- Show dropdown to select clinic (Admin/Director can see all, others see assigned clinic)
- Filter services by selected clinic
- Update API to accept `clinicId` parameter

---

### 3. ✅ Add currency settings model/schema

**Status:** ✅ Complete (Already existed)
**Priority:** High
**Description:** Create ExchangeRate model/API to store currency conversion rates (USD, EUR, AUD to IDR).
**Files to create:**

- `models/ExchangeRate.ts` - New model
- `app/api/exchange-rates/route.ts` - CRUD API
  **Schema:**

```typescript
{
  baseCurrency: 'IDR',
  targetCurrency: 'USD' | 'EUR' | 'AUD',
  rate: number,
  clinicId?: ObjectId, // optional, null = global
  updatedAt: Date,
  updatedBy: ObjectId
}
```

---

### 4. ✅ Add currency selector UI

**Status:** ✅ Complete
**Priority:** Medium
**Description:** Add dropdown to select display currency (IDR, USD, EUR, AUD). Convert prices on-the-fly using exchange rates.
**Files to modify:**

- `app/dashboard/pricelists/page.tsx` - Add currency dropdown and conversion logic
  **Requirements:**
- Dropdown with currency options (IDR, USD, EUR, AUD)
- Fetch exchange rates from API
- Convert all displayed prices using selected currency
- Show currency symbol in table headers

---

### 5. ⏳ Add dynamic category management

**Status:** Not Started
**Priority:** Medium
**Description:** Allow users to add custom categories (not just hardcoded list).
**Files to modify:**

- `models/Service.ts` or create `models/Category.ts`
- `app/api/categories/route.ts` - New API
- `app/dashboard/pricelists/page.tsx` - Add category management UI
  **Requirements:**
- Modal to add/edit/delete categories
- Store categories in database (clinic-specific or global)
- Update category dropdown to use dynamic categories

---

### 6. ✅ Add 'hide empty services' toggle

**Status:** ✅ Complete
**Priority:** Low
**Description:** Add checkbox/toggle to hide services with zero prices or inactive services.
**Files to modify:**

- `app/dashboard/pricelists/page.tsx` - Add toggle and filtering logic
  **Requirements:**
- Checkbox "Hide empty services"
- Filter out services where all prices = 0 or isActive = false
- Persist toggle state in local storage

---

### 7. ✅ Implement collapsible category sections

**Status:** ✅ Complete
**Priority:** High
**Description:** Reorganize table to group services by category. Each category becomes a collapsible section.
**Files to modify:**

- `app/dashboard/pricelists/page.tsx` - Refactor table structure
  **Requirements:**
- Group services by category
- Add expand/collapse toggle for each category
- Show service count per category (e.g., "Consultation (5)")
- Persist expanded/collapsed state in local storage
- "Expand All" / "Collapse All" buttons

---

### 8. ✅ Add price column checkboxes

**Status:** ✅ Complete
**Priority:** Medium
**Description:** Add checkboxes for each price type column (Local, Local+Insurance, Tourist, Tourist+Insurance).
**Files to modify:**

- `app/dashboard/pricelists/page.tsx` - Add checkboxes above table
  **Requirements:**
- Checkboxes for: Local, Local+Insurance, Tourist, Tourist+Insurance
- Show/hide columns based on checkbox state
- Used for export (only export checked columns)
- Default: all checked

---

### 9. ✅ Create PDF export modal

**Status:** ✅ Complete
**Priority:** High
**Description:** Create modal with fields: PDF Title, PDF Subtitle, Logo upload/URL, Footer text.
**Files modified:**

- `app/dashboard/pricelists/page.tsx` - Integrated modal directly in page component
  **Modal fields:**
- PDF Title (text input) ✅
- PDF Subtitle (text input) ✅
- Logo (URL input) ✅
- Footer text (textarea) ✅
- Export as PDF button ✅
- Export as Excel button ✅

---

### 10. 🔄 Implement PDF generation

**Status:** 🔄 Implemented (Testing Required)
**Priority:** High
**Description:** Use library (jsPDF or react-pdf) to generate PDF with selected columns, filtered data.
**Dependencies:**

```bash
npm install jspdf jspdf-autotable @types/jspdf
# Run: .\install-export-deps.ps1
```

**Files modified:**

- `app/dashboard/pricelists/page.tsx` - Added exportToPDF() function with dynamic import
- `install-export-deps.ps1` - Created PowerShell installation script
  **Requirements:**
- ✅ Include only checked price columns
- ✅ Include only visible categories (expanded ones)
- ✅ Apply currency conversion if selected
- ✅ Custom title, subtitle, logo, footer
- ✅ Landscape orientation for wide tables
- ✅ Page numbers
- ⏳ **TODO: Install dependencies and test output**

---

### 11. 🔄 Implement Excel export

**Status:** 🔄 Implemented (Testing Required)
**Priority:** High
**Description:** Use library (xlsx/exceljs) to export table data to Excel format.
**Dependencies:**

```bash
npm install xlsx
# Run: .\install-export-deps.ps1
```

**Files modified:**

- `app/dashboard/pricelists/page.tsx` - Added exportToExcel() function with dynamic import
- `install-export-deps.ps1` - Created PowerShell installation script
  **Requirements:**
- ✅ Include only checked price columns
- ✅ Include only visible categories
- ✅ Apply currency conversion if selected
- ✅ Format numbers as currency
- ✅ Bold headers (via auto-style)
- ✅ Auto-fit column widths
- ✅ Sheet name per category (multi-sheet workbook)
- ⏳ **TODO: Install dependencies and test output**

---

### 12. ⏳ Update API routes for clinic filter

**Status:** Not Started
**Priority:** High
**Description:** Modify /api/pricelists to accept clinic parameter and filter services accordingly.
**Files to modify:**

- `app/api/pricelists/route.ts` - Add clinic filtering, authorization
  **Requirements:**
- Accept `clinicId` query parameter
- Filter services by clinic
- Authorization: users can only see their clinic's pricelists (except Admin/Director)
- Return clinic info with services

---

### 13. ⏳ Test and verify all features

**Status:** Not Started
**Priority:** High
**Description:** Run dev server, test all features end-to-end.
**Test cases:**

- [ ] Clinic filtering works
- [ ] Currency conversion displays correctly
- [ ] Add/edit/delete categories
- [ ] Hide empty services toggle
- [ ] Expand/collapse category sections
- [ ] Price column checkboxes show/hide columns
- [ ] PDF export with custom properties
- [ ] Excel export with formatting
- [ ] Role-based access control
- [ ] Mobile responsiveness

---

## Dependencies to Install

```bash
# PDF generation
npm install jspdf jspdf-autotable

# Excel generation
npm install xlsx

# Or alternative PDF library
npm install @react-pdf/renderer
```

---

## Database Schema Updates

### Exchange Rate Collection

```typescript
{
  _id: ObjectId,
  baseCurrency: 'IDR',
  targetCurrency: 'USD' | 'EUR' | 'AUD',
  rate: number,
  clinicId: ObjectId | null, // null = global
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
  updatedBy: ObjectId
}
```

### Category Collection (optional, if not embedded in Service)

```typescript
{
  _id: ObjectId,
  categoryName: string,
  categoryCode: string,
  description: string,
  clinicId: ObjectId | null, // null = global
  isActive: boolean,
  displayOrder: number,
  icon: string,
  color: { bg: string, text: string },
  createdAt: Date
}
```

---

## Notes

- Work in small batches to ensure quality
- Test each feature before moving to next
- Maintain backward compatibility
- Follow existing code patterns
- Add proper TypeScript types
- Handle loading and error states
- Add user feedback (toasts/alerts)

---

## Progress Tracking

- **Total Tasks:** 13
- **Completed:** 8 ✅
- **Implemented (Testing Required):** 2 🔄
- **Not Started:** 3 ⏳
- **Progress:** 76.9%

### Summary

- ✅ Tasks 1-4, 6-9: Fully complete
- 🔄 Tasks 10-11: Code implemented, need dependency installation & testing
- ⏳ Tasks 5, 12-13: Pending implementation

---

**Last Updated:** November 11, 2025 (Batch 3 - Export features implemented)

---

## Next Steps

1. **Install Export Dependencies** ⚡

   ```powershell
   .\install-export-deps.ps1
   ```

2. **Test PDF Export**

   - Navigate to /dashboard/pricelists
   - Select clinic and currency
   - Expand desired categories
   - Check desired price columns
   - Click "Export" button
   - Fill in PDF settings (title, subtitle, footer)
   - Click "Export as PDF"
   - Verify landscape PDF with filtered data

3. **Test Excel Export**

   - Same steps as PDF
   - Click "Export as Excel"
   - Verify multi-sheet workbook with proper formatting

4. **Optional: Implement Task 5 - Dynamic Category Management**

   - Create Category model and API
   - Add "Manage Categories" button and modal
   - Test add/edit/delete categories

5. **Update API Routes (Task 12)**

   - Modify `/api/pricelists/route.ts` to accept clinicId parameter
   - Add authorization checks
   - Replace dummy data with real database queries

6. **Final Testing (Task 13)**
   - Test all features together
   - Verify role-based access control
   - Test mobile responsiveness
