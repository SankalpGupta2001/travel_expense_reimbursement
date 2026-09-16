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


const setCell = (
  sheet,
  cell,
  value
) => {

  const existingCell =
    sheet[cell] || {};


  sheet[cell] = {
    ...existingCell,

    t:
      typeof value === 'number'
        ? 'n'
        : 's',

    v:
      value ?? '',
  };

};


const setFormula = (
  sheet,
  cell,
  formula,
  calculatedValue
) => {

  const existingCell =
    sheet[cell] || {};


  sheet[cell] = {
    ...existingCell,

    t: 'n',

    f: formula,

    /*
     * Store the calculated value as the
     * cached value for Excel viewers.
     */
    v:
      calculatedValue !== undefined
        ? numberValue(calculatedValue)
        : 0,
  };

};


const clearCell = (
  sheet,
  cell
) => {

  const existingCell =
    sheet[cell] || {};


  sheet[cell] = {
    ...existingCell,

    t: 's',

    v: '',
  };

};


/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
*/

const fillHeader = (
  sheet,
  claim
) => {

  const employee =
    claim.employeeDetails || {};


  const travel =
    claim.travelDetails || {};


  setCell(
    sheet,
    'C5',
    travel.travelRequestId ||
    claim.travelRequestId ||
    ''
  );


  /*
   * Settlement date.
   *
   * Use today's date only if backend has not
   * supplied one.
   */
  setCell(
    sheet,
    'F5',
    claim.settlementDate ||
    new Date().toISOString().slice(0, 10)
  );


  setCell(
    sheet,
    'C6',
    employee.employeeName ||
    ''
  );


  setCell(
    sheet,
    'F6',
    employee.employeeCode ||
    ''
  );


  setCell(
    sheet,
    'C7',
    employee.costCentre ||
    ''
  );


  setCell(
    sheet,
    'F7',
    travel.currency ||
    'INR'
  );

};


/*
|--------------------------------------------------------------------------
| Lodging
|--------------------------------------------------------------------------
*/

const fillLodging = (
  sheet,
  claim
) => {

  const lodging =
    Array.isArray(
      claim.lodging
    )
      ? claim.lodging
      : claim.lodging
        ? [claim.lodging]
        : [];


  /*
   * Template rows:
   *
   * 11 - 14 = lodging data
   * 15 = total
   */

  for (
    let row = 11;
    row <= 14;
    row += 1
  ) {

    clearCell(
      sheet,
      `B${row}`
    );

    clearCell(
      sheet,
      `C${row}`
    );

    clearCell(
      sheet,
      `D${row}`
    );

    clearCell(
      sheet,
      `E${row}`
    );

    clearCell(
      sheet,
      `F${row}`
    );

    clearCell(
      sheet,
      `G${row}`
    );

    clearCell(
      sheet,
      `H${row}`
    );

    clearCell(
      sheet,
      `I${row}`
    );

  }


  lodging
    .slice(0, 4)
    .forEach(
      (item, index) => {

        const row =
          11 + index;


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
          numberValue(
            item.nights
          )
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


        /*
         * Template explicitly requires:
         * Employee OR Company.
         */
        setCell(
          sheet,
          `G${row}`,
          item.paidBy || ''
        );


        setCell(
          sheet,
          `H${row}`,
          numberValue(
            item.amount
          )
        );


        setCell(
          sheet,
          `I${row}`,
          item.proofRef || ''
        );

      }
    );


  /*
   * Keep template total as formula.
   */
  setFormula(
    sheet,
    'H15',
    '=SUM(H11:H14)'
  );

};


/*
|--------------------------------------------------------------------------
| Transportation
|--------------------------------------------------------------------------
*/

const fillTransportation = (
  sheet,
  claim
) => {

  const transportation =
    Array.isArray(
      claim.transportation
    )
      ? claim.transportation
      : [];


  /*
   * Template rows:
   *
   * 19 - 28 = transportation
   * 29 = total
   */

  for (
    let row = 19;
    row <= 28;
    row += 1
  ) {

    clearCell(
      sheet,
      `B${row}`
    );

    clearCell(
      sheet,
      `C${row}`
    );

    clearCell(
      sheet,
      `D${row}`
    );

    clearCell(
      sheet,
      `E${row}`
    );

    clearCell(
      sheet,
      `F${row}`
    );

    clearCell(
      sheet,
      `G${row}`
    );

    clearCell(
      sheet,
      `H${row}`
    );

    clearCell(
      sheet,
      `I${row}`
    );

  }


  transportation
    .slice(0, 10)
    .forEach(
      (item, index) => {

        const row =
          19 + index;


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
          numberValue(
            item.amount
          )
        );


        setCell(
          sheet,
          `I${row}`,
          item.proofRef || ''
        );

      }
    );


  setFormula(
    sheet,
    'H29',
    '=SUM(H19:H28)'
  );

};


/*
|--------------------------------------------------------------------------
| Other Expenses
|--------------------------------------------------------------------------
*/

const fillOtherExpenses = (
  sheet,
  claim
) => {

  const otherExpenses =
    Array.isArray(
      claim.otherExpenses
    )
      ? claim.otherExpenses
      : [];


  /*
   * Template rows:
   *
   * 33 - 40 = other expenses
   * 41 = total
   */

  for (
    let row = 33;
    row <= 40;
    row += 1
  ) {

    clearCell(
      sheet,
      `B${row}`
    );

    clearCell(
      sheet,
      `C${row}`
    );

    clearCell(
      sheet,
      `D${row}`
    );

    clearCell(
      sheet,
      `G${row}`
    );

    clearCell(
      sheet,
      `H${row}`
    );

    clearCell(
      sheet,
      `I${row}`
    );

  }


  otherExpenses
    .slice(0, 8)
    .forEach(
      (item, index) => {

        const row =
          33 + index;


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
          numberValue(
            item.amount
          )
        );


        setCell(
          sheet,
          `I${row}`,
          item.proofRef || ''
        );

      }
    );


  setFormula(
    sheet,
    'H41',
    '=SUM(H33:H40)'
  );

};


/*
|--------------------------------------------------------------------------
| Settlement Summary
|--------------------------------------------------------------------------
*/

const fillSettlementSummary = (
  sheet,
  claim
) => {

  const summary =
    claim.settlementSummary || {};


  /*
   * IMPORTANT:
   *
   * The backend settlementSummary is the
   * source of truth for the final settlement.
   *
   * We do NOT calculate H44 using SUMIF(Employee)
   * because non-reimbursable employee expenses
   * such as Laundry and Mini Bar are also marked
   * Paid By = Employee.
   *
   * In this case:
   *
   * Total employee claim       = 26,254.04
   * Non-reimbursable            =    830.00
   * Net reimbursable claim     = 25,424.04
   * Travel advance             = 20,000.00
   * Amount payable             =  5,424.04
   */


  const totalEmployeeClaim =
    numberValue(
      summary.totalClaimPaidByEmployee
    );


  const totalCompanyPaid =
    numberValue(
      summary.totalPaidByCompany
    );


  const nonReimbursable =
    numberValue(
      summary.nonReimbursable
    );


  const netReimbursable =
    numberValue(
      summary.netReimbursableClaim
    );


  const travelAdvance =
    numberValue(
      summary.travelAdvance ??
      claim.travelAdvance?.drawn ??
      0
    );


  const amountPayable =
    numberValue(
      summary.amountPayableToEmployee
    );


  const amountRecoverable =
    numberValue(
      summary.amountRecoverableFromEmployee
    );


  /*
   * H44
   *
   * Total claim - paid by employee.
   *
   * Use the backend calculated value.
   */
  setFormula(
    sheet,
    'H44',
    `=${totalEmployeeClaim}`,
    totalEmployeeClaim
  );


  /*
   * H45
   *
   * Total paid by company.
   */
  setFormula(
    sheet,
    'H45',
    `=${totalCompanyPaid}`,
    totalCompanyPaid
  );


  /*
   * H46
   *
   * Less: non-reimbursable / disallowed.
   */
  setCell(
    sheet,
    'H46',
    nonReimbursable
  );


  /*
   * H47
   *
   * Net reimbursable claim.
   */
  setFormula(
    sheet,
    'H47',
    `=${netReimbursable}`,
    netReimbursable
  );


  /*
   * H48
   *
   * Less: travel advance drawn.
   */
  setCell(
    sheet,
    'H48',
    travelAdvance
  );


  /*
   * H49
   *
   * Amount payable to employee.
   */
  setFormula(
    sheet,
    'H49',
    `=${amountPayable}`,
    amountPayable
  );


  /*
   * H50
   *
   * Amount recoverable from employee.
   */
  setFormula(
    sheet,
    'H50',
    `=${amountRecoverable}`,
    amountRecoverable
  );

};


/*
|--------------------------------------------------------------------------
| Approval & Finance Processing
|--------------------------------------------------------------------------
*/

const fillApprovalSection = (
  sheet,
  claim
) => {

  const employee =
    claim.employeeDetails ||
    {};


  const workflow =
    Array.isArray(
      claim.approvalWorkflow
    )
      ? claim.approvalWorkflow
      : [];


  /*
   * Template row 54:
   *
   * Employee (submitted by)
   */
  setCell(
    sheet,
    'D54',
    employee.employeeName ||
    ''
  );


  /*
   * IMPORTANT:
   *
   * Template:
   *
   * 54 Employee
   * 55 Reporting Manager
   * 56 Head of Department
   * 57 Finance - verification
   * 58 Finance - payment released
   *
   * Do not use the old 55-59 mapping.
   */

  workflow.forEach(
    (item) => {

      const role =
        String(
          item.role || ''
        ).toLowerCase();


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
        role.includes('finance') &&
        (
          role.includes('verification') ||
          role.includes('verify')
        )
      ) {

        row = 57;

      } else if (
        role.includes('finance') &&
        (
          role.includes('payment') ||
          role.includes('payout') ||
          role.includes('release')
        )
      ) {

        row = 58;

      }


      if (!row) {
        return;
      }


      setCell(
        sheet,
        `D${row}`,
        item.name || ''
      );


      /*
       * Decision
       */
      if (item.status) {

        setCell(
          sheet,
          `E${row}`,
          item.status
        );

      } else if (item.decision) {

        setCell(
          sheet,
          `E${row}`,
          item.decision
        );

      }


      /*
       * Date
       */
      if (item.date) {

        setCell(
          sheet,
          `F${row}`,
          item.date
        );

      }


      /*
       * Remarks
       */
      if (item.remarks) {

        setCell(
          sheet,
          `G${row}`,
          item.remarks
        );

      }

    }
  );

};


/*
|--------------------------------------------------------------------------
| Generate Expense Settlement Form
|--------------------------------------------------------------------------
*/

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


    /*
     * Read provided Nortex template.
     */
    const workbook =
      XLSX.readFile(
        templatePath
      );


    /*
     * Use exact sheet name from template.
     */
    const sheet =
      workbook.Sheets[
        'Expense Settlement Form'
      ];


    if (!sheet) {

      throw new Error(
        'Expense Settlement Form sheet not found'
      );

    }


    /*
     * Fill sections.
     */
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


    /*
     * Force Excel to recalculate formulas
     * when the user opens the workbook.
     */
    workbook.Workbook =
      workbook.Workbook ||
      {};


    workbook.Workbook.CalcPr = {
      calcMode: 'auto',
      fullCalcOnLoad: true,
      forceFullCalc: true,
    };


    /*
     * File name.
     */
    const travelRequestId =
      claim.travelDetails
        ?.travelRequestId ||
      claim.travelRequestId ||
      'travel-expense';


    const safeId =
      String(
        travelRequestId
      ).replace(
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


    /*
     * Write completed workbook.
     */
    XLSX.writeFile(
      workbook,
      outputPath
    );


    console.log(
      'Settlement Excel generated:',
      outputPath,
      claim,
    );


    return {
      fileName,
      filePath: outputPath,
    };

  };