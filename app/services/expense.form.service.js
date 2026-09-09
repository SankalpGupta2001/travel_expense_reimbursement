import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const ensureDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const setCell = (sheet, cell, value) => {
  const existingCell = sheet[cell] || {};

  sheet[cell] = {
    ...existingCell,
    t: typeof value === 'number' ? 'n' : 's',
    v: value ?? '',
  };
};

const setFormula = (sheet, cell, formula) => {
  const existingCell = sheet[cell] || {};

  sheet[cell] = {
    ...existingCell,
    t: 'n',
    f: formula,
  };
};

const clearCell = (sheet, cell) => {
  const existingCell = sheet[cell] || {};

  sheet[cell] = {
    ...existingCell,
    t: 's',
    v: '',
  };
};

const fillHeader = (sheet, claim) => {
  const employee =
    claim.employeeDetails || {};

  const travel =
    claim.travelDetails || {};

  setCell(
    sheet,
    'C5',
    travel.travelRequestId || ''
  );

  clearCell(sheet, 'F5');

  setCell(
    sheet,
    'C6',
    employee.employeeName || ''
  );

  setCell(
    sheet,
    'F6',
    employee.employeeCode || ''
  );

  setCell(
    sheet,
    'C7',
    employee.costCentre || ''
  );

  setCell(
    sheet,
    'F7',
    travel.currency || 'INR'
  );
};

const fillLodging = (sheet, claim) => {
  const lodging =
    claim.lodging || [];

  for (let row = 11; row <= 14; row += 1) {
    clearCell(sheet, `B${row}`);
    clearCell(sheet, `C${row}`);
    clearCell(sheet, `D${row}`);
    clearCell(sheet, `E${row}`);
    clearCell(sheet, `F${row}`);
    clearCell(sheet, `G${row}`);
    clearCell(sheet, `H${row}`);
    clearCell(sheet, `I${row}`);
  }

  lodging
    .slice(0, 4)
    .forEach((item, index) => {
      const row = 11 + index;

      setCell(
        sheet,
        `B${row}`,
        item.checkIn || ''
      );

      setCell(
        sheet,
        `C${row}`,
        item.checkOut || ''
      );

      setCell(
        sheet,
        `D${row}`,
        numberValue(item.nights)
      );

      setCell(
        sheet,
        `E${row}`,
        item.hotelName || ''
      );

      setCell(
        sheet,
        `F${row}`,
        item.city || ''
      );

      setCell(
        sheet,
        `G${row}`,
        item.paidBy || ''
      );

      setCell(
        sheet,
        `H${row}`,
        numberValue(item.amount)
      );

      setCell(
        sheet,
        `I${row}`,
        item.proofRef || ''
      );
    });

  setFormula(
    sheet,
    'H15',
    '=SUM(H11:H14)'
  );
};

const fillTransportation = (
  sheet,
  claim
) => {
  const transportation =
    claim.transportation || [];

  for (let row = 19; row <= 28; row += 1) {
    clearCell(sheet, `B${row}`);
    clearCell(sheet, `C${row}`);
    clearCell(sheet, `D${row}`);
    clearCell(sheet, `E${row}`);
    clearCell(sheet, `F${row}`);
    clearCell(sheet, `G${row}`);
    clearCell(sheet, `H${row}`);
    clearCell(sheet, `I${row}`);
  }

  transportation
    .slice(0, 10)
    .forEach((item, index) => {
      const row = 19 + index;

      setCell(
        sheet,
        `B${row}`,
        item.date || ''
      );

      setCell(
        sheet,
        `C${row}`,
        item.time || ''
      );

      setCell(
        sheet,
        `D${row}`,
        item.from || ''
      );

      setCell(
        sheet,
        `E${row}`,
        item.to || ''
      );

      setCell(
        sheet,
        `F${row}`,
        item.mode || ''
      );

      setCell(
        sheet,
        `G${row}`,
        item.paidBy || ''
      );

      setCell(
        sheet,
        `H${row}`,
        numberValue(item.amount)
      );

      setCell(
        sheet,
        `I${row}`,
        item.proofRef || ''
      );
    });

  setFormula(
    sheet,
    'H29',
    '=SUM(H19:H28)'
  );
};

const fillOtherExpenses = (
  sheet,
  claim
) => {
  const otherExpenses =
    claim.otherExpenses || [];

  for (let row = 33; row <= 40; row += 1) {
    clearCell(sheet, `B${row}`);
    clearCell(sheet, `C${row}`);
    clearCell(sheet, `D${row}`);
    clearCell(sheet, `G${row}`);
    clearCell(sheet, `H${row}`);
    clearCell(sheet, `I${row}`);
  }

  otherExpenses
    .slice(0, 8)
    .forEach((item, index) => {
      const row = 33 + index;

      setCell(
        sheet,
        `B${row}`,
        item.date || ''
      );

      setCell(
        sheet,
        `C${row}`,
        item.head || ''
      );

      setCell(
        sheet,
        `D${row}`,
        item.description || ''
      );

      setCell(
        sheet,
        `G${row}`,
        item.paidBy || ''
      );

      setCell(
        sheet,
        `H${row}`,
        numberValue(item.amount)
      );

      setCell(
        sheet,
        `I${row}`,
        item.proofRef || ''
      );
    });

  setFormula(
    sheet,
    'H41',
    '=SUM(H33:H40)'
  );
};

const fillSettlementSummary = (
  sheet,
  claim
) => {
  const summary =
    claim.settlementSummary || {};

  setFormula(
    sheet,
    'H44',
    '=SUMIF(G11:G14,"Employee",H11:H14)+SUMIF(G19:G28,"Employee",H19:H28)+SUMIF(G33:G40,"Employee",H33:H40)'
  );

  setFormula(
    sheet,
    'H45',
    '=SUMIF(G11:G14,"Company",H11:H14)+SUMIF(G19:G28,"Company",H19:H28)+SUMIF(G33:G40,"Company",H33:H40)'
  );

  setCell(
    sheet,
    'H46',
    numberValue(
      summary.nonReimbursable
    )
  );

  setFormula(
    sheet,
    'H47',
    '=H44-H46'
  );

  setCell(
    sheet,
    'H48',
    numberValue(
      summary.travelAdvance ??
      claim.travelAdvance?.drawn ??
      0
    )
  );

  setFormula(
    sheet,
    'H49',
    '=IF(H47-H48>0,H47-H48,0)'
  );

  setFormula(
    sheet,
    'H50',
    '=IF(H48-H47>0,H48-H47,0)'
  );
};

const fillApprovalSection = (
  sheet,
  claim
) => {
  const employee =
    claim.employeeDetails || {};

  const workflow =
    claim.approvalWorkflow || [];

  setCell(
    sheet,
    'D54',
    employee.employeeName || ''
  );

  workflow.forEach((item) => {
    const role =
      (item.role || '').toLowerCase();

    let row = null;

    if (
      role.includes(
        'reporting manager'
      )
    ) {
      row = 55;
    } else if (
      role.includes(
        'head of department'
      ) ||
      role.includes('hod')
    ) {
      row = 56;
    } else if (
      role.includes('finance')
    ) {
      row = 57;
    }

    if (!row) {
      return;
    }

    setCell(
      sheet,
      `D${row}`,
      item.name || ''
    );
  });
};

export const generateExpenseSettlementForm =
  async ({
    claim,
    templatePath,
    outputDirectory,
  }) => {
    if (!claim) {
      throw new Error(
        'Claim data is required'
      );
    }

    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Settlement template not found: ${templatePath}`
      );
    }

    ensureDirectory(
      outputDirectory
    );

    const workbook =
      XLSX.readFile(
        templatePath
      );

    const sheet =
      workbook.Sheets[
        'Expense Settlement Form'
      ];

    if (!sheet) {
      throw new Error(
        'Expense Settlement Form sheet not found'
      );
    }

    fillHeader(
      sheet,
      claim
    );

    fillLodging(
      sheet,
      claim
    );

    fillTransportation(
      sheet,
      claim
    );

    fillOtherExpenses(
      sheet,
      claim
    );

    fillSettlementSummary(
      sheet,
      claim
    );

    fillApprovalSection(
      sheet,
      claim
    );

    workbook.Workbook =
      workbook.Workbook || {};

    workbook.Workbook.CalcPr = {
      calcMode: 'auto',
      fullCalcOnLoad: true,
      forceFullCalc: true,
    };

    const travelRequestId =
      claim.travelDetails
        ?.travelRequestId ||
      'travel-expense';

    const safeId =
      travelRequestId.replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      );

    const fileName =
      `${safeId}_Expense_Settlement.xlsx`;

    const outputPath =
      path.join(
        outputDirectory,
        fileName
      );

    XLSX.writeFile(
      workbook,
      outputPath
    );

    return {
      fileName,
      filePath: outputPath,
    };
  };
