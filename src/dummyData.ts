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
  },
  {
    id: 'V003',
    name: 'Zenith Consultancy Services',
    requestType: 'New',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'USD',
    creditTerms: 'NET 15',
    address: {
      floorBuilding: 'High Street Mall',
      street: '3rd Floor, Wing A',
      city: 'Pune',
      district: 'Pune',
      pinCode: '411001',
      state: 'Maharashtra',
      country: 'India',
      phone: '020-22334455',
      mobile: '+91 77777 66666',
      email: 'info@zenithcon.com'
    },
    contact: {
      name: 'Priya Nair',
      designation: 'HR Head',
      phone: '77777 66666',
      email: 'priya@zenithcon.com'
    },
    statutory: {
      vendorType: 'Services',
      constitution: 'Public Limited',
      yearOfEstablishment: '2005',
      pan: 'MNPQR9012M',
      gstin: '27MNPQR9012M1Z2',
      compoundingDealer: 'NO'
    },
    bank: {
      beneficiaryName: 'Zenith Consultancy Services',
      bankName: 'Axis Bank',
      accountNumber: '91200344556677',
      branchName: 'Baner',
      branchAddress: 'Baner Main Road',
      accountType: 'Current',
      ifscCode: 'UTIB0000001'
    },
    documents: {
      gstinCopy: '#',
      panCopy: '#'
    }
  },
  {
    id: 'V004',
    name: 'Bajaj Power & Equipment',
    requestType: 'New',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'INR',
    creditTerms: 'NET 30',
    address: {
      floorBuilding: 'A/4-5',
      street: 'MIDC Phase II',
      city: 'Nashik',
      district: 'Nashik',
      pinCode: '422010',
      state: 'Maharashtra',
      country: 'India',
      phone: '0253-223344',
      mobile: '+91 90000 11111',
      email: 'sales@bajajpower.com'
    },
    contact: {
      name: 'Suresh Patil',
      designation: 'Partner',
      phone: '90000 11111',
      email: 'suresh@bajajpower.com'
    },
    statutory: {
      vendorType: 'Goods',
      constitution: 'Partnership',
      yearOfEstablishment: '1998',
      pan: 'STUVW3456T',
      gstin: '27STUVW3456T1Z9',
      compoundingDealer: 'YES'
    },
    bank: {
      beneficiaryName: 'Bajaj Power & Equipment',
      bankName: 'State Bank of India',
      accountNumber: '33344455566',
      branchName: 'Nashik Industrial',
      branchAddress: 'MIDC Road Nashik',
      accountType: 'CC/OD',
      ifscCode: 'SBIN0000001'
    },
    documents: {
      gstinCopy: '#',
      panCopy: '#',
      cancelledChequeCopy: '#'
    }
  },
  {
    id: 'V005',
    name: 'Swift IT Solutions',
    requestType: 'New',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'INR',
    creditTerms: 'NET 30',
    address: {
      floorBuilding: 'Tower B',
      street: 'IT Park',
      city: 'Hyderabad',
      district: 'Hyderabad',
      pinCode: '500081',
      state: 'Telangana',
      country: 'India',
      mobile: '+91 91111 22222',
      email: 'contact@swiftit.com'
    },
    contact: {
      name: 'Kiran Kumar',
      designation: 'CEO',
      phone: '91111 22222',
      email: 'kiran@swiftit.com'
    },
    statutory: {
      vendorType: 'Services',
      constitution: 'Private Limited',
      yearOfEstablishment: '2020',
      pan: 'GHYUK1234H',
      gstin: '36GHYUK1234H1Z0',
      compoundingDealer: 'NO'
    },
    bank: {
      beneficiaryName: 'Swift IT Solutions',
      bankName: 'Axis Bank',
      accountNumber: '912000011122233',
      branchName: 'Hitech City',
      branchAddress: 'Hitech City Road',
      accountType: 'Current',
      ifscCode: 'UTIB0001234'
    },
    documents: {}
  }
];
