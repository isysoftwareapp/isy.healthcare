/**
 * RBAC Permissions Configuration
 * Defines permissions for all user roles across the system
 */

import { UserRole } from "./dbTypes";

/**
 * Resource types in the system
 */
export enum Resource {
  // Patient Management
  Patient = "patient",
  PatientPhoto = "patient_photo",
  PatientPassport = "patient_passport",

  // Clinical
  EHR = "ehr",
  Consultation = "consultation",
  Prescription = "prescription",
  LabOrder = "lab_order",
  RadiologyOrder = "radiology_order",

  // Administrative
  Appointment = "appointment",
  User = "user",
  Clinic = "clinic",
  Template = "template",

  // Financial
  Invoice = "invoice",
  Payment = "payment",
  Pricelist = "pricelist",
  InsuranceClaim = "insurance_claim",
  FinancialReport = "financial_report",

  // Laboratory
  LabResult = "lab_result",
  LabInventory = "lab_inventory",

  // Radiology
  RadiologyResult = "radiology_result",
  RadiologyImage = "radiology_image",

  // Pharmacy
  Medication = "medication",
  PharmacyInventory = "pharmacy_inventory",
  Dispensing = "dispensing",

  // System
  AuditLog = "audit_log",
  SystemSettings = "system_settings",
}

/**
 * Action types that can be performed on resources
 */
export enum Action {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",

  // Special actions
  ReadSensitive = "read_sensitive", // For passport/ID scans
  Approve = "approve",
  Export = "export",
  Print = "print",
}

/**
 * Permission definition
 */
export interface Permission {
  resource: Resource;
  actions: Action[];
  scope?: "own" | "clinic" | "global"; // Data scope
  conditions?: ((context: any) => boolean)[]; // Additional conditions
}

/**
 * Role-based permission matrix
 * Maps each role to their allowed permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // ============================================
  // ADMIN - Full system access
  // ============================================
  [UserRole.Admin]: [
    // All resources with all actions
    {
      resource: Resource.Patient,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.PatientPhoto,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.PatientPassport,
      actions: [
        Action.Create,
        Action.Read,
        Action.ReadSensitive,
        Action.Update,
        Action.Delete,
      ],
      scope: "global",
    },
    {
      resource: Resource.EHR,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Consultation,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Prescription,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.LabOrder,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.RadiologyOrder,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Appointment,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.User,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Clinic,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Template,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Invoice,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Payment,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.Pricelist,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.InsuranceClaim,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    {
      resource: Resource.FinancialReport,
      actions: [Action.Read, Action.Export],
      scope: "global",
    },
    {
      resource: Resource.AuditLog,
      actions: [Action.Read, Action.Export],
      scope: "global",
    },
    {
      resource: Resource.SystemSettings,
      actions: [Action.Read, Action.Update],
      scope: "global",
    },
  ],

  // ============================================
  // DIRECTOR - Management and reporting
  // ============================================
  [UserRole.Director]: [
    { resource: Resource.Patient, actions: [Action.Read], scope: "global" },
    {
      resource: Resource.PatientPassport,
      actions: [Action.Read, Action.ReadSensitive],
      scope: "global",
    },
    { resource: Resource.EHR, actions: [Action.Read], scope: "global" },
    {
      resource: Resource.Consultation,
      actions: [Action.Read],
      scope: "global",
    },
    { resource: Resource.Appointment, actions: [Action.Read], scope: "global" },
    { resource: Resource.User, actions: [Action.Read], scope: "global" },
    {
      resource: Resource.Clinic,
      actions: [Action.Read, Action.Update],
      scope: "global",
    },
    {
      resource: Resource.Template,
      actions: [Action.Read, Action.Create, Action.Update],
      scope: "global",
    },
    { resource: Resource.Invoice, actions: [Action.Read], scope: "global" },
    {
      resource: Resource.FinancialReport,
      actions: [Action.Read, Action.Export],
      scope: "global",
    },
    {
      resource: Resource.Pricelist,
      actions: [Action.Read, Action.Update],
      scope: "global",
    },
    {
      resource: Resource.AuditLog,
      actions: [Action.Read, Action.Export],
      scope: "global",
    },
  ],

  // ============================================
  // OPERATIONAL - Cross-clinic operations
  // ============================================
  [UserRole.Operational]: [
    {
      resource: Resource.Patient,
      actions: [Action.Read, Action.Update],
      scope: "global",
    },
    {
      resource: Resource.Appointment,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "global",
    },
    { resource: Resource.Clinic, actions: [Action.Read], scope: "global" },
    { resource: Resource.Template, actions: [Action.Read], scope: "global" },
    { resource: Resource.User, actions: [Action.Read], scope: "global" },
  ],

  // ============================================
  // DOCTOR - Clinical operations
  // ============================================
  [UserRole.Doctor]: [
    {
      resource: Resource.Patient,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.PatientPhoto,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.EHR,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Consultation,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Prescription,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.LabOrder,
      actions: [Action.Create, Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.RadiologyOrder,
      actions: [Action.Create, Action.Read],
      scope: "clinic",
    },
    { resource: Resource.LabResult, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.RadiologyResult,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.Appointment,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    { resource: Resource.Template, actions: [Action.Read], scope: "clinic" },
  ],

  // ============================================
  // NURSE - Patient care and vitals
  // ============================================
  [UserRole.Nurse]: [
    {
      resource: Resource.Patient,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.PatientPhoto,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.EHR,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Consultation,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.Prescription,
      actions: [Action.Read],
      scope: "clinic",
    },
    { resource: Resource.LabOrder, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.RadiologyOrder,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.Appointment,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
  ],

  // ============================================
  // RECEPTION - Front desk operations
  // ============================================
  [UserRole.Reception]: [
    {
      resource: Resource.Patient,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.PatientPhoto,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Appointment,
      actions: [Action.Create, Action.Read, Action.Update, Action.Delete],
      scope: "clinic",
    },
    {
      resource: Resource.Invoice,
      actions: [Action.Create, Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.Payment,
      actions: [Action.Create, Action.Read],
      scope: "clinic",
    },
  ],

  // ============================================
  // FINANCE - Billing and financial operations
  // ============================================
  [UserRole.Finance]: [
    { resource: Resource.Patient, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.PatientPassport,
      actions: [Action.Read, Action.ReadSensitive],
      scope: "clinic",
    },
    {
      resource: Resource.Invoice,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Payment,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Pricelist,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.InsuranceClaim,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.FinancialReport,
      actions: [Action.Read, Action.Export],
      scope: "clinic",
    },
  ],

  // ============================================
  // LABORATORY - Lab operations
  // ============================================
  [UserRole.Laboratory]: [
    { resource: Resource.Patient, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.LabOrder,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.LabResult,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.LabInventory,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
  ],

  // ============================================
  // RADIOLOGY - Imaging operations
  // ============================================
  [UserRole.Radiology]: [
    { resource: Resource.Patient, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.RadiologyOrder,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.RadiologyResult,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.RadiologyImage,
      actions: [Action.Create, Action.Read, Action.Update],
      scope: "clinic",
    },
  ],

  // ============================================
  // PHARMACY - Medication dispensing
  // ============================================
  [UserRole.Pharmacy]: [
    { resource: Resource.Patient, actions: [Action.Read], scope: "clinic" },
    {
      resource: Resource.Prescription,
      actions: [Action.Read],
      scope: "clinic",
    },
    {
      resource: Resource.Medication,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.PharmacyInventory,
      actions: [Action.Read, Action.Update],
      scope: "clinic",
    },
    {
      resource: Resource.Dispensing,
      actions: [Action.Create, Action.Read],
      scope: "clinic",
    },
  ],
};

/**
 * Helper function to get permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has permission for a specific action on a resource
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = getPermissionsForRole(role);

  return permissions.some(
    (perm) => perm.resource === resource && perm.actions.includes(action)
  );
}

/**
 * Get the scope for a role's permission on a resource
 */
export function getPermissionScope(
  role: UserRole,
  resource: Resource
): "own" | "clinic" | "global" | null {
  const permissions = getPermissionsForRole(role);
  const permission = permissions.find((perm) => perm.resource === resource);

  return permission?.scope || null;
}
