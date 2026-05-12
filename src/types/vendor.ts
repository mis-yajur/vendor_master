/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VendorType = 'Goods' | 'Services';
export type ConstitutionType = 'Proprietary' | 'Partnership' | 'Private Limited' | 'Public Limited' | 'LLP' | 'Trust';
export type AccountType = 'Savings' | 'Current' | 'CC/OD';

export interface VendorAddress {
  floorBuilding: string;
  street: string;
  city: string;
  district: string;
  pinCode: string;
  state: string;
  country: string;
  phone?: string;
  fax?: string;
  mobile: string;
  email: string;
}

export interface VendorContact {
  name: string;
  designation: string;
  phone: string;
  fax?: string;
  email: string;
}

export interface StatutoryDetails {
  vendorType: VendorType;
  yearOfEstablishment: string;
  constitution: ConstitutionType;
  cin?: string;
  tradeLicense?: string;
  pan: string;
  gstin: string;
  lutNo?: string;
  compoundingDealer: 'YES' | 'NO';
  msmedRegNo?: string;
  iecNo?: string;
  pfRegNo?: string;
  esicRegNo?: string;
  labourLicenseNo?: string;
  factoryLicense?: string;
  tdsExemptionDetails?: string;
  consentToOperate?: string;
}

export interface BankDetails {
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  branchAddress: string;
  accountType: AccountType;
  ifscCode: string;
  swiftIban?: string;
  bankEmail?: string;
}

export interface VendorDocuments {
  gstinCopy?: string; // File ID or URL
  panCopy?: string;
  msmedCopy?: string;
  cancelledChequeCopy?: string;
  tdsExemptionCopy?: string;
}

export interface Vendor {
  id: string; // Document ID or Row Index
  name: string;
  address: VendorAddress;
  contact: VendorContact;
  statutory: StatutoryDetails;
  bank: BankDetails;
  currency: string;
  creditTerms: string;
  documents: VendorDocuments;
  createdAt: string;
  updatedAt: string;
  folderUrl?: string;
  folderId?: string;
}
