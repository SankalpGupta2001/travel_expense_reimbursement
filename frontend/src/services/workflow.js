const WORKFLOW_STORAGE_KEY =
  'nortexExpenseClaims';

/**
 * Get Travel Request ID from the
 * fixed AI JSON structure.
 */
const getTravelRequestId = (claim) => {
  return (
    claim?.travelDetails
      ?.travelRequestId || ''
  );
};


/**
 * Load all claims from localStorage.
 */
export const loadClaims = () => {
  try {
    const data =
      localStorage.getItem(
        WORKFLOW_STORAGE_KEY
      );

    return data
      ? JSON.parse(data)
      : [];
  } catch (error) {
    console.error(
      'Failed to load claims:',
      error
    );

    return [];
  }
};


/**
 * Save claims to localStorage.
 */
export const saveClaims = (claims) => {
  localStorage.setItem(
    WORKFLOW_STORAGE_KEY,
    JSON.stringify(claims)
  );
};


/**
 * Get a single claim using
 * Travel Request ID.
 */
export const getClaim = (
  travelRequestId
) => {
  const claims = loadClaims();

  return claims.find(
    (claim) =>
      getTravelRequestId(claim) ===
      travelRequestId
  );
};


/**
 * Insert or update a claim.
 *
 * IMPORTANT:
 * We keep the original fixed
 * JSON structure and do NOT add
 * travelRequestId as a new
 * top-level field.
 */
export const upsertClaim = (
  claim
) => {
  const claims = loadClaims();

  const travelRequestId =
    getTravelRequestId(claim);

  if (!travelRequestId) {
    throw new Error(
      'Travel Request ID is missing from claim'
    );
  }

  const index =
    claims.findIndex(
      (item) =>
        getTravelRequestId(item) ===
        travelRequestId
    );

  if (index === -1) {
    claims.push(claim);
  } else {
    claims[index] = claim;
  }

  saveClaims(claims);

  return claim;
};


/**
 * Determine the required approval
 * workflow according to Nortex policy.
 */
export const calculateApprovalLevels =
  (claim) => {
    /*
     * Approval threshold must be
     * based on gross employee claim
     * before advance deduction.
     */
    const amount =
      Number(
        claim?.settlementSummary
          ?.totalClaimPaidByEmployee
      ) || 0;

    const category =
      (
        claim?.travelDetails
          ?.travelCategory || ''
      ).toLowerCase();

    const international =
      category.includes(
        'international'
      );

    const employee =
      claim?.employeeDetails || {};

    const manager =
      employee.reportingManager || {};

    const levels = [];


    /*
     * Reporting Manager
     *
     * Always required.
     */
    levels.push({
      level: 1,
      role: 'Reporting Manager',
      name:
        manager.name ||
        'Suresh Iyer',
      employeeCode:
        manager.employeeCode ||
        'NX-2210',
      required: true,
      status: 'Waiting',
      remarks: '',
    });


    /*
     * HOD
     *
     * Required above ₹25,000.
     */
    if (amount > 25000) {
      levels.push({
        level: 2,
        role:
          'Head of Department',
        name: 'Meera Krishnan',
        employeeCode:
          'NX-1108',
        required: true,
        status: 'Waiting',
        remarks: '',
      });
    }


    /*
     * Head of Division
     *
     * Required above ₹75,000.
     */
    if (amount > 75000) {
      levels.push({
        level: 3,
        role:
          'Head of Division',
        name: 'Arvind Rao',
        employeeCode:
          'NX-1002',
        required: true,
        status: 'Waiting',
        remarks: '',
      });
    }


    /*
     * MD / CEO
     *
     * Required above ₹2,00,000
     * OR for international travel.
     */
    if (
      amount > 200000 ||
      international
    ) {
      levels.push({
        level: 4,
        role: 'MD / CEO',
        name: 'Nandita Shah',
        employeeCode:
          'NX-1000',
        required: true,
        status: 'Waiting',
        remarks: '',
      });
    }


    /*
     * Finance verification is
     * required for every claim.
     */
    levels.push({
      level:
        levels.length + 1,
      role:
        'Finance Verification',
      name: 'Ravi Menon',
      employeeCode:
        'NX-3305',
      required: true,
      status: 'Waiting',
      remarks: '',
    });

    return levels;
  };


/**
 * Get currently pending workflow step.
 */
export const getCurrentWorkflowStep =
  (claim) => {
    return (
      claim?.approvalWorkflow?.find(
        (step) =>
          step.status ===
          'Pending'
      ) || null
    );
  };


/**
 * Submit claim for approval.
 */
export const submitClaim = (
  claim
) => {
  const workflow =
    calculateApprovalLevels(
      claim
    );

  /*
   * First approval level
   * becomes Pending.
   */
  if (workflow.length > 0) {
    workflow[0].status =
      'Pending';
  }

  const updatedClaim = {
    ...claim,

    status:
      'Pending Approval',

    approvalWorkflow:
      workflow,

    submittedAt:
      new Date().toISOString(),

    returnRemarks: '',
  };

  return upsertClaim(
    updatedClaim
  );
};


/**
 * Approve current workflow step.
 */
export const approveCurrentStep =
  (claim) => {
    const workflow = [
      ...(claim.approvalWorkflow ||
        []),
    ];

    const currentIndex =
      workflow.findIndex(
        (step) =>
          step.status ===
          'Pending'
      );

    if (currentIndex === -1) {
      return claim;
    }


    /*
     * Mark current step approved.
     */
    workflow[currentIndex] = {
      ...workflow[currentIndex],

      status: 'Approved',

      approvedAt:
        new Date().toISOString(),
    };


    /*
     * Move to next step.
     */
    const nextIndex =
      currentIndex + 1;

    if (
      nextIndex <
      workflow.length
    ) {
      workflow[nextIndex] = {
        ...workflow[nextIndex],

        status: 'Pending',
      };
    }


    /*
     * Determine overall status.
     */
    let status =
      'Pending Approval';


    /*
     * If Finance is now pending,
     * show Finance Verification.
     */
    const financePending =
      workflow.some(
        (step) =>
          step.role ===
            'Finance Verification' &&
          step.status ===
            'Pending'
      );

    if (financePending) {
      status =
        'Finance Verification';
    }


    /*
     * If every step is approved,
     * claim is completed.
     */
    const allApproved =
      workflow.length > 0 &&
      workflow.every(
        (step) =>
          step.status ===
          'Approved'
      );

    if (allApproved) {
      status = 'Completed';
    }


    const updatedClaim = {
      ...claim,

      status,

      approvalWorkflow:
        workflow,
    };

    return upsertClaim(
      updatedClaim
    );
  };


/**
 * Return claim with remarks.
 */
export const returnClaim =
  (
    claim,
    remarks
  ) => {
    const workflow = [
      ...(claim.approvalWorkflow ||
        []),
    ];

    const currentIndex =
      workflow.findIndex(
        (step) =>
          step.status ===
          'Pending'
      );

    if (currentIndex === -1) {
      return claim;
    }


    workflow[currentIndex] = {
      ...workflow[currentIndex],

      status: 'Returned',

      remarks,
    };


    const updatedClaim = {
      ...claim,

      status: 'Returned',

      approvalWorkflow:
        workflow,

      returnRemarks:
        remarks,
    };

    return upsertClaim(
      updatedClaim
    );
  };


/**
 * Employee resubmits a returned claim.
 */
export const resubmitClaim =
  (claim) => {
    const workflow =
      (
        claim.approvalWorkflow ||
        []
      ).map(
        (step) => ({
          ...step,

          status: 'Waiting',

          remarks: '',
        })
      );


    /*
     * Restart approval chain.
     */
    if (workflow.length > 0) {
      workflow[0].status =
        'Pending';
    }


    return upsertClaim({
      ...claim,

      status:
        'Pending Approval',

      approvalWorkflow:
        workflow,

      returnRemarks: '',

      resubmittedAt:
        new Date().toISOString(),
    });
  };


/**
 * Finance verifies claim.
 */
export const verifyFinance =
  (claim) => {
    const workflow =
      (
        claim.approvalWorkflow ||
        []
      ).map(
        (step) => {
          if (
            step.role ===
              'Finance Verification'
          ) {
            return {
              ...step,

              status:
                'Approved',

              approvedAt:
                new Date().toISOString(),
            };
          }

          return step;
        }
      );


    const payable =
      Number(
        claim?.settlementSummary
          ?.amountPayableToEmployee
      ) || 0;

    const recoverable =
      Number(
        claim?.settlementSummary
          ?.amountRecoverableFromEmployee
      ) || 0;


    let status =
      'Completed';


    if (payable > 0) {
      status =
        'Payment Pending';
    } else if (
      recoverable > 0
    ) {
      status =
        'Recovery Pending';
    }


    return upsertClaim({
      ...claim,

      status,

      approvalWorkflow:
        workflow,

      financeVerifiedAt:
        new Date().toISOString(),
    });
  };


/**
 * Finance releases payment.
 */
export const releasePayment =
  (claim) => {
    return upsertClaim({
      ...claim,

      status:
        'Payment Released',

      paymentReleasedAt:
        new Date().toISOString(),
    });
  };


/**
 * Finance initiates recovery.
 */
export const markRecovery =
  (claim) => {
    return upsertClaim({
      ...claim,

      status:
        'Recovery Initiated',

      recoveryInitiatedAt:
        new Date().toISOString(),
    });
  };
