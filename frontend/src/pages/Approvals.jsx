import { useEffect, useMemo, useState } from 'react';

import {
  approveTravelRequest,
  getPendingApprovals,
  returnTravelRequest,
} from '../services/approval.api.js';

import {
  requireUser,
} from '../services/auth.api.js';

import StatusBadge from '../components/StatusBadge.jsx';


/* =========================================================
   APPROVAL HELPERS
   ========================================================= */

const normalizeStatus = (status) => {
  return String(status || '')
    .trim()
    .toLowerCase();
};


const isPendingApproval = (step) => {
  if (!step?.required) {
    return false;
  }

  const status =
    normalizeStatus(step.status);

  return (
    status === 'pending' ||
    status === 'pending approval' ||
    status === 'manager approval' ||
    status === 'hod approval' ||
    status === 'head of division approval' ||
    status === 'md approval' ||
    status === 'pending manager approval' ||
    status === 'pending hod approval' ||
    status === 'pending head of division approval' ||
    status === 'pending md/ceo approval'
  );
};


const getCurrentApprovalStep = (
  workflow = []
) => {
  return workflow.find(
    (step) =>
      isPendingApproval(step)
  );
};


const getWorkflowStatus = (
  request
) => {
  return (
    request?.workflowStatus ||
    request?.status ||
    'Pending'
  );
};


const getEmployeeName = (
  request
) => {
  return (
    request?.employeeDetails?.employeeName ||
    request?.employeeName ||
    'Unknown Employee'
  );
};


const getEmployeeCode = (
  request
) => {
  return (
    request?.employeeDetails?.employeeCode ||
    request?.employeeCode ||
    '-'
  );
};


const getDestination = (
  request
) => {
  return (
    request?.travelDetails?.destination ||
    request?.destination ||
    '-'
  );
};


const getTravelDates = (
  request
) => {
  const from =
    request?.travelDetails?.fromDate ||
    request?.fromDate;

  const to =
    request?.travelDetails?.toDate ||
    request?.toDate;

  if (!from || !to) {
    return '-';
  }

  return `${formatDate(from)} - ${formatDate(to)}`;
};


const formatDate = (
  value
) => {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};


const formatCurrency = (
  amount
) => {
  const value =
    Number(amount || 0);

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(value);
};


/* =========================================================
   COMPONENT
   ========================================================= */

export default function Approvals() {

  const user =
    requireUser();


  const [
    requests,
    setRequests,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState('');


  const [
    error,
    setError,
  ] = useState('');


  const [
    returnModal,
    setReturnModal,
  ] = useState({
    open: false,
    request: null,
    remarks: '',
  });


  /* =========================================================
     LOAD APPROVALS
     ========================================================= */

  const loadApprovals =
    async () => {

      try {

        setLoading(true);
        setError('');


        if (!user?.employeeCode) {

          setError(
            'Employee code is missing for the current user.'
          );

          setRequests([]);

          return;
        }


        const response =
          await getPendingApprovals(
            user.employeeCode
          );


        const data =
          Array.isArray(response)
            ? response
            : response?.data || [];


        setRequests(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          'Failed to load approvals:',
          err
        );

        setError(
          err?.message ||
          'Unable to load pending approvals.'
        );

      } finally {

        setLoading(false);

      }
    };


  useEffect(() => {

    loadApprovals();

  }, [
    user?.employeeCode,
  ]);


  /* =========================================================
     FILTER CURRENT USER APPROVALS
     ========================================================= */

  const myApprovals =
    useMemo(() => {

      const currentEmployeeCode =
        String(
          user?.employeeCode || ''
        )
          .trim()
          .toUpperCase();


      if (!currentEmployeeCode) {
        return [];
      }


      return requests.filter(
        (request) => {

          const workflow =
            request?.approvalWorkflow ||
            [];


          const pendingStep =
            getCurrentApprovalStep(
              workflow
            );


          if (!pendingStep) {
            return false;
          }


          const approverEmployeeCode =
            String(
              pendingStep?.employeeCode ||
              ''
            )
              .trim()
              .toUpperCase();


          return (
            approverEmployeeCode ===
            currentEmployeeCode
          );

        }
      );

    }, [
      requests,
      user?.employeeCode,
    ]);


  /* =========================================================
     APPROVE TRAVEL REQUEST
     ========================================================= */

  const handleApprove =
    async (request) => {

      const travelRequestId =
        request?.travelRequestId;


      if (!travelRequestId) {

        setError(
          'Travel Request ID is missing.'
        );

        return;
      }


      if (!user?.employeeCode) {

        setError(
          'Employee code is missing.'
        );

        return;
      }


      try {

        setActionLoading(
          `approve-${travelRequestId}`
        );

        setError('');


        await approveTravelRequest(
          travelRequestId,
          user.employeeCode
        );


        await loadApprovals();

      } catch (err) {

        console.error(
          'Failed to approve request:',
          err
        );

        setError(
          err?.message ||
          'Unable to approve this Travel Request.'
        );

      } finally {

        setActionLoading('');

      }
    };


  /* =========================================================
     RETURN MODAL
     ========================================================= */

  const openReturnModal =
    (request) => {

      setReturnModal({
        open: true,
        request,
        remarks: '',
      });

    };


  const closeReturnModal =
    () => {

      if (actionLoading) {
        return;
      }


      setReturnModal({
        open: false,
        request: null,
        remarks: '',
      });

    };


  /* =========================================================
     RETURN TRAVEL REQUEST
     ========================================================= */

  const handleReturn =
    async () => {

      const request =
        returnModal.request;


      if (!request?.travelRequestId) {

        setError(
          'Travel Request ID is missing.'
        );

        return;
      }


      if (!user?.employeeCode) {

        setError(
          'Employee code is missing.'
        );

        return;
      }


      const remarks =
        returnModal.remarks.trim();


      if (!remarks) {

        setError(
          'Please provide remarks before returning the request.'
        );

        return;
      }


      try {

        setActionLoading(
          `return-${request.travelRequestId}`
        );

        setError('');


        await returnTravelRequest(
          request.travelRequestId,
          user.employeeCode,
          remarks
        );


        closeReturnModal();


        await loadApprovals();

      } catch (err) {

        console.error(
          'Failed to return request:',
          err
        );

        setError(
          err?.message ||
          'Unable to return this Travel Request.'
        );

      } finally {

        setActionLoading('');

      }
    };


  /* =========================================================
     LOADING STATE
     ========================================================= */

  if (loading) {

    return (
      <div className="page">

        <div className="page-header">

          <div>

            <span className="eyebrow">
              WORKFLOW
            </span>

            <h1>
              Approvals
            </h1>

            <p>
              Review Travel Requests awaiting
              your approval.
            </p>

          </div>

        </div>


        <div className="card">

          <div className="loading-state">
            Loading pending approvals...
          </div>

        </div>

      </div>
    );

  }


  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <div className="page approvals-page">

      {/* =====================================================
          PAGE UI STYLES
      ===================================================== */}

      <style>
        {`

          .approvals-page {
            padding-bottom: 48px;
          }

          .approvals-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 32px;
            margin-bottom: 32px;
          }

          .approvals-header-content {
            min-width: 0;
          }

          .approvals-header-content h1 {
            margin: 8px 0 8px;
            font-size: 34px;
            line-height: 1.15;
            letter-spacing: -0.7px;
          }

          .approvals-header-content p {
            margin: 0;
            color: #64748b;
            font-size: 15px;
          }

          .approval-count-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            white-space: nowrap;
          }

          .approval-count-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 9px;
            background: #eef3ff;
            color: #3157e8;
            font-size: 15px;
            font-weight: 700;
          }

          .approval-count-text {
            color: #64748b;
            font-size: 13px;
            font-weight: 600;
          }

          .approval-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .approval-request-card {
            overflow: hidden;
            padding: 0 !important;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          }

          .approval-request-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding: 24px 28px;
            border-bottom: 1px solid #eef2f7;
          }

          .approval-request-title {
            min-width: 0;
          }

          .approval-request-title .eyebrow {
            display: block;
            margin-bottom: 8px;
          }

          .approval-request-id {
            margin: 0;
            color: #0f172a;
            font-size: 23px;
            font-weight: 750;
            letter-spacing: -0.3px;
          }

          .approval-request-employee {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-top: 8px;
            color: #64748b;
            font-size: 14px;
          }

          .employee-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #cbd5e1;
          }

          .approval-status-area {
            flex-shrink: 0;
          }

          .approval-request-body {
            padding: 24px 28px;
          }

          .approval-detail-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .approval-detail {
            min-width: 0;
            padding: 17px 18px;
            border: 1px solid #e8edf3;
            border-radius: 12px;
            background: #f8fafc;
          }

          .approval-detail-label {
            display: block;
            margin-bottom: 8px;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
          }

          .approval-detail-value {
            display: block;
            overflow: hidden;
            color: #172033;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.35;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .approval-detail-subvalue {
            display: block;
            margin-top: 5px;
            overflow: hidden;
            color: #64748b;
            font-size: 12px;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .approval-detail.cost {
            background: #f8faff;
            border-color: #dce5ff;
          }

          .approval-detail.cost .approval-detail-value {
            color: #3157e8;
            font-size: 17px;
          }

          .approval-required-panel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 18px;
            padding: 17px 18px;
            border: 1px solid #dbe5ff;
            border-radius: 12px;
            background: #f7f9ff;
          }

          .approval-required-content {
            display: flex;
            align-items: center;
            gap: 13px;
            min-width: 0;
          }

          .approval-required-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #3157e8;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
          }

          .approval-required-label {
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .approval-required-role {
            margin-top: 3px;
            color: #172033;
            font-size: 14px;
            font-weight: 700;
          }

          .approval-level {
            flex-shrink: 0;
            padding: 7px 10px;
            border-radius: 8px;
            background: #ffffff;
            color: #3157e8;
            font-size: 12px;
            font-weight: 700;
          }

          .approval-reason-panel {
            margin-top: 14px;
            padding: 15px 18px;
            border-left: 3px solid #dbe5ff;
            background: #fafbfc;
            border-radius: 0 10px 10px 0;
          }

          .approval-reason-label {
            margin-bottom: 5px;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .approval-reason-text {
            color: #475569;
            font-size: 13px;
            line-height: 1.5;
          }

          .approval-card-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            padding: 18px 28px;
            border-top: 1px solid #eef2f7;
            background: #fcfdff;
          }

          .approval-card-footer .button {
            min-width: 150px;
          }

          .approval-card-footer .button.primary {
            min-width: 170px;
          }

          .approval-empty {
            padding: 64px 24px;
            text-align: center;
          }

          .approval-empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            margin: 0 auto 18px;
            border-radius: 15px;
            background: #eef3ff;
            color: #3157e8;
            font-size: 22px;
            font-weight: 700;
          }

          .approval-empty h2 {
            margin: 0 0 8px;
            color: #172033;
            font-size: 20px;
          }

          .approval-empty p {
            max-width: 420px;
            margin: 0 auto 22px;
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
          }

          .approval-modal-card {
            width: min(560px, calc(100vw - 32px));
            padding: 28px;
            border-radius: 18px;
          }

          .approval-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
          }

          .approval-modal-header h2 {
            margin: 7px 0 0;
          }

          .approval-modal-description {
            margin: 18px 0 22px;
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
          }

          .approval-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 22px;
          }

          @media (max-width: 1000px) {

            .approval-detail-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

          }

          @media (max-width: 700px) {

            .approvals-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .approval-request-top {
              flex-direction: column;
            }

            .approval-detail-grid {
              grid-template-columns: 1fr;
            }

            .approval-required-panel {
              align-items: flex-start;
              flex-direction: column;
            }

            .approval-card-footer {
              flex-direction: column-reverse;
              align-items: stretch;
            }

            .approval-card-footer .button,
            .approval-card-footer .button.primary {
              width: 100%;
            }

          }

        `}
      </style>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="approvals-header">

        <div className="approvals-header-content">

          <span className="eyebrow">
            WORKFLOW
          </span>

          <h1>
            Approvals
          </h1>

          <p>
            Review Travel Requests currently
            waiting for your approval.
          </p>

        </div>


        <div className="approval-count-card">

          <span className="approval-count-number">
            {myApprovals.length}
          </span>

          <span className="approval-count-text">
            Pending with you
          </span>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="alert error-alert">
          {error}
        </div>

      )}


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {myApprovals.length === 0 ? (

        <div className="card approval-empty">

          <div className="approval-empty-icon">
            ✓
          </div>


          <h2>
            No pending approvals
          </h2>


          <p>
            You currently have no Travel Requests
            waiting for your approval.
          </p>


          <button
            className="button secondary"
            onClick={loadApprovals}
          >
            Refresh
          </button>

        </div>

      ) : (

        /* ===================================================
           APPROVAL LIST
        =================================================== */

        <div className="approval-list">

          {myApprovals.map(
            (request) => {

              const workflow =
                request?.approvalWorkflow ||
                [];


              const pendingStep =
                getCurrentApprovalStep(
                  workflow
                );


              const estimatedTotal =
                request?.estimatedCost?.total ||
                0;


              const travelRequestId =
                request?.travelRequestId;


              const approving =
                actionLoading ===
                `approve-${travelRequestId}`;


              const returning =
                actionLoading ===
                `return-${travelRequestId}`;


              return (

                <div
                  className="card approval-request-card"
                  key={travelRequestId}
                >

                  {/* =======================================
                      REQUEST HEADER
                  ======================================= */}

                  <div className="approval-request-top">

                    <div className="approval-request-title">

                      <span className="eyebrow">
                        TRAVEL REQUEST
                      </span>

                      <h2 className="approval-request-id">
                        {travelRequestId}
                      </h2>

                      <div className="approval-request-employee">

                        <span>
                          {getEmployeeName(
                            request
                          )}
                        </span>

                        <span className="employee-dot" />

                        <span>
                          {getEmployeeCode(
                            request
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="approval-status-area">

                      <StatusBadge
                        status={getWorkflowStatus(
                          request
                        )}
                      />

                    </div>

                  </div>


                  {/* =======================================
                      REQUEST DETAILS
                  ======================================= */}

                  <div className="approval-request-body">

                    <div className="approval-detail-grid">

                      {/* EMPLOYEE */}

                      <div className="approval-detail">

                        <span className="approval-detail-label">
                          Employee
                        </span>

                        <span className="approval-detail-value">
                          {getEmployeeName(
                            request
                          )}
                        </span>

                        <span className="approval-detail-subvalue">
                          {
                            request
                              ?.employeeDetails
                              ?.designation ||
                            'Employee'
                          }
                        </span>

                      </div>


                      {/* DESTINATION */}

                      <div className="approval-detail">

                        <span className="approval-detail-label">
                          Destination
                        </span>

                        <span className="approval-detail-value">
                          {getDestination(
                            request
                          )}
                        </span>

                        <span className="approval-detail-subvalue">
                          {getTravelDates(
                            request
                          )}
                        </span>

                      </div>


                      {/* ESTIMATED COST */}

                      <div className="approval-detail cost">

                        <span className="approval-detail-label">
                          Estimated Cost
                        </span>

                        <span className="approval-detail-value">
                          {formatCurrency(
                            estimatedTotal
                          )}
                        </span>

                        <span className="approval-detail-subvalue">
                          Travel Request estimate
                        </span>

                      </div>


                      {/* PURPOSE */}

                      <div className="approval-detail">

                        <span className="approval-detail-label">
                          Travel Purpose
                        </span>

                        <span className="approval-detail-value">
                          {
                            request
                              ?.travelDetails
                              ?.purpose ||
                            'Business travel'
                          }
                        </span>

                        <span className="approval-detail-subvalue">
                          {
                            request
                              ?.travelDetails
                              ?.company ||
                            '—'
                          }
                        </span>

                      </div>

                    </div>


                    {/* =====================================
                        APPROVAL REQUIRED
                    ===================================== */}

                    <div className="approval-required-panel">

                      <div className="approval-required-content">

                        <div className="approval-required-icon">
                          ✓
                        </div>

                        <div>

                          <div className="approval-required-label">
                            Your approval is required
                          </div>

                          <div className="approval-required-role">
                            {pendingStep?.role ||
                              'Approval'}
                          </div>

                        </div>

                      </div>


                      <div className="approval-level">
                        Level{' '}
                        {pendingStep?.level ||
                          '-'}
                      </div>

                    </div>


                    {/* =====================================
                        APPROVAL REASON
                    ===================================== */}

                    <div className="approval-reason-panel">

                      <div className="approval-reason-label">
                        Why this approval is required
                      </div>

                      <div className="approval-reason-text">
                        {
                          pendingStep?.reason ||
                          'Required according to the approval matrix.'
                        }
                      </div>

                    </div>

                  </div>


                  {/* =======================================
                      ACTIONS
                  ======================================= */}

                  <div className="approval-card-footer">

                    <button
                      className="button secondary"
                      onClick={() =>
                        openReturnModal(
                          request
                        )
                      }
                      disabled={
                        approving ||
                        returning
                      }
                    >

                      {returning
                        ? 'Returning...'
                        : 'Return for Correction'}

                    </button>


                    <button
                      className="button primary"
                      onClick={() =>
                        handleApprove(
                          request
                        )
                      }
                      disabled={
                        approving ||
                        returning
                      }
                    >

                      {approving
                        ? 'Approving...'
                        : 'Approve Request'}

                    </button>

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}


      {/* =====================================================
          RETURN MODAL
      ===================================================== */}

      {returnModal.open && (

        <div className="modal-backdrop">

          <div className="modal-card approval-modal-card">

            <div className="approval-modal-header">

              <div>

                <span className="eyebrow">
                  RETURN REQUEST
                </span>

                <h2>
                  Return for Correction
                </h2>

              </div>


              <button
                className="modal-close"
                onClick={closeReturnModal}
                disabled={
                  !!actionLoading
                }
              >
                ×
              </button>

            </div>


            <p className="approval-modal-description">

              Add remarks explaining what needs
              to be corrected. The employee can
              update the request and resubmit it
              using the same Travel Request ID.

            </p>


            <div className="form-group">

              <label htmlFor="returnRemarks">
                Remarks
              </label>


              <textarea
                id="returnRemarks"
                rows="5"
                value={
                  returnModal.remarks
                }
                onChange={(event) =>
                  setReturnModal(
                    (previous) => ({
                      ...previous,
                      remarks:
                        event.target.value,
                    })
                  )
                }
                placeholder="Enter the correction required..."
              />

            </div>


            <div className="approval-modal-actions">

              <button
                className="button secondary"
                onClick={
                  closeReturnModal
                }
                disabled={
                  !!actionLoading
                }
              >
                Cancel
              </button>


              <button
                className="button primary"
                onClick={
                  handleReturn
                }
                disabled={
                  !!actionLoading
                }
              >

                {actionLoading
                  ? 'Returning...'
                  : 'Return Request'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
