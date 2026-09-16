import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import {
  extractAllEmails,
  formatEmailsForAI,
} from '../services/email.service.js';

import {
  extractAllImages,
  extractUploadedImages,
  formatImagesForAI,
  closeImageWorker,
} from '../services/image.service.js';

import {
  extractCsvData,
  formatCsvForAI,
} from '../services/csv.service.js';

import {
  generateExpenseSettlement,
} from '../services/ai.service.js';

import {
  generateExpenseSettlementForm,
} from '../services/expense.form.service.js';

import {
  getTravelRequestById,
  updateTravelRequest,
} from '../services/travel-request.service.js';


const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


const dataDirectory =
  path.join(
    __dirname,
    '../../data/expensepack'
  );


const emailDirectory =
  path.join(
    dataDirectory,
    'sample_emails'
  );


const receiptDirectory =
  path.join(
    dataDirectory,
    'receipts'
  );


const employeeCsvPath =
  path.join(
    dataDirectory,
    'employee_master.csv'
  );


const expenseFormTemplatePath =
  path.join(
    dataDirectory,
    'Travel_Expense_Forms_Template.xlsx'
  );


const outputDirectory =
  path.join(
    __dirname,
    '../../output'
  );


const uploadsDirectory =
  path.join(
    __dirname,
    '../../uploads'
  );


const readUploadedImages =
  async (files = []) => {

    return files.map(
      (file) => ({
        fileName:
          file.originalname,

        text:
          '',

        filePath:
          file.path,
      })
    );

  };


/* =========================================================
   SETTLEMENT DEADLINE
   ========================================================= */

const getSettlementDeadline =
  (returnDate) => {

    if (!returnDate) {
      return null;
    }

    const dateString =
      String(returnDate)
        .slice(0, 10);

    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/
        .exec(dateString);

    if (!match) {
      return null;
    }

    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    const day =
      Number(match[3]);

    const deadline =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

    if (
      Number.isNaN(
        deadline.getTime()
      )
    ) {
      return null;
    }

    deadline.setUTCDate(
      deadline.getUTCDate() + 7
    );

    return deadline;
  };


const validateSettlementDeadline =
  (travelRequest) => {

    const returnDate =
      travelRequest
        ?.travelDetails
        ?.toDate;

    if (!returnDate) {

      return {
        valid: false,

        message:
          'Travel Request return date is missing. Settlement deadline cannot be calculated.',
      };

    }


    const deadline =
      getSettlementDeadline(
        returnDate
      );


    if (!deadline) {

      return {
        valid: false,

        message:
          'Travel Request return date is invalid. Settlement deadline cannot be calculated.',
      };

    }


    const today =
      new Date();

    const todayUtc =
      new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );


    const deadlineDate =
      new Date(
        Date.UTC(
          deadline.getUTCFullYear(),
          deadline.getUTCMonth(),
          deadline.getUTCDate()
        )
      );


    if (
      todayUtc >
      deadlineDate
    ) {

      return {
        valid: false,

        expired: true,

        returnDate,

        deadline:
          deadline
            .toISOString()
            .slice(0, 10),

        message:
          `Settlement submission deadline has expired. The claim was due within 7 calendar days of return, by ${deadline.toLocaleDateString(
            'en-IN',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }
          )}.`,
      };

    }


    return {
      valid: true,

      expired: false,

      returnDate,

      deadline:
        deadline
          .toISOString()
          .slice(0, 10),
    };

  };


/* =========================================================
   PROCESS EXPENSES
   ========================================================= */

export const processExpenses =
  async (
    req,
    res,
    next
  ) => {

    let originalWorkflowStatus = null;


    try {

      const {
        travelRequestId,
      } = req.body;


      if (!travelRequestId) {

        return res.status(400).json({

          success: false,

          message:
            'travelRequestId is required',

        });

      }


      // --------------------------------------------------
      // 1. Get Travel Request
      // --------------------------------------------------

      console.log(
        '\n1. Loading Travel Request...'
      );


      const travelRequest =
        await getTravelRequestById(
          travelRequestId
        );


      if (!travelRequest) {

        return res.status(404).json({

          success: false,

          message:
            'Travel Request not found',

        });

      }


      console.log(
        'Travel Request loaded'
      );


      // --------------------------------------------------
      // Save original workflow status
      // --------------------------------------------------

      originalWorkflowStatus =
        travelRequest.workflowStatus ||
        travelRequest.status ||
        'Pending Settlement';


      // --------------------------------------------------
      // Finance Return Remarks
      // --------------------------------------------------

      /*
       * When Finance returns a settlement, the remarks are
       * already persisted with the Travel Request.
       *
       * Read them from the backend instead of trusting
       * the frontend to send or modify them.
       */
      const financeRemarks =
        travelRequest.returnRemarks ||
        travelRequest.finance?.remarks ||
        '';


      const isReturnedByFinance =
        originalWorkflowStatus ===
        'Returned by Finance';


      if (isReturnedByFinance) {

        console.log(
          '\nFinance returned this settlement.'
        );

        console.log(
          'Finance remarks:',
          financeRemarks || '(No remarks provided)'
        );

      }


      // --------------------------------------------------
      // Settlement workflow validation
      // --------------------------------------------------

      const settlementAllowed =
        originalWorkflowStatus ===
          'Pending Settlement' ||
        originalWorkflowStatus ===
          'Returned by Finance';


      if (!settlementAllowed) {

        return res.status(409).json({

          success: false,

          message:
            'Travel Request must be ready for settlement processing.',

          workflowStatus:
            travelRequest.workflowStatus ||
            travelRequest.status,

        });

      }


      // --------------------------------------------------
      // 1A. Validate settlement deadline
      // --------------------------------------------------

      const deadlineCheck =
        validateSettlementDeadline(
          travelRequest
        );


      // if (!deadlineCheck.valid) {

      //   console.warn(
      //     `Settlement deadline validation failed for ${travelRequestId}:`,
      //     deadlineCheck.message
      //   );


      //   return res.status(409).json({

      //     success: false,

      //     message:
      //       deadlineCheck.message,

      //     travelRequestId,

      //     returnDate:
      //       deadlineCheck.returnDate ||
      //       travelRequest
      //         ?.travelDetails
      //         ?.toDate ||
      //       null,

      //     settlementDeadline:
      //       deadlineCheck.deadline ||
      //       null,

      //     deadlineExpired:
      //       deadlineCheck.expired ||
      //       false,

      //     workflowStatus:
      //       travelRequest.workflowStatus ||
      //       travelRequest.status,

      //   });

      // }


      console.log(
        `Settlement deadline valid until ${deadlineCheck.deadline}`
      );


      // --------------------------------------------------
      // 2. Mark AI processing
      // --------------------------------------------------

      await updateTravelRequest(
        travelRequestId,
        {
          workflowStatus:
            'AI Processing',

          status:
            'AI Processing',
        }
      );


      // --------------------------------------------------
      // 3. Extract sample emails
      // --------------------------------------------------

      console.log(
        '\n2. Extracting emails...'
      );


      const emails =
        await extractAllEmails(
          emailDirectory
        );


      console.log(
        `Extracted ${emails.length} emails`
      );


      const emailText =
        formatEmailsForAI(
          emails
        );


      // --------------------------------------------------
      // 4. Extract receipt images
      // --------------------------------------------------

      console.log(
        '\n3. Extracting receipt text...'
      );


      const receipts =
        await extractAllImages(
          receiptDirectory
        );


      console.log(
        `Extracted ${receipts.length} receipts`
      );


      let receiptText =
        formatImagesForAI(
          receipts
        );


      // --------------------------------------------------
      // 5. Process uploaded files
      // --------------------------------------------------

      const uploadedFiles =
        req.files || [];


      if (
        uploadedFiles.length > 0
      ) {

        console.log(
          `\nProcessing ${uploadedFiles.length} uploaded documents...`
        );


        const uploadedImages =
          await extractUploadedImages(
            uploadedFiles
          );


        const uploadedText =
          formatImagesForAI(
            uploadedImages
          );


        receiptText +=
          '\n\n' +
          uploadedText;

      }


      // --------------------------------------------------
      // 6. Employee Master
      // --------------------------------------------------

      console.log(
        '\n5. Reading employee master CSV...'
      );


      const employeeCsv =
        await extractCsvData(
          employeeCsvPath
        );


      console.log(
        `Loaded ${employeeCsv.data.length} employee records`
      );


      const employeeText =
        formatCsvForAI(
          employeeCsv
        );


      // --------------------------------------------------
      // 7. Travel Request data
      // --------------------------------------------------

      console.log(
        '\n6. Preparing Travel Request data...'
      );


      const travelDataText =
        JSON.stringify(
          {
            travelRequestId:
              travelRequest.travelRequestId,

            employeeDetails:
              travelRequest.employeeDetails,

            travelDetails:
              travelRequest.travelDetails,

            estimatedCost:
              travelRequest.estimatedCost,

            travelAdvance:
              {
                requested:
                  travelRequest
                    .travelAdvance
                    ?.requested || 0,
              },

          },
          null,
          2
        );


      // --------------------------------------------------
      // 8. AI processing
      // --------------------------------------------------

      console.log(
        '\n7. Sending extracted data to AI...'
      );


      const result =
        await generateExpenseSettlement({

          employeeMasterData:
            employeeText,

          travelRequestData:
            travelDataText,

          emails:
            emailText,

          receipts:
            receiptText,

          financeRemarks:
            financeRemarks,

        });


      console.log(
        '\n8. AI processing completed.'
      );


      // --------------------------------------------------
      // 9. Save settlement
      // --------------------------------------------------

      /*
       * Approval workflow is controlled by backend.
       */
      result.approvalWorkflow =
        travelRequest.approvalWorkflow || [];


      result.travelDetails = {

        ...result.travelDetails,

        travelRequestId,

      };


      const settlementForm =
        await generateExpenseSettlementForm({

          claim:
            result,

          templatePath:
            expenseFormTemplatePath,

          outputDirectory,

        });


      /*
       * IMPORTANT:
       *
       * Finance remarks are cleared only after successful
       * AI processing.
       *
       * The returned claim is now a new settlement awaiting
       * Finance verification.
       */
      await updateTravelRequest(
        travelRequestId,
        {

          workflowStatus:
            'Pending Finance Verification',

          status:
            'Pending Finance Verification',

          settlement:
            result,

          settlementForm: {

            fileName:
              settlementForm.fileName,

            downloadUrl:
              `/api/expenses/download/${encodeURIComponent(
                settlementForm.fileName
              )}`,

          },

          finance: {

            status:
              'Pending Verification',

            remarks:
              '',

            verifiedBy:
              '',

            verifiedAt:
              null,

          },

          returnRemarks:
            '',

        }
      );


      console.log(
        `Generated: ${settlementForm.fileName}`,
        result,
        emails,
        receipts,
        uploadedFiles,
        employeeCsv
      );


      return res.status(200).json({

        success: true,

        sourceSummary: {

          emails:
            emails.length,

          receipts:
            receipts.length,

          uploadedDocuments:
            uploadedFiles.length,

          employees:
            employeeCsv.data.length,

          travelRequest:
            true,

        },

        settlementDeadline: {

          returnDate:
            deadlineCheck.returnDate,

          deadline:
            deadlineCheck.deadline,

          daysAllowed:
            7,

        },

        /*
         * Indicates whether this was a Finance-return
         * correction run.
         */
        correctionRun:
          isReturnedByFinance,

        data:
          result,

        settlementForm: {

          fileName:
            settlementForm.fileName,

          downloadUrl:
            `/api/expenses/download/${encodeURIComponent(
              settlementForm.fileName
            )}`,

        },

      });

    } catch (error) {

      console.error(
        'Error processing travel expenses:',
        error
      );


      /*
       * Rollback AI Processing to the exact previous state.
       */
      if (
        req.body?.travelRequestId &&
        originalWorkflowStatus
      ) {

        try {

          const current =
            await getTravelRequestById(
              req.body.travelRequestId
            );


          if (
            current?.workflowStatus ===
            'AI Processing'
          ) {

            await updateTravelRequest(
              req.body.travelRequestId,
              {

                workflowStatus:
                  originalWorkflowStatus,

                status:
                  originalWorkflowStatus,

              }
            );

          }

        } catch (
          rollbackError
        ) {

          console.error(
            'Failed to rollback workflow after AI error:',
            rollbackError
          );

        }

      }


      next(error);

    } finally {

      await closeImageWorker();

    }

  };