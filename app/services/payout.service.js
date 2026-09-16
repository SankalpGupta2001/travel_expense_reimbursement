import path from 'path';
import { fileURLToPath } from 'url';

import {
  readJsonFile,
  writeJsonFile,
} from './data.service.js';

import {
  getTravelRequestById,
  updateTravelRequest,
} from './travel-request.service.js';


/*
|--------------------------------------------------------------------------
| File Path
|--------------------------------------------------------------------------
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


const payoutsPath =
  path.join(
    __dirname,
    '../../data/app/payouts.json'
  );


/*
|--------------------------------------------------------------------------
| Generate Payment Reference
|--------------------------------------------------------------------------
*/

const generatePaymentReference = (
  payouts
) => {

  const year =
    new Date().getFullYear();


  return `PAY-${year}-${String(
    payouts.length + 1
  ).padStart(4, '0')}`;

};


/*
|--------------------------------------------------------------------------
| GET ALL PAYOUTS
|--------------------------------------------------------------------------
*/

export const getPayouts =
  async () => {

    return readJsonFile(
      payoutsPath,
      []
    );

  };


/*
|--------------------------------------------------------------------------
| PROCESS PAYOUT
|--------------------------------------------------------------------------
|
| Pending Payout
|       ↓
|      Paid
|
| This function:
|
| 1. Gets the Travel Request
| 2. Validates Pending Payout
| 3. Checks duplicate payout
| 4. Creates payout record
| 5. Writes payouts.json
| 6. Updates travel-requests.json
|
|--------------------------------------------------------------------------
*/

export const processPayout =
  async ({
    travelRequestId,
    financeEmployeeCode,
  }) => {
  console.log('========== PROCESS PAYOUT ==========');
  console.log('Travel Request:', travelRequestId);
  console.log('Finance Employee:', financeEmployeeCode);
  console.log('Payouts Path:', payoutsPath);

    /*
     * Validate Travel Request ID.
     */

    if (!travelRequestId) {

      throw new Error(
        'Travel Request ID is required'
      );

    }


    /*
     * Validate Finance employee.
     */

    if (!financeEmployeeCode) {

      throw new Error(
        'Finance employee code is required'
      );

    }


    /*
     * Get Travel Request.
     */

    const request =
      await getTravelRequestById(
        travelRequestId
      );


    if (!request) {

      throw new Error(
        'Travel Request not found'
      );

    }


    /*
     * Get current workflow status.
     */

    const currentStatus =
      request.workflowStatus ||
      request.status;


    /*
     * Payout is allowed only after
     * Finance verification.
     */

    if (
      currentStatus !==
      'Pending Payout'
    ) {

      throw new Error(
        'Claim is not ready for payout'
      );

    }


    /*
     * Get existing payouts.
     */

    const payouts =
      await getPayouts();


    /*
     * Prevent duplicate payout.
     */

    const alreadyPaid =
      payouts.some(
        (item) =>
          item.travelRequestId ===
            travelRequestId &&
          item.status === 'Paid'
      );


    if (alreadyPaid) {

      const error =
        new Error(
          'Payout has already been processed for this Travel Request'
        );

      error.statusCode = 409;

      throw error;

    }


    /*
     * Get final settlement amount.
     */

    const amount =
      Number(
        request.settlement
          ?.finalData
          ?.finalAmountPayable
      ) || 0;


    const recoverable =
      Number(
        request.settlement
          ?.finalData
          ?.finalAmountRecoverable
      ) || 0;


    /*
     * Generate payout reference.
     */

    const reference =
      generatePaymentReference(
        payouts
      );


    /*
     * Payment timestamp.
     */

    const paidAt =
      new Date().toISOString();


    /*
     * Create payout record.
     *
     * This object will be stored in
     * data/app/payouts.json.
     */

    const payout = {

      travelRequestId,

      employeeCode:
        request.employeeDetails
          ?.employeeCode || '',

      employeeName:
        request.employeeDetails
          ?.employeeName || '',

      amount,

      recoverable,

      reference,

      processedBy:
        financeEmployeeCode,

      status:
        'Paid',

      paidAt,

    };


    /*
     * Add payout to existing payouts.
     */

    payouts.push(
      payout
    );


    /*
     * IMPORTANT:
     *
     * Persist payout record FIRST.
     */

console.log('Payout record:', payout);
console.log('Writing payouts to:', payoutsPath);

await writeJsonFile(
  payoutsPath,
  payouts
);

console.log('PAYOUT JSON WRITTEN SUCCESSFULLY');

    /*
     * Update Travel Request.
     *
     * This changes:
     *
     * Pending Payout → Paid
     */

    const updatedRequest =
      await updateTravelRequest(
        travelRequestId,
        {

          workflowStatus:
            'Paid',

          status:
            'Paid',


          finance: {

            ...(request.finance || {}),

            status:
              'Paid',

            paidBy:
              financeEmployeeCode,

            paidAt,

          },


          payout: {

            ...(request.payout || {}),

            status:
              'Paid',

            amount,

            recoverable,

            reference,

            paidAt,

            releasedBy:
              financeEmployeeCode,

          },

        }
      );


    /*
     * Return updated Travel Request.
     */

    return updatedRequest;

  };