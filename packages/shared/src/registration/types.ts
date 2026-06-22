export enum RegistrationFieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  DROPDOWN = 'DROPDOWN',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export enum StandardRegistrationField {
  FULL_NAME = 'FULL_NAME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CITY = 'CITY',
  STATE = 'STATE',
  COUNTRY = 'COUNTRY',
  COMPANY = 'COMPANY',
  DESIGNATION = 'DESIGNATION',
  WEBSITE = 'WEBSITE',
  LINKEDIN = 'LINKEDIN',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  JOINED = 'JOINED',
}

export interface RegistrationFieldOption {
  fieldKey: string;
  label: string;
  fieldType: RegistrationFieldType;
  standardField?: StandardRegistrationField | null;
  isRequired: boolean;
  isEnabled: boolean;
  isLocked?: boolean;
  sortOrder: number;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  isCustom?: boolean;
}

export interface RegistrationFormSettings {
  requireApproval: boolean;
  autoApprove: boolean;
  sendConfirmationEmail: boolean;
  limitRegistrations: boolean;
  maxRegistrations?: number | null;
}

export interface RegistrationFormConfig {
  settings: RegistrationFormSettings;
  fields: RegistrationFieldOption[];
}

export const DEFAULT_REGISTRATION_FORM_SETTINGS: RegistrationFormSettings = {
  requireApproval: false,
  autoApprove: true,
  sendConfirmationEmail: false,
  limitRegistrations: false,
  maxRegistrations: null,
};

export const OPTIONAL_STANDARD_FIELDS: Array<{
  fieldKey: string;
  label: string;
  standardField: StandardRegistrationField;
  fieldType: RegistrationFieldType;
}> = [
  { fieldKey: 'phone', label: 'Phone Number', standardField: StandardRegistrationField.PHONE, fieldType: RegistrationFieldType.PHONE },
  { fieldKey: 'city', label: 'City', standardField: StandardRegistrationField.CITY, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'state', label: 'State', standardField: StandardRegistrationField.STATE, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'country', label: 'Country', standardField: StandardRegistrationField.COUNTRY, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'company', label: 'Company', standardField: StandardRegistrationField.COMPANY, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'designation', label: 'Designation', standardField: StandardRegistrationField.DESIGNATION, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'website', label: 'Website', standardField: StandardRegistrationField.WEBSITE, fieldType: RegistrationFieldType.TEXT },
  { fieldKey: 'linkedin', label: 'LinkedIn URL', standardField: StandardRegistrationField.LINKEDIN, fieldType: RegistrationFieldType.TEXT },
];

export function createDefaultRegistrationFormConfig(): RegistrationFormConfig {
  return {
    settings: { ...DEFAULT_REGISTRATION_FORM_SETTINGS },
    fields: [
      {
        fieldKey: 'full_name',
        label: 'Full Name',
        fieldType: RegistrationFieldType.TEXT,
        standardField: StandardRegistrationField.FULL_NAME,
        isRequired: true,
        isEnabled: true,
        isLocked: true,
        sortOrder: 0,
      },
      {
        fieldKey: 'email',
        label: 'Email Address',
        fieldType: RegistrationFieldType.EMAIL,
        standardField: StandardRegistrationField.EMAIL,
        isRequired: true,
        isEnabled: true,
        isLocked: true,
        sortOrder: 1,
      },
    ],
  };
}

export function canJoinWithRegistrationStatus(status: RegistrationStatus): boolean {
  return status === RegistrationStatus.APPROVED || status === RegistrationStatus.JOINED;
}

export function standardFieldColumnKey(
  standardField: StandardRegistrationField | null | undefined,
): keyof RegistrationStandardValues | null {
  if (!standardField) return null;
  const map: Record<StandardRegistrationField, keyof RegistrationStandardValues> = {
    [StandardRegistrationField.FULL_NAME]: 'fullName',
    [StandardRegistrationField.EMAIL]: 'email',
    [StandardRegistrationField.PHONE]: 'phone',
    [StandardRegistrationField.CITY]: 'city',
    [StandardRegistrationField.STATE]: 'state',
    [StandardRegistrationField.COUNTRY]: 'country',
    [StandardRegistrationField.COMPANY]: 'company',
    [StandardRegistrationField.DESIGNATION]: 'designation',
    [StandardRegistrationField.WEBSITE]: 'website',
    [StandardRegistrationField.LINKEDIN]: 'linkedInUrl',
  };
  return map[standardField] ?? null;
}

export interface RegistrationStandardValues {
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  company?: string | null;
  designation?: string | null;
  website?: string | null;
  linkedInUrl?: string | null;
}
