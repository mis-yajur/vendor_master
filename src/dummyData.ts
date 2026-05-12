import { Vendor } from './types/vendor';

export const DUMMY_VENDORS: Vendor[] = [
  {
    id: 'V001',
    name: 'Teckno Systems Ltd',
    requestType: 'New',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'INR',
    creditTerms: 'NET 30',
    address: {
      floorBuilding: 'Level 4, Orion Tower',
      street: '12th Main Road',
      city: 'Bangalore',
      district: 'Urban',
      pinCode: '560001',
      state: 'Karnataka',
      country: 'India',
      phone: '080-12345678',
      mobile: '+91 98765 43210',
      email: 'contact@tecknosys.com'
    },
    contact: {
      name: 'Rahul Sharma',
      designation: 'Sales Director',
      phone: '98765 12345',
      email: 'rahul@tecknosys.com'
    },
    statutory: {
      vendorType: 'Goods',
      constitution: 'Private Limited',
      yearOfEstablishment: '2015',
      pan: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      cin: 'U72200KA2015PTC012345',
      compoundingDealer: 'NO'
    },
    bank: {
      beneficiaryName: 'Teckno Systems Ltd',
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      branchName: 'Koramangala',
      branchAddress: 'Koramangala 4th Block',
      accountType: 'Current',
      ifscCode: 'HDFC0000001'
    },
    documents: {
      gstinCopy: 'https://example.com/gstin.pdf',
      panCopy: 'https://example.com/pan.pdf',
      msmedCopy: 'https://example.com/msmed.pdf',
      cancelledChequeCopy: 'https://example.com/cheque.pdf',
      signedDeclaration: 'https://example.com/decl.pdf'
    }
  },
  {
    id: 'V002',
    name: 'Global Logistics Solutions',
    requestType: 'Change',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'INR',
    creditTerms: 'NET 45',
    address: {
      floorBuilding: 'Plot 45',
      street: 'Nh 8, Industrial Area',
      city: 'Gurgaon',
      district: 'Gurgaon',
      pinCode: '122001',
      state: 'Haryana',
      country: 'India',
      phone: '0124-4567890',
      mobile: '+91 88888 77777',
      email: 'ops@globallogistics.in'
    },
    contact: {
      name: 'Amit Verma',
      designation: 'Operations Manager',
      phone: '99999 00000',
      email: 'amit@globallogistics.in'
    },
    statutory: {
      vendorType: 'Services',
      constitution: 'LLP',
      yearOfEstablishment: '2010',
      pan: 'GHIJK5678L',
      gstin: '06GHIJK5678L1Z1',
      compoundingDealer: 'NO'
    },
    bank: {
      beneficiaryName: 'Global Logistics Solutions',
      bankName: 'ICICI Bank',
      accountNumber: '000105001234',
      branchName: 'Cyber Hub',
      branchAddress: 'Cyber Hub DLF phase 2',
      accountType: 'Current',
      ifscCode: 'ICIC0000001'
    },
    documents: {
      gstinCopy: '#',
      panCopy: '#',
      cancelledChequeCopy: '#',
      signedDeclaration: '#'
    }
  }
];
