import {
  getTravelRequestById,
  getTravelRequests,
  updateTravelRequest,
} from './travel-request.service.js';

import {
  processPayout,
} from './payout.service.js';


/*
|--------------------------------------------------------------------------
| GET ALL FINANCE CLAIMS
|--------------------------------------------------------------------------
*/

export const getFinanceClaims =
  async () => {

    const travelRequests =
      await getTravelRequests();


    const financeStatuses = [

      'Pending Finance Verification',

      'Pending Payout',

      'Paid',

      'Payroll Recovery',

      'No Payment',

      'Returned by Finance',

    ];


    return travelRequests.filter(
      (request) =>
        financeStatuses.includes(
          request.workflowStatus
        )
    );

  };


/*
|--------------------------------------------------------------------------
| GET SINGLE FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const getFinanceClaim =
  async (
    travelRequestId
  ) => {

    const request =
      await getTravelRequestById(
        travelRequestId
      );


    if (!request) {

      throw new Error(
        'Travel Request not found'
      );

    }


    return request;

  };


/*
|--------------------------------------------------------------------------
| VERIFY CLAIM
|--------------------------------------------------------------------------
|
| Pending Finance Verification
|             ↓
|        Pending Payout
|
|--------------------------------------------------------------------------
*/

export const verifyClaim =
  async ({
    travelRequestId,
    financeEmployeeCode,
  }) => {

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
     * Current workflow status.
     */

    const currentStatus =
      request.workflowStatus ||
      request.status;


    /*
     * Claim must be waiting for
     * Finance verification.
     */

    if (
      currentStatus !==
      'Pending Finance Verification'
    ) {

      throw new Error(
        'Claim is not ready for Finance verification'
      );

    }


    /*
     * Finance employee is required.
     */

    if (!financeEmployeeCode) {

      throw new Error(
        'Finance employee code is required'
      );

    }


    /*
     * Get final settlement amounts.
     */

    const payable =
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
     * Determine next workflow status.
     *
     * Payment required:
     *       Pending Payout
     *
     * Recovery required:
     *       Payroll Recovery
     *
     * Nothing to pay/recover:
     *       No Payment
     */

    const nextStatus =
      payable > 0
        ? 'Pending Payout'
        : recoverable > 0
          ? 'Payroll Recovery'
          : 'No Payment';


    /*
     * Update Travel Request.
     */

    return updateTravelRequest(
      travelRequestId,
      {

        workflowStatus:
          nextStatus,

        status:
          nextStatus,


        finance: {

          status:
            'Verified',

          remarks:
            '',

          verifiedBy:
            financeEmployeeCode,

          verifiedAt:
            new Date().toISOString(),

        },


        payout: {

          status:
            nextStatus,

          amount:
            payable,

          recoverable:
            recoverable,

          reference:
            '',

          paidAt:
            null,

          releasedBy:
            '',

        },

      }
    );

  };


/*
|--------------------------------------------------------------------------
| RETURN CLAIM
|--------------------------------------------------------------------------
|
| Finance can return a claim for correction.
|
|--------------------------------------------------------------------------
*/

export const returnClaim =
  async ({
    travelRequestId,
    financeEmployeeCode,
    remarks,
  }) => {

    /*
     * Remarks are mandatory.
     */

    if (!remarks?.trim()) {

      throw new Error(
        'Remarks are required'
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
     * Update status.
     */

    return updateTravelRequest(
      travelRequestId,
      {

        workflowStatus:
          'Returned by Finance',

        status:
          'Returned by Finance',


        finance: {

          status:
            'Returned',

          remarks:
            remarks.trim(),

          verifiedBy:
            financeEmployeeCode,

          verifiedAt:
            new Date().toISOString(),

        },

      }
    );

  };


/*
|--------------------------------------------------------------------------
| CREATE / RELEASE PAYOUT
|--------------------------------------------------------------------------
|
| Pending Payout
|       ↓
|      Paid
|
| IMPORTANT:
|
| finance.service.js does NOT write directly
| to payouts.json.
|
| It delegates the payout operation to
| payout.service.js.
|
|--------------------------------------------------------------------------
*/

export const createPayout =
  async ({
    travelRequestId,
    financeEmployeeCode,
  }) => {

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
     * Check workflow status.
     *
     * The expected state is:
     *
     * Pending Payout
     */

    const currentStatus =
      request.workflowStatus ||
      request.status;


    if (
      currentStatus !==
      'Pending Payout'
    ) {

      throw new Error(
        'Claim is not ready for payout'
      );

    }


    /*
     * Delegate the actual payout creation.
     *
     * processPayout() will:
     *
     * 1. Generate PAY-YYYY-XXXX
     * 2. Add record to payouts.json
     * 3. Update travel-requests.json
     * 4. Change status to Paid
     */

    const today = new Date();
const dayOfMonth = today.getDate();

if (dayOfMonth !== 10 && dayOfMonth !== 25) {
  const error = new Error(
    'Payout can only be released on the 10th or 25th of the month'
  );
  error.statusCode = 400;
  throw error;
}

    return processPayout({

      travelRequestId,

      financeEmployeeCode,

    });

  };