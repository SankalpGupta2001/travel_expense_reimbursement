import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const cleanValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

export const extractTravelRequestForm = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
  });

  const sheet = workbook.Sheets['Travel Request Form'];

  if (!sheet) {
    throw new Error('Travel Request Form sheet not found');
  }

  const getCell = (cell) => {
    return cleanValue(sheet[cell]?.v);
  };

  const travelRequestData = {
    travelRequestId: getCell('C5'),

    employeeDetails: {
      employeeName: getCell('C8'),
      employeeCode: getCell('F8'),
      designation: getCell('C9'),
      department: getCell('F9'),
      costCentre: getCell('C10'),
      reportingManager: getCell('F10'),
    },

    travelDetails: {
      fromDate: getCell('C13'),
      toDate: getCell('F13'),
      numberOfDays: Number(getCell('C14')) || 0,
      travelCategory: getCell('F14'),
      destination: getCell('C15'),
      currency: getCell('F15'),
      purpose: getCell('C16'),
      modeOfTravel: getCell('F16'),
    },

    estimatedCost: {
      airRail: {
        basis: getCell('C20'),
        amount: Number(getCell('D20')) || 0,
        borneBy: getCell('E20'),
      },

      lodging: {
        basis: getCell('C21'),
        amount: Number(getCell('D21')) || 0,
        borneBy: getCell('E21'),
      },

      localConveyance: {
        basis: getCell('C22'),
        amount: Number(getCell('D22')) || 0,
        borneBy: getCell('E22'),
      },

      mealsAllowance: {
        basis: getCell('C23'),
        amount: Number(getCell('D23')) || 0,
        borneBy: getCell('E23'),
      },

      other: {
        amount: Number(getCell('D24')) || 0,
        borneBy: getCell('E24'),
      },

      total: Number(getCell('D25')) || 0,
    },

    travelAdvance: {
      requested: Number(getCell('D27')) || 0,
    },
  };

  return {
    fileName: path.basename(filePath),
    data: travelRequestData,
  };
};

export const formatTravelRequestForAI = (result) => {
  return JSON.stringify(result.data, null, 2);
};
