import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getTravelRequest } from '../services/travel-request.api.js';

import {
  getSettlementDownloadUrl,
} from '../services/expense.api.js';
import { requireUser } from '../services/auth.api.js';

import TravelRequestStepper from '../components/TravelRequestStepper.jsx';
import StatusBadge from '../components/StatusBadge.jsx';


const formatCurrency = (amount) => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};


const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};


const getTravelRequestFromResponse = (response) => {
  return response?.data || response || {};
};


const getSettlementFromRequest = (travelRequest) => {
  return (
    travelRequest?.settlement ||
    travelRequest?.claim ||
    {}
  );
};


/*
 * IMPORTANT:
 *
 * Workflow status is the source of truth.
 * Do NOT use settlement.finalData.status first.
 */
const getWorkflowStatus = (travelRequest) => {
  return (
    travelRequest?.workflowStatus ||
    travelRequest?.status ||
    'Unknown'
  );
};


const getFinanceStatus = (travelRequest) => {
  return (
    travelRequest?.finance?.status ||
    travelRequest?.financeStatus ||
    'Pending Verification'
  );
};


const getCurrentStep = (travelRequest) => {
  const status = getWorkflowStatus(travelRequest);

  switch (status) {

    case 'Pending Settlement':
      return 4;

    case 'Pending Finance Verification':
    case 'Finance Verification':
    case 'Ready for Finance':
      return 5;

    case 'Pending Payout':
    case 'Finance Verified':
    case 'Verified':
    case 'Ready for Payout':
      return 6;

    /*
     * Paid = entire workflow completed.
     * Stepper uses 7 internally to mark
     * all 6 steps as completed.
     */
    case 'Paid':
      return 7;

    default:
      return 2;
  }
};

const getStatusDescription = (
  status
) => {
  switch (status) {

    case 'Pending Finance Verification':
    case 'Finance Verification':
    case 'Ready for Finance':
      return 'Your settlement has been processed and is waiting for Finance verification.';

    case 'Pending Payout':
    case 'Finance Verified':
    case 'Verified':
    case 'Ready for Payout':
      return 'Finance has verified your settlement. It is ready for payout.';

    case 'Paid':
      return 'The approved settlement has been paid to the employee.';

    case 'Returned':
      return 'The claim has been returned for correction.';

    default:
      return 'Your settlement is currently being processed.';
  }
};


const ExpenseTable = ({
  title,
  items,
  columns,
  emptyText,
}) => {
  return (
    <div className="card">

      <div className="card-header">
        <div>
          <span className="eyebrow">
            EXPENSES
          </span>

          <h2>{title}</h2>
        </div>

        <span className="count-badge">
          {items.length}
        </span>
      </div>


      {items.length === 0 ? (
        <div className="empty-table">
          {emptyText || 'No expenses found.'}
        </div>
      ) : (
        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>


            <tbody>

              {items.map((item, index) => (
                <tr
                  key={
                    item.id ||
                    item.proofRef ||
                    `${title}-${index}`
                  }
                >

                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(item)
                        : item[column.key] ?? '-'}
                    </td>
                  ))}

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
};


export default function ClaimDetails() {

  const { claimId } = useParams();

  const navigate = useNavigate();

  const user = requireUser();


  const [
    travelRequest,
    setTravelRequest,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  useEffect(() => {

    let mounted = true;


    const loadClaim = async () => {

      try {

        setLoading(true);
        setError('');


        const response =
          await getTravelRequest(
            claimId
          );


        const request =
          getTravelRequestFromResponse(
            response
          );


        if (mounted) {
          setTravelRequest(request);
        }

      } catch (err) {

        if (mounted) {

          setError(
            err?.message ||
            'Unable to load claim details.'
          );

        }

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadClaim();


    return () => {
      mounted = false;
    };

  }, [claimId]);


  const settlement = useMemo(
    () =>
      getSettlementFromRequest(
        travelRequest
      ),
    [travelRequest]
  );


  const employeeDetails =
    settlement?.employeeDetails ||
    travelRequest?.employeeDetails ||
    {};


  const travelDetails =
    settlement?.travelDetails ||
    travelRequest?.travelDetails ||
    {};


  const transportation =
    settlement?.transportation || [];


  const lodging =
    settlement?.lodging || [];


  const otherExpenses =
    settlement?.otherExpenses || [];


  const settlementSummary =
    settlement?.settlementSummary || {};


  const finalData =
    settlement?.finalData || {};


  const workflow =
    travelRequest?.approvalWorkflow ||
    settlement?.approvalWorkflow ||
    [];


  /*
   * IMPORTANT:
   * Always use backend workflowStatus.
   */
  const workflowStatus =
    getWorkflowStatus(
      travelRequest
    );


  const financeStatus =
    getFinanceStatus(
      travelRequest
    );


  const currentStep =
    getCurrentStep(
      travelRequest
    );


  const isOwner =
    employeeDetails?.employeeCode ===
    user.employeeCode;


  const isFinance =
    user?.role === 'Finance' ||
    user?.role === 'Finance Manager' ||
    user?.role === 'Controller';

    const settlementDownloadUrl =
    getSettlementDownloadUrl(
      travelRequest?.settlementForm
        ?.downloadUrl
    );


  const handleDownloadSettlementForm = () => {

    if (!settlementDownloadUrl) {

      setError(
        'Settlement form is not available for download.'
      );

      return;

    }


    window.open(
      settlementDownloadUrl,
      '_blank',
      'noopener,noreferrer'
    );

  };


  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="loading-state">
            Loading claim details...
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="page">

        <div className="alert error-alert">
          {error}
        </div>

        <button
          className="button secondary"
          onClick={() => navigate(-1)}
        >
          ← Go Back
        </button>

      </div>
    );
  }


  if (!travelRequest) {
    return (
      <div className="page">

        <div className="card empty-state">

          <h2>
            Claim not found
          </h2>

          <p>
            We could not find the requested Travel Request.
          </p>

          <button
            className="button secondary"
            onClick={() =>
              navigate('/dashboard')
            }
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  if (!isOwner && !isFinance) {
    return (
      <div className="page">

        <div className="card empty-state">

          <div className="empty-icon">
            !
          </div>

          <h2>
            Access restricted
          </h2>

          <p>
            You do not have access to this settlement.
          </p>

          <button
            className="button secondary"
            onClick={() =>
              navigate('/dashboard')
            }
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  const totalEmployeeClaim =
    Number(
      settlementSummary?.totalClaimPaidByEmployee ||
      0
    );


  const totalCompanyPaid =
    Number(
      settlementSummary?.totalPaidByCompany ||
      0
    );


  const nonReimbursable =
    Number(
      settlementSummary?.nonReimbursable ||
      0
    );


  const netReimbursable =
    Number(
      settlementSummary?.netReimbursableClaim ||
      0
    );


  const travelAdvance =
    Number(
      settlementSummary?.travelAdvance ||
      0
    );


  const payable =
    Number(
      settlementSummary?.amountPayableToEmployee ??
      finalData?.finalAmountPayable ??
      0
    );


  const recoverable =
    Number(
      settlementSummary?.amountRecoverableFromEmployee ??
      finalData?.finalAmountRecoverable ??
      0
    );


  return (
    <div className="page payout-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="payout-header">

        <div className="payout-header-content">

          <span className="eyebrow">
            TRIP SETTLEMENT
          </span>

          <div className="payout-title-row">

            <h1>
              {
                travelDetails?.travelRequestId ||
                travelRequest?.travelRequestId ||
                claimId
              }
            </h1>

            <StatusBadge
              status={workflowStatus}
            />

          </div>

          <p>
            Review the complete settlement, advance and payout details.
          </p>

        </div>

      </div>


      {/* =====================================================
          WORKFLOW
          ===================================================== */}

      <div className="payout-workflow-card">

        <TravelRequestStepper
          currentStep={currentStep}
        />

      </div>


      {/* =====================================================
          STATUS
          ===================================================== */}

      <div className="payout-status-card">

        <div className="payout-status-icon">
          {workflowStatus === 'Paid'
            ? '✓'
            : '₹'}
        </div>


        <div className="payout-status-main">

          <span className="eyebrow">
            SETTLEMENT STATUS
          </span>

          <h2>
            {workflowStatus}
          </h2>

          <p>
            {getStatusDescription(
              workflowStatus
            )}
          </p>

        </div>


        <div className="payout-finance-status">

          <span>
            FINANCE
          </span>

          <strong>
            {financeStatus}
          </strong>

        </div>

      </div>


      {/* =====================================================
          EMPLOYEE + TRAVEL DETAILS
          ===================================================== */}

      <div className="details-grid">

        {/* EMPLOYEE */}

        {/* EMPLOYEE */}

<div className="card claim-employee-card">

  <div className="card-header claim-employee-header">

    <div>

      <span className="eyebrow">
        EMPLOYEE
      </span>

      <h2>
        Employee Details
      </h2>

      <p className="claim-employee-subtitle">
        Employee information associated with this settlement.
      </p>

    </div>

  </div>


  <div className="claim-employee-profile">

    {/* AVATAR */}

    <div className="claim-employee-avatar">
      {
        employeeDetails?.employeeName
          ?.split(' ')
          .map((name) => name[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || '—'
      }
    </div>


    {/* PRIMARY EMPLOYEE INFO */}

    <div className="claim-employee-primary">

      <h3>
        {employeeDetails?.employeeName || '-'}
      </h3>

      <p>
        {employeeDetails?.designation || '-'}
      </p>

      <span className="claim-employee-code">
        {employeeDetails?.employeeCode || '-'}
      </span>

    </div>

  </div>


  {/* EMPLOYEE INFORMATION GRID */}

  <div className="claim-employee-info-grid">

    <div className="claim-employee-info">

      <span>
        Department
      </span>

      <strong>
        {employeeDetails?.department || '-'}
      </strong>

    </div>


    <div className="claim-employee-info">

      <span>
        Cost Centre
      </span>

      <strong>
        {employeeDetails?.costCentre || '-'}
      </strong>

    </div>


    <div className="claim-employee-info">

      <span>
        Reporting Manager
      </span>

      <strong>
        {
          employeeDetails
            ?.reportingManager
            ?.name || '-'
        }
      </strong>

      <small>
        {
          employeeDetails
            ?.reportingManager
            ?.employeeCode || ''
        }
      </small>

    </div>

  </div>

</div>


        {/* TRAVEL */}

{/* TRAVEL */}

<div className="card claim-trip-card">

  <div className="card-header claim-trip-header">

    <div>

      <span className="eyebrow">
        TRAVEL
      </span>

      <h2>
        Trip Details
      </h2>

      <p className="claim-trip-subtitle">
        Business travel information associated with this settlement.
      </p>

    </div>

  </div>


  {/* TRIP OVERVIEW */}

  <div className="claim-trip-overview">

    <div className="claim-trip-destination-icon">
      ✈
    </div>

    <div className="claim-trip-destination">

      <span>
        DESTINATION
      </span>

      <h3>
        {travelDetails?.destination || '-'}
      </h3>

      <p>
        {travelDetails?.company || 'Business Travel'}
      </p>

    </div>

  </div>


  {/* TRIP INFORMATION */}

  <div className="claim-trip-info-grid">

    <div className="claim-trip-info">

      <span>
        Travel Request ID
      </span>

      <strong>
        {
          travelDetails?.travelRequestId ||
          travelRequest?.travelRequestId ||
          '-'
        }
      </strong>

    </div>


    <div className="claim-trip-info">

      <span>
        Travel Category
      </span>

      <strong>
        {travelDetails?.travelCategory || '-'}
      </strong>

    </div>


    <div className="claim-trip-info">

      <span>
        From Date
      </span>

      <strong>
        {formatDate(
          travelDetails?.fromDate
        )}
      </strong>

    </div>


    <div className="claim-trip-info">

      <span>
        To Date
      </span>

      <strong>
        {formatDate(
          travelDetails?.toDate
        )}
      </strong>

    </div>


    <div className="claim-trip-info">

      <span>
        Mode of Travel
      </span>

      <strong>
        {travelDetails?.modeOfTravel || '-'}
      </strong>

    </div>


    <div className="claim-trip-info">

      <span>
        Currency
      </span>

      <strong>
        {travelDetails?.currency || 'INR'}
      </strong>

    </div>

  </div>


  {/* PURPOSE */}

  <div className="claim-trip-purpose">

    <span>
      TRAVEL PURPOSE
    </span>

    <p>
      {travelDetails?.purpose || '-'}
    </p>

  </div>

</div>
      </div>


      {/* =====================================================
          APPROVAL WORKFLOW
          ===================================================== */}

      <div className="card">

        <div className="card-header">

          <div>

            <span className="eyebrow">
              APPROVALS
            </span>

            <h2>
              Approval Workflow
            </h2>

          </div>

        </div>


        <div className="workflow-list">

          {workflow.length === 0 ? (

            <div className="empty-table">
              No approval workflow available.
            </div>

          ) : (

            workflow.map(
              (step, index) => (

                <div
                  className="workflow-row"
                  key={
                    `${
                      step.employeeCode ||
                      'step'
                    }-${index}`
                  }
                >

                  <div className="workflow-number">
                    {
                      step.level ||
                      index + 1
                    }
                  </div>


                  {/* <div className="workflow-person">

                    <strong>
                      {
                        step.role ||
                        'Approver'
                      }
                    </strong>

                    <span>
                      {step.name || '-'}

                      {step.employeeCode
                        ? ` · ${step.employeeCode}`
                        : ''}
                    </span>


                    {step.reason && (

                      <small>
                        {step.reason}
                      </small>

                    )}

                  </div> */}

                  <div className="workflow-person">
  <strong>{step.role || 'Approver'}</strong>
  <br />

  <span>{step.name || '-'}</span>
  <br />

  {step.employeeCode && (
    <>
      <span>{step.employeeCode}</span>
      <br />
    </>
  )}

  {step.reason && (
    <small>{step.reason}</small>
  )}
</div>


                  <div>

                    <StatusBadge
                      status={
                        step.status ||
                        (
                          step.required
                            ? 'Required'
                            : 'Not Required'
                        )
                      }
                    />

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>


      {/* =====================================================
          LODGING
          ===================================================== */}

      <ExpenseTable
        title="Lodging"
        items={lodging}
        emptyText="No lodging expenses found."
        columns={[

          {
            key: 'checkIn',
            label: 'Check-in',
            render: (item) =>
              formatDate(
                item.checkIn
              ),
          },

          {
            key: 'checkOut',
            label: 'Check-out',
            render: (item) =>
              formatDate(
                item.checkOut
              ),
          },

          {
            key: 'hotelName',
            label: 'Hotel',
          },

          {
            key: 'nights',
            label: 'Nights',
          },

          {
            key: 'paidBy',
            label: 'Paid By',
          },

          {
            key: 'amount',
            label: 'Amount',
            render: (item) =>
              formatCurrency(
                item.amount
              ),
          },

          {
            key: 'proofRef',
            label: 'Proof',
          },

        ]}
      />


      {/* =====================================================
          TRANSPORTATION
          ===================================================== */}

      <ExpenseTable
        title="Transportation"
        items={transportation}
        emptyText="No employee-paid transportation expenses found."
        columns={[

          {
            key: 'date',
            label: 'Date',
            render: (item) =>
              formatDate(
                item.date
              ),
          },

          {
            key: 'time',
            label: 'Time',
          },

          {
            key: 'from',
            label: 'From',
          },

          {
            key: 'to',
            label: 'To',
          },

          {
            key: 'mode',
            label: 'Mode',
          },

          {
            key: 'amount',
            label: 'Amount',
            render: (item) =>
              formatCurrency(
                item.amount
              ),
          },

          {
            key: 'proofRef',
            label: 'Proof',
          },

        ]}
      />


      {/* =====================================================
          OTHER EXPENSES
          ===================================================== */}

      <ExpenseTable
        title="Other Expenses"
        items={otherExpenses}
        emptyText="No other expenses found."
        columns={[

          {
            key: 'date',
            label: 'Date',
            render: (item) =>
              formatDate(
                item.date
              ),
          },

          {
            key: 'head',
            label: 'Expense Head',
          },

          {
            key: 'description',
            label: 'Description',
          },

          {
            key: 'amount',
            label: 'Amount',
            render: (item) =>
              formatCurrency(
                item.amount
              ),
          },

          {
            key: 'proofRef',
            label: 'Proof',
          },

          {
            key: 'status',
            label: 'Status',

            render: (item) => (

              <StatusBadge
                status={
                  item.status ||
                  'Reimbursable'
                }
              />

            ),

          },

        ]}
      />


      {/* =====================================================
          FINANCIAL SUMMARY
          ===================================================== */}

      <div className="payout-summary-card">

        <div className="payout-section-header">

          <div>

            <span className="eyebrow">
              FINANCIAL SUMMARY
            </span>

            <h2>
              Settlement Summary
            </h2>

            <p>
              Final claim calculation after Finance verification.
            </p>

          </div>

        </div>


        <div className="payout-summary-grid">

          {/* EMPLOYEE CLAIM */}

          <div className="payout-summary-item">

            <span>
              Employee-paid claim
            </span>

            <strong>
              {formatCurrency(
                totalEmployeeClaim
              )}
            </strong>

          </div>


          {/* COMPANY PAID */}

          <div className="payout-summary-item">

            <span>
              Company-paid expenses
            </span>

            <strong>
              {formatCurrency(
                totalCompanyPaid
              )}
            </strong>

          </div>


          {/* NON REIMBURSABLE */}

          <div className="payout-summary-item negative">

            <span>
              Non-reimbursable
            </span>

            <strong>
              {formatCurrency(
                nonReimbursable
              )}
            </strong>

          </div>


          {/* NET CLAIM */}

          <div className="payout-summary-item">

            <span>
              Net reimbursable claim
            </span>

            <strong>
              {formatCurrency(
                netReimbursable
              )}
            </strong>

          </div>


          {/* ADVANCE */}

          <div className="payout-summary-item">

            <span>
              Travel advance
            </span>

            <strong>
              {formatCurrency(
                travelAdvance
              )}
            </strong>

          </div>


          {/* PAYABLE */}

          <div className="payout-summary-item highlight">

            <span>
              Amount payable to employee
            </span>

            <strong>
              {formatCurrency(
                payable
              )}
            </strong>

          </div>


          {/* RECOVERABLE */}

          <div className="payout-summary-item warning">

            <span>
              Amount recoverable from employee
            </span>

            <strong>
              {formatCurrency(
                recoverable
              )}
            </strong>

          </div>

        </div>

                {settlementDownloadUrl && (

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >

            <button
              type="button"
              className="button primary"
              onClick={
                handleDownloadSettlementForm
              }
            >

              ↓ Download Settlement Form

            </button>

          </div>

        )}

      </div>


      {/* =====================================================
          TRAVEL ADVANCE
          ===================================================== */}

      <div className="payout-advance-card">

        <div className="payout-section-header">

          <div>

            <span className="eyebrow">
              ADVANCE
            </span>

            <h2>
              Travel Advance
            </h2>

            <p>
              Advance issued for this travel request.
            </p>

          </div>

        </div>


        <div className="payout-advance-grid">

          <div className="payout-advance-item">

            <span>
              Requested
            </span>

            <strong>
              {formatCurrency(
                settlement
                  ?.travelAdvance
                  ?.requested || 0
              )}
            </strong>

          </div>


          <div className="payout-advance-item">

            <span>
              Drawn
            </span>

            <strong>
              {formatCurrency(
                settlement
                  ?.travelAdvance
                  ?.drawn || 0
              )}
            </strong>

          </div>


          <div className="payout-advance-item">

            <span>
              Reference
            </span>

            <strong>
              {
                settlement
                  ?.travelAdvance
                  ?.reference || '-'
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================================
          EMPLOYEE NOTICE
          ===================================================== */}

      {!isFinance && (

        <div className="payout-notice-card">

          <div className="payout-notice-icon">
            ℹ
          </div>

          <div>

            <strong>
              Finance verification is handled by Finance.
            </strong>

            <p>
              Your settlement is automatically processed
              through Finance verification and payout.
            </p>

          </div>

        </div>

      )}


      {/* =====================================================
          FINANCE SHORTCUT
          ===================================================== */}

{isFinance &&
  workflowStatus !== 'Paid' && (

    <div className="finance-shortcut">

      <div>

        <span className="eyebrow">
          FINANCE
        </span>

        <h2>
          Finance Actions
        </h2>

        <p>
          Finance can verify the settlement and
          release the payout.
        </p>

      </div>

      <button
        className="button primary"
        onClick={() =>
          navigate('/finance')
        }
      >
        Open Finance →
      </button>

    </div>
)}

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <div className="page-actions">

        {/* <button
          className="button secondary"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back
        </button> */}

      </div>

    </div>
  );
}
