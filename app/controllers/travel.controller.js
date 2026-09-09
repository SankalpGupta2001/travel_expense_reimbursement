import path from 'path';
import { fileURLToPath } from 'url';
import { extractAllEmails, formatEmailsForAI } from '../services/email.service.js';
import { extractAllImages, formatImagesForAI, closeImageWorker } from '../services/image.service.js';
import { extractCsvData, formatCsvForAI } from '../services/csv.service.js';
import { generateExpenseSettlement } from '../services/ai.service.js';
import { generateExpenseSettlementForm } from '../services/expense.form.service.js';
import { extractTravelRequestForm, formatTravelRequestForAI } from '../services/xlsx.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, '../../data/expensepack');
const emailDirectory = path.join(dataDirectory, 'sample_emails');
const receiptDirectory = path.join(dataDirectory, 'receipts');
const employeeCsvPath = path.join(dataDirectory, 'employee_master.csv');
const expenseFormTemplatePath = path.join(dataDirectory,'Travel_Expense_Forms_Template.xlsx');
const outputDirectory = path.join(__dirname, '../../output');

export const processExpenses = async (req, res, next) => {
  try {
    console.log('\n1. Extracting emails...');
    const emails = await extractAllEmails(emailDirectory);
    console.log(`Extracted ${emails.length} emails`);
    const emailText = formatEmailsForAI(emails)
    console.log('\n2. Extracting receipt text...');
    const receipts = await extractAllImages(receiptDirectory);
    console.log(`Extracted ${receipts.length} receipts`);
    const receiptText = formatImagesForAI(receipts);
    console.log('\n3. Reading employee master CSV...');
    const employeeCsv = await extractCsvData(employeeCsvPath);
    console.log(`Loaded ${employeeCsv.data.length} employee records`);
    const employeeText = formatCsvForAI(employeeCsv);
    console.log('\n4. Reading Travel Request Form...');
    const travelData = await extractTravelRequestForm(expenseFormTemplatePath);
    console.log('Travel Request Form loaded');
    const travelDataText = await formatTravelRequestForAI(travelData);
    console.log('\n5. Sending extracted data to AI...');
    const result = await generateExpenseSettlement({
      employeeMasterData: employeeText,
      travelRequestData: travelDataText,
      emails: emailText,
      receipts: receiptText,
    });
    console.log('\n6. AI processing completed.', result);
    console.log('\n7. Generating Expense Settlement Form...');
    const generatedForm = await generateExpenseSettlementForm({
      claim: result,
      templatePath: expenseFormTemplatePath,
      outputDirectory
    });
    console.log(`Generated: ${generatedForm.fileName}`);
    res.status(200).json({
      success: true,
      sourceSummary: {
        emails: emails.length,
        receipts: receipts.length,
        employees: employeeCsv.data.length,
        travelRequest: true,
      },
      data: result,
      settlementForm: {
        fileName: generatedForm.fileName,
        downloadUrl: `/api/expenses/download/${encodeURIComponent(generatedForm.fileName)}`,
      },
    });
  } catch (error) {
    console.error('Error processing travel expenses:', error);
    next(error);
  } finally {
    await closeImageWorker();
  }
};
