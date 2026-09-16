import path from 'path';
import { fileURLToPath } from 'url';

import { extractCsvData } from './csv.service.js';

import {
  readJsonFile,
  writeJsonFile,
} from './data.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/*
|--------------------------------------------------------------------------
| DATA PATHS
|--------------------------------------------------------------------------
*/

const dataDirectory = path.join(
  __dirname,
  '../../data/expensepack'
);

const employeeCsvPath = path.join(
  dataDirectory,
  'employee_master.csv'
);

const appDataDirectory = path.join(
  __dirname,
  '../../data/app'
);

const travelRequestsPath = path.join(
  appDataDirectory,
  'travel-requests.json'
);


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Convert a value into a safe number.
 */
const normalizeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


/**
 * Generate the next Travel Request ID.
 */
const generateTravelRequestId = (
  existingRequests
) => {
  const year = new Date().getFullYear();

  const currentYearRequests =
    existingRequests.filter((request) =>
      String(request.travelRequestId || '')
        .startsWith(`TRQ-${year}-`)
    );

  let maxNumber = 0;

  for (const request of currentYearRequests) {
    const match = String(
      request.travelRequestId
    ).match(/TRQ-\d{4}-(\d+)$/);

    if (match) {
      maxNumber = Math.max(
        maxNumber,
        Number(match[1])
      );
    }
  }

  return `TRQ-${year}-${String(
    maxNumber + 1
  ).padStart(4, '0')}`;
};


/**
 * Calculate total estimated travel cost.
 */
const calculateEstimatedTotal = (
  estimatedCost
) => {
  return (
    normalizeNumber(
      estimatedCost.airRail?.amount
    ) +
    normalizeNumber(
      estimatedCost.lodging?.amount
    ) +
    normalizeNumber(
      estimatedCost.localConveyance?.amount
    ) +
    normalizeNumber(
      estimatedCost.mealsAllowance?.amount
    ) +
    normalizeNumber(
      estimatedCost.other?.amount
    )
  );
};


/**
 * Build employee reporting hierarchy.
 */
const getEmployeeHierarchy = (
  employees,
  employee
) => {
  const byCode = new Map(
    employees.map((item) => [
      item.emp_code,
      item,
    ])
  );

  const hierarchy = [];

  let current = byCode.get(
    employee.reporting_manager_code
  );

  const visited = new Set();

  while (
    current &&
    !visited.has(current.emp_code)
  ) {
    visited.add(current.emp_code);

    hierarchy.push(current);

    current =
      current.reporting_manager_code
        ? byCode.get(
            current.reporting_manager_code
          )
        : null;
  }

  return hierarchy;
};


/**
 * Determine approval levels from gross claim value.
 *
 * This is approval workflow logic.
 * It is NOT related to travel advance validation.
 */
const getApprovalLevels = (
  amount,
  travelCategory
) => {
  const isInternational =
    String(travelCategory || '')
      .toLowerCase()
      .includes('international');

  if (
    isInternational ||
    amount > 200000
  ) {
    return [
      'Reporting Manager',
      'Head of Department',
      'Head of Division',
      'MD/CEO',
    ];
  }

  if (amount > 75000) {
    return [
      'Reporting Manager',
      'Head of Department',
      'Head of Division',
    ];
  }

  if (amount > 25000) {
    return [
      'Reporting Manager',
      'Head of Department',
    ];
  }

  return [
    'Reporting Manager',
  ];
};


/**
 * Build approval workflow from Employee Master.
 */
const buildApprovalWorkflow = ({
  employee,
  employees,
  amount,
  travelCategory,
}) => {
  const hierarchy =
    getEmployeeHierarchy(
      employees,
      employee
    );

  const requiredLevels =
    getApprovalLevels(
      amount,
      travelCategory
    );

  const workflow = [];

  for (
    const requiredRole of requiredLevels
  ) {
    let approver = null;

    if (
      requiredRole ===
      'Reporting Manager'
    ) {
      approver =
        hierarchy.find(
          (item) =>
            item.emp_code ===
            employee.reporting_manager_code
        ) || null;

    } else if (
      requiredRole ===
      'Head of Department'
    ) {
      approver =
        hierarchy.find(
          (item) =>
            item.role ===
            'Head of Department'
        ) || null;

    } else if (
      requiredRole ===
      'Head of Division'
    ) {
      approver =
        hierarchy.find(
          (item) =>
            item.role ===
            'Head of Division'
        ) || null;

    } else if (
      requiredRole ===
      'MD/CEO'
    ) {
      approver =
        employees.find(
          (item) =>
            item.role === 'MD'
        ) || null;
    }

    /*
     * If an approver cannot be found,
     * keep the workflow item visible.
     */
    if (!approver) {
      workflow.push({
        level: workflow.length + 1,
        role: requiredRole,
        name: '',
        employeeCode: '',
        required: true,
        status: 'Pending',
        reason:
          'Required approver could not be resolved from Employee Master.',
        remarks: '',
        actionDate: null,
      });

      continue;
    }

    /*
     * An employee cannot approve their own claim.
     */
    if (
      approver.emp_code ===
      employee.emp_code
    ) {
      continue;
    }

    workflow.push({
      level: workflow.length + 1,
      role: requiredRole,
      name: approver.name,
      employeeCode: approver.emp_code,
      required: true,
      status:
        workflow.length === 0
          ? 'Pending'
          : 'Waiting',
      reason:
        `Required because claim value is ₹${amount.toFixed(
          2
        )}.`,
      remarks: '',
      actionDate: null,
    });
  }

  return workflow;
};


/**
 * Build employee details for the Travel Request.
 */
const getEmployeeDetails = (
  employee,
  employees
) => {
  const reportingManager =
    employees.find(
      (item) =>
        item.emp_code ===
        employee.reporting_manager_code
    );

  return {
    employeeName:
      employee.name,

    employeeCode:
      employee.emp_code,

    designation:
      employee.designation,

    department:
      employee.department,

    costCentre:
      employee.cost_centre,

    reportingManager: {
      name:
        reportingManager?.name || '',

      employeeCode:
        reportingManager?.emp_code || '',
    },
  };
};


/*
|--------------------------------------------------------------------------
| CREATE TRAVEL REQUEST
|--------------------------------------------------------------------------
*/

export const createTravelRequest = async (
  payload
) => {
  const {
    employeeCode,
    fromDate,
    toDate,
    numberOfDays,
    destination,
    company,
    purpose,
    travelCategory,
    currency,
    modeOfTravel,
    estimatedCost,
    travelAdvance,
  } = payload;

  /*
  |--------------------------------------------------------------------------
  | BASIC VALIDATION
  |--------------------------------------------------------------------------
  */

  if (!employeeCode) {
    throw new Error(
      'employeeCode is required'
    );
  }

  const employeeResult =
    await extractCsvData(
      employeeCsvPath
    );

  const employees =
    employeeResult.data;

  const employee =
    employees.find(
      (item) =>
        item.emp_code ===
        employeeCode
    );

  if (!employee) {
    throw new Error(
      'Employee does not exist in Employee Master'
    );
  }

  if (!fromDate || !toDate) {
    throw new Error(
      'fromDate and toDate are required'
    );
  }

  if (!destination) {
    throw new Error(
      'destination is required'
    );
  }

  if (!purpose) {
    throw new Error(
      'purpose is required'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE ESTIMATED COST
  |--------------------------------------------------------------------------
  */

  const normalizedEstimatedCost = {
    airRail: {
      basis:
        estimatedCost?.airRail?.basis ||
        '',

      amount:
        normalizeNumber(
          estimatedCost?.airRail?.amount
        ),

      borneBy:
        estimatedCost?.airRail?.borneBy ||
        '',
    },

    lodging: {
      basis:
        estimatedCost?.lodging?.basis ||
        '',

      amount:
        normalizeNumber(
          estimatedCost?.lodging?.amount
        ),

      borneBy:
        estimatedCost?.lodging?.borneBy ||
        '',
    },

    localConveyance: {
      basis:
        estimatedCost?.localConveyance?.basis ||
        '',

      amount:
        normalizeNumber(
          estimatedCost?.localConveyance?.amount
        ),

      borneBy:
        estimatedCost?.localConveyance?.borneBy ||
        '',
    },

    mealsAllowance: {
      basis:
        estimatedCost?.mealsAllowance?.basis ||
        '',

      amount:
        normalizeNumber(
          estimatedCost?.mealsAllowance?.amount
        ),

      borneBy:
        estimatedCost?.mealsAllowance?.borneBy ||
        '',
    },

    other: {
      basis:
        estimatedCost?.other?.basis ||
        '',

      amount:
        normalizeNumber(
          estimatedCost?.other?.amount
        ),

      borneBy:
        estimatedCost?.other?.borneBy ||
        '',
    },

    total: 0,
  };

  normalizedEstimatedCost.total =
    calculateEstimatedTotal(
      normalizedEstimatedCost
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD EXISTING REQUESTS
  |--------------------------------------------------------------------------
  */

  const requests =
    await readJsonFile(
      travelRequestsPath,
      []
    );

  const travelRequestId =
    generateTravelRequestId(
      requests
    );

  /*
  |--------------------------------------------------------------------------
  | TRAVEL ADVANCE
  |--------------------------------------------------------------------------
  */

  const requestedAdvance =
    normalizeNumber(
      travelAdvance?.requested
    );

  /*
  |--------------------------------------------------------------------------
  | APPROVAL WORKFLOW
  |--------------------------------------------------------------------------
  */

  const approvalWorkflow =
    buildApprovalWorkflow({
      employee,
      employees,
      amount:
        normalizedEstimatedCost.total,
      travelCategory,
    });

  /*
  |--------------------------------------------------------------------------
  | DETERMINE INITIAL WORKFLOW STATUS
  |--------------------------------------------------------------------------
  */

  const firstPendingApproval =
    approvalWorkflow.find(
      (item) =>
        item.status === 'Pending'
    );

  let initialWorkflowStatus =
    'Pending Settlement';

  if (
    firstPendingApproval?.role ===
    'Reporting Manager'
  ) {
    initialWorkflowStatus =
      'Pending Manager Approval';

  } else if (
    firstPendingApproval?.role ===
    'Head of Department'
  ) {
    initialWorkflowStatus =
      'Pending HOD Approval';

  } else if (
    firstPendingApproval?.role ===
    'Head of Division'
  ) {
    initialWorkflowStatus =
      'Pending Head of Division Approval';

  } else if (
    firstPendingApproval?.role ===
    'MD/CEO'
  ) {
    initialWorkflowStatus =
      'Pending MD/CEO Approval';
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE REQUEST OBJECT
  |--------------------------------------------------------------------------
  */

  const request = {
    travelRequestId,

    workflowStatus:
      initialWorkflowStatus,

    status:
      initialWorkflowStatus,

    createdAt:
      new Date().toISOString(),

    employeeDetails:
      getEmployeeDetails(
        employee,
        employees
      ),

    travelDetails: {
      fromDate,

      toDate,

      numberOfDays:
        Number(numberOfDays) || 0,

      destination,

      company:
        company || '',

      purpose,

      travelCategory:
        travelCategory || '',

      currency:
        currency || 'INR',

      modeOfTravel:
        modeOfTravel || '',
    },

    estimatedCost:
      normalizedEstimatedCost,

    travelAdvance: {
      requested:
        requestedAdvance,
    },

    approvalWorkflow,

    settlement: null,

    finance: {
      status: 'Not Started',
      remarks: '',
      verifiedBy: '',
      verifiedAt: null,
    },

    payout: {
      status: 'Not Ready',
      amount: 0,
      reference: '',
      paidAt: null,
    },

    returnRemarks: '',
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE REQUEST
  |--------------------------------------------------------------------------
  */

  requests.push(request);

  await writeJsonFile(
    travelRequestsPath,
    requests
  );

  return request;
};


/*
|--------------------------------------------------------------------------
| RESUBMIT RETURNED TRAVEL REQUEST
|--------------------------------------------------------------------------
|
| Used ONLY when Manager / HOD / other approval
| authority has returned the Travel Request.
|
| The same TRQ ID is retained.
|
| Approval workflow is rebuilt and starts again
| from the Reporting Manager.
|
|--------------------------------------------------------------------------
*/

export const resubmitTravelRequest =
  async (
    travelRequestId,
    payload
  ) => {

    const requests =
      await getTravelRequests();

    const requestIndex =
      requests.findIndex(
        (request) =>
          request.travelRequestId ===
          travelRequestId
      );

    if (requestIndex === -1) {
      const error = new Error(
        'Travel Request not found'
      );

      error.statusCode = 404;

      throw error;
    }

    const existingRequest =
      requests[requestIndex];

    /*
     * Only approval-returned requests can
     * use this operation.
     *
     * Finance returns must go through
     * settlement correction instead.
     */
    if (
      existingRequest.workflowStatus !==
      'Returned'
    ) {
      const error = new Error(
        'Only a Travel Request returned by an approver can be resubmitted here'
      );

      error.statusCode = 409;

      throw error;
    }

    const {
      employeeCode,
      fromDate,
      toDate,
      numberOfDays,
      destination,
      company,
      purpose,
      travelCategory,
      currency,
      modeOfTravel,
      estimatedCost,
      travelAdvance,
    } = payload;

    /*
     * Verify that the employee resubmitting
     * is the owner of this Travel Request.
     */
    if (
      employeeCode !==
      existingRequest.employeeDetails?.employeeCode
    ) {
      const error = new Error(
        'You are not authorized to resubmit this Travel Request'
      );

      error.statusCode = 403;

      throw error;
    }

    if (!fromDate || !toDate) {
      throw new Error(
        'fromDate and toDate are required'
      );
    }

    if (!destination?.trim()) {
      throw new Error(
        'destination is required'
      );
    }

    if (!purpose?.trim()) {
      throw new Error(
        'purpose is required'
      );
    }

    /*
     * Load Employee Master again so that
     * approval routing always uses the
     * current hierarchy.
     */
    const employeeResult =
      await extractCsvData(
        employeeCsvPath
      );

    const employees =
      employeeResult.data;

    const employee =
      employees.find(
        (item) =>
          item.emp_code ===
          employeeCode
      );

    if (!employee) {
      throw new Error(
        'Employee does not exist in Employee Master'
      );
    }

    /*
     * Normalize the corrected estimated cost.
     */
    const normalizedEstimatedCost = {
      airRail: {
        basis:
          estimatedCost?.airRail?.basis ||
          'Estimated',

        amount:
          normalizeNumber(
            estimatedCost?.airRail?.amount
          ),

        borneBy:
          estimatedCost?.airRail?.borneBy ||
          '',
      },

      lodging: {
        basis:
          estimatedCost?.lodging?.basis ||
          'Estimated',

        amount:
          normalizeNumber(
            estimatedCost?.lodging?.amount
          ),

        borneBy:
          estimatedCost?.lodging?.borneBy ||
          '',
      },

      localConveyance: {
        basis:
          estimatedCost?.localConveyance?.basis ||
          'Actuals',

        amount:
          normalizeNumber(
            estimatedCost?.localConveyance?.amount
          ),

        borneBy:
          estimatedCost?.localConveyance?.borneBy ||
          'Employee',
      },

      mealsAllowance: {
        basis:
          estimatedCost?.mealsAllowance?.basis ||
          'As per policy',

        amount:
          normalizeNumber(
            estimatedCost?.mealsAllowance?.amount
          ),

        borneBy:
          estimatedCost?.mealsAllowance?.borneBy ||
          'Employee',
      },

      other: {
        basis:
          estimatedCost?.other?.basis ||
          'Estimated',

        amount:
          normalizeNumber(
            estimatedCost?.other?.amount
          ),

        borneBy:
          estimatedCost?.other?.borneBy ||
          'Employee',
      },

      total: 0,
    };

    normalizedEstimatedCost.total =
      calculateEstimatedTotal(
        normalizedEstimatedCost
      );

    /*
     * Preserve the requested advance.
     * Do not apply the 60% rule here.
     */
    const requestedAdvance =
      normalizeNumber(
        travelAdvance?.requested
      );

    /*
     * Rebuild approval workflow from the
     * corrected estimated amount.
     *
     * This means if the employee changes
     * the estimated cost enough to change
     * approval levels, the new matrix applies.
     */
    const approvalWorkflow =
      buildApprovalWorkflow({
        employee,
        employees,
        amount:
          normalizedEstimatedCost.total,
        travelCategory,
      });

    /*
     * Determine first pending approval.
     */
    const firstPendingApproval =
      approvalWorkflow.find(
        (item) =>
          item.status === 'Pending'
      );

    let workflowStatus =
      'Pending Settlement';

    if (
      firstPendingApproval?.role ===
      'Reporting Manager'
    ) {
      workflowStatus =
        'Pending Manager Approval';

    } else if (
      firstPendingApproval?.role ===
      'Head of Department'
    ) {
      workflowStatus =
        'Pending HOD Approval';

    } else if (
      firstPendingApproval?.role ===
      'Head of Division'
    ) {
      workflowStatus =
        'Pending Head of Division Approval';

    } else if (
      firstPendingApproval?.role ===
      'MD/CEO'
    ) {
      workflowStatus =
        'Pending MD/CEO Approval';
    }

    /*
     * Update the SAME Travel Request.
     *
     * Do not generate another TRQ ID.
     */
    const updatedRequest = {
      ...existingRequest,

      workflowStatus,

      status: workflowStatus,

      updatedAt:
        new Date().toISOString(),

      travelDetails: {
        ...existingRequest.travelDetails,

        fromDate,

        toDate,

        numberOfDays:
          Number(numberOfDays) || 0,

        destination:
          destination.trim(),

        company:
          company?.trim() || '',

        purpose:
          purpose.trim(),

        travelCategory:
          travelCategory || '',

        currency:
          currency || 'INR',

        modeOfTravel:
          modeOfTravel || '',
      },

      estimatedCost:
        normalizedEstimatedCost,

      travelAdvance: {
        requested:
          requestedAdvance,
      },

      /*
       * IMPORTANT:
       *
       * Previous approval results are discarded.
       * The approval process starts again.
       */
      approvalWorkflow,

      /*
       * Any previous settlement/finance state
       * should not be reused after a pre-settlement
       * correction.
       */
      settlement: null,

      finance: {
        status: 'Not Started',
        remarks: '',
        verifiedBy: '',
        verifiedAt: null,
      },

      payout: {
        status: 'Not Ready',
        amount: 0,
        reference: '',
        paidAt: null,
      },

      /*
       * Return reason has now been addressed.
       */
      returnRemarks: '',
    };

    requests[requestIndex] =
      updatedRequest;

    await writeJsonFile(
      travelRequestsPath,
      requests
    );

    return updatedRequest;
  };


/*
|--------------------------------------------------------------------------
| GET ALL TRAVEL REQUESTS
|--------------------------------------------------------------------------
*/

export const getTravelRequests =
  async () => {
    return readJsonFile(
      travelRequestsPath,
      []
    );
  };


/*
|--------------------------------------------------------------------------
| GET TRAVEL REQUEST BY ID
|--------------------------------------------------------------------------
*/

export const getTravelRequestById =
  async (travelRequestId) => {
    const requests =
      await getTravelRequests();

    return (
      requests.find(
        (request) =>
          request.travelRequestId ===
          travelRequestId
      ) || null
    );
  };


/*
|--------------------------------------------------------------------------
| UPDATE TRAVEL REQUEST
|--------------------------------------------------------------------------
*/

export const updateTravelRequest =
  async (
    travelRequestId,
    updates
  ) => {
    const requests =
      await getTravelRequests();

    const index =
      requests.findIndex(
        (request) =>
          request.travelRequestId ===
          travelRequestId
      );

    if (index === -1) {
      throw new Error(
        'Travel Request not found'
      );
    }

    requests[index] = {
      ...requests[index],

      ...updates,

      updatedAt:
        new Date().toISOString(),
    };

    await writeJsonFile(
      travelRequestsPath,
      requests
    );

    return requests[index];
  };


/*
|--------------------------------------------------------------------------
| UPDATE APPROVAL WORKFLOW
|--------------------------------------------------------------------------
*/

export const updateApprovalWorkflow =
  async (
    travelRequestId,
    workflow
  ) => {
    return updateTravelRequest(
      travelRequestId,
      {
        approvalWorkflow:
          workflow,
      }
    );
  };