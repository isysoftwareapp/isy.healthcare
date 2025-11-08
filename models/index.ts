/**
 * Models Index
 * Central export point for all database models
 * Ensures consistent imports across the application
 */

export { default as User } from "./User";
export type { IUser } from "./User";

export { default as Patient } from "./Patient";
export type { IPatient } from "./Patient";

export { default as Service } from "./Service";
export type { IService } from "./Service";

export { default as Clinic } from "./Clinic";
export type { IClinic } from "./Clinic";

export { default as Pricelist } from "./Pricelist";
export type { IPricelist } from "./Pricelist";

export { default as InsuranceProvider } from "./InsuranceProvider";
export type { IInsuranceProvider } from "./InsuranceProvider";

export { default as Template } from "./Template";
export type { ITemplate } from "./Template";
