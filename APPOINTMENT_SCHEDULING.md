# Appointment Scheduling System Documentation

## Overview

A comprehensive appointment scheduling system for multi-clinic healthcare management with real-time availability checking, conflict detection, and status workflow management.

## Features Implemented

### 1. Backend Infrastructure

#### Appointment Model (`models/Appointment.ts`)

- **Schema Fields:**

  - `appointmentId`: Unique identifier (APT-{clinic}-{date}-{random})
  - `patient`: Reference to Patient model
  - `practitioner`: Reference to User model (doctors/nurses)
  - `clinic`: Reference to Clinic model
  - `appointmentDate`: Date of appointment
  - `startTime`: Start time (24-hour format: "HH:MM")
  - `endTime`: Calculated end time
  - `duration`: Duration in minutes
  - `type`: consultation | follow-up | procedure | checkup | emergency
  - `status`: scheduled | confirmed | checked-in | in-progress | completed | cancelled | no-show
  - `reason`: Reason for visit (required)
  - `notes`: Additional notes (optional)
  - `cancellationReason`: If cancelled
  - `cancelledAt`: Cancellation timestamp

- **Static Methods:**

  - `checkConflict()`: Validates no time slot conflicts for practitioner
  - `getPractitionerAvailability()`: Returns available 30-minute slots based on clinic hours

- **Indexes:**

  - Compound index on `clinic` + `appointmentDate`
  - Compound index on `practitioner` + `appointmentDate`
  - Compound index on `patient` + `appointmentDate`

- **Virtuals:**
  - `startDateTime`: Full ISO datetime combining date + start time
  - `endDateTime`: Full ISO datetime combining date + end time

#### API Routes

##### List & Create Appointments (`app/api/appointments/route.ts`)

- **GET /api/appointments**

  - Pagination support (page, limit)
  - Filter by: date, practitioner, patient, status, clinic
  - Search by patient name or ID
  - Populates patient, practitioner, and clinic references
  - Returns sorted by appointment date and start time

- **POST /api/appointments**
  - Creates new appointment
  - Validates required fields
  - Calculates end time from duration
  - Checks for practitioner conflicts
  - Generates unique appointment ID
  - Returns 409 status if time slot conflict detected

##### Check Availability (`app/api/appointments/availability/route.ts`)

- **GET /api/appointments/availability**
  - Query params: `practitionerId`, `date`, `clinicId`
  - Returns array of available time slots (30-min intervals)
  - Each slot marked as `isBooked: true/false`
  - Based on clinic operating hours

##### Individual Appointment Operations (`app/api/appointments/[id]/route.ts`)

- **GET /api/appointments/:id**

  - Fetch single appointment with all populated references
  - Returns 404 if not found

- **PATCH /api/appointments/:id**

  - Update appointment fields
  - Re-checks conflicts if time changes
  - Supports status updates
  - Returns updated appointment

- **DELETE /api/appointments/:id**
  - Soft delete (sets status to 'cancelled')
  - Records cancellation reason and timestamp
  - Does not remove from database

### 2. UI Components

#### Calendar Component (`components/Calendar.tsx`)

- **Features:**

  - Month navigation (previous/next)
  - Day grid with proper week alignment
  - Date states:
    - Disabled (before minDate)
    - Selected (blue background)
    - Today (blue border)
    - Booked dates (yellow background)
  - Visual legend
  - Responsive grid layout

- **Props:**
  ```typescript
  {
    selectedDate?: Date;
    onDateSelect: (date: Date) => void;
    minDate?: Date;
    bookedDates?: string[];
  }
  ```

#### TimeSlotSelector Component (`components/TimeSlotSelector.tsx`)

- **Features:**

  - Grid layout of available time slots (3-4 columns responsive)
  - Visual differentiation:
    - Available slots: White with hover
    - Booked slots: Gray, disabled
    - Selected slot: Blue background
  - Loading state with spinner
  - Empty state with helpful message
  - Summary statistics (X available, Y booked)

- **Props:**

  ```typescript
  {
    slots: TimeSlot[];
    selectedSlot?: TimeSlot;
    onSlotSelect: (slot: TimeSlot) => void;
    loading?: boolean;
  }

  interface TimeSlot {
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }
  ```

#### AppointmentBookingForm Component (`components/AppointmentBookingForm.tsx`)

- **Multi-Step Form:**

  **Step 1: Select Patient & Practitioner**

  - Patient dropdown (searchable)
  - Practitioner dropdown (filtered by role: Doctor, Nurse)
  - Shows specialization for practitioners

  **Step 2: Select Date & Time**

  - Calendar component for date selection
  - Automatic availability fetch when practitioner + date selected
  - TimeSlotSelector shows available slots
  - Loading indicators

  **Step 3: Appointment Details**

  - Type selection (consultation, follow-up, procedure, checkup, emergency)
  - Duration selection (15, 30, 45, 60, 90, 120 minutes)
  - Reason for visit (required textarea)
  - Additional notes (optional)
  - Summary card showing selected details

- **Features:**
  - Back navigation between steps
  - Validation at each step
  - Error handling with user-friendly messages
  - Loading states during submission
  - Conflict detection (409 error handling)
  - Optional callbacks: `onSuccess`, `onCancel`
  - Optional pre-filled patient ID

### 3. Pages

#### Book Appointment Page (`app/dashboard/appointments/new/page.tsx`)

- Clean layout with icon header
- Embeds AppointmentBookingForm component
- Provides context for new appointment creation

#### Appointments List Page (`app/dashboard/appointments/page.tsx`)

- **Statistics Dashboard:**

  - Total Appointments count
  - Scheduled count
  - Confirmed count
  - Cancelled count

- **Advanced Filtering:**

  - Search by patient name or ID
  - Filter by status (all, scheduled, confirmed, checked-in, in-progress, completed, cancelled, no-show)
  - Filter by date
  - Filter by practitioner

- **Table View:**

  - Columns: Appointment ID, Patient, Practitioner, Date & Time, Type, Status
  - Status badges with color coding
  - Type badges with color coding
  - Quick action buttons:
    - Confirm (scheduled → confirmed)
    - Check In (confirmed → checked-in)
    - Cancel (scheduled/confirmed → cancelled)
  - Click row to view details
  - Hover states

- **Pagination:**

  - Smart pagination with numbered buttons
  - Shows current page and total pages
  - Total appointments count
  - Previous/Next navigation

- **Empty States:**
  - Loading spinner
  - Error message with icon
  - No appointments message with suggestion

#### Appointment Detail Page (`app/dashboard/appointments/[id]/page.tsx`)

- Server-side data fetching
- Comprehensive appointment information display
- Action buttons for status workflow
- Client-side component for interactivity

#### Appointment Detail Client (`app/dashboard/appointments/[id]/AppointmentDetailClient.tsx`)

- **Three-Column Layout:**

  **Left Column (Main Info):**

  - Appointment Time section (date, time, duration)
  - Patient Information (name, ID, email, phone, location with links)
  - Practitioner Information (name, specialization, email, phone, license)
  - Appointment Details (reason, notes)

  **Right Column (Actions & Context):**

  - Quick Actions panel with status workflow buttons:
    - Scheduled → Confirm
    - Confirmed → Check In
    - Checked In → Start Consultation
    - In Progress → Complete
    - Mark as No-Show
  - Clinic Location information
  - Metadata (created, updated timestamps)

- **Features:**
  - Back to list navigation
  - Status update with API calls
  - Cancel appointment with confirmation
  - Status badges
  - Type badges
  - Icon-based information display
  - Loading states for actions
  - Error handling with alerts

## Status Workflow

```
         scheduled
             ↓
         confirmed
             ↓
        checked-in
             ↓
       in-progress
             ↓
         completed

  Any scheduled/confirmed can become:
  → cancelled (soft delete)
  → no-show
```

## RBAC Integration

All API endpoints use `withPermission` middleware checking:

- Resource: `Resource.APPOINTMENT`
- Actions: `Action.CREATE`, `Action.READ`, `Action.UPDATE`, `Action.DELETE`
- Clinic-scoped access validation

## Conflict Detection Algorithm

The `checkConflict` static method:

1. Converts appointment times to minutes for comparison
2. Checks for overlapping time ranges using:
   - `newStart < existingEnd AND newEnd > existingStart`
3. Excludes current appointment (for updates)
4. Returns conflict status and conflicting appointment details

## Availability Calculation Algorithm

The `getPractitionerAvailability` static method:

1. Fetches clinic operating hours
2. Generates 30-minute time slots from open to close
3. Fetches all appointments for practitioner on date
4. Marks slots as booked if overlapping with existing appointments
5. Returns array of slots with `isBooked` flag

## Files Created

### Backend (5 files, ~720 LOC)

- `models/Appointment.ts` (280 lines)
- `app/api/appointments/route.ts` (200 lines)
- `app/api/appointments/availability/route.ts` (60 lines)
- `app/api/appointments/[id]/route.ts` (180 lines)

### Components (3 files, ~770 LOC)

- `components/Calendar.tsx` (200 lines)
- `components/TimeSlotSelector.tsx` (120 lines)
- `components/AppointmentBookingForm.tsx` (450 lines)

### Pages (3 files, ~600 LOC)

- `app/dashboard/appointments/page.tsx` (480 lines)
- `app/dashboard/appointments/new/page.tsx` (45 lines)
- `app/dashboard/appointments/[id]/page.tsx` (35 lines)
- `app/dashboard/appointments/[id]/AppointmentDetailClient.tsx` (475 lines)

**Total: 11 files, ~2,090 LOC**

## Usage Examples

### Booking an Appointment

1. Navigate to `/dashboard/appointments/new`
2. Select patient (or use pre-filled patientId)
3. Select practitioner
4. Choose date from calendar
5. Select available time slot
6. Fill in appointment details (type, duration, reason)
7. Review summary and confirm

### Managing Appointments

1. Navigate to `/dashboard/appointments`
2. Use filters to find specific appointments
3. Click row to view details
4. Use quick action buttons for status updates
5. View full details with `/dashboard/appointments/:id`

### Checking Availability Programmatically

```typescript
const response = await fetch(
  `/api/appointments/availability?practitionerId=${id}&date=${date}&clinicId=${clinicId}`
);
const { data } = await response.json();
// data.slots contains available time slots
```

## Next Steps (Future Enhancements)

1. **Reminder System:**

   - SMS/Email reminders 24 hours before appointment
   - Integration with Twilio/SendGrid
   - Reminder preferences per patient

2. **Recurring Appointments:**

   - Weekly/monthly recurring patterns
   - Bulk scheduling

3. **Waiting List:**

   - Add patients to waiting list if no slots available
   - Auto-notify when slot opens

4. **Calendar View:**

   - Day/week/month calendar visualization
   - Drag-and-drop rescheduling
   - Color-coded by type or status

5. **Analytics:**

   - Appointment trends
   - No-show rates
   - Practitioner utilization

6. **Integration:**
   - Sync with Google Calendar
   - iCal export
   - Patient portal for self-booking

## Technical Notes

- Next.js 16 async params: All dynamic routes use `Promise<{ id: string }>` for params
- TypeScript: Full type safety with interfaces for all data structures
- Mongoose: IAppointmentModel interface for static method typing
- Error Handling: 404 for not found, 409 for conflicts, 500 for server errors
- Pagination: Smart page number display (shows max 5 page buttons)
- Responsive: All components mobile-friendly with Tailwind CSS

## Dependencies

- Next.js (App Router)
- React
- NextAuth (session management)
- Mongoose (MongoDB ODM)
- Lucide React (icons)
- Tailwind CSS (styling)

---

**Completion Status:** ✅ Todo #4 Complete
**Documentation Updated:** December 2024
