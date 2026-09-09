import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import ExpenseTable from '../components/ExpenseTable.jsx';
import ApprovalTimeline from '../components/ApprovalTimeline.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EditExpenseModal from '../components/EditExpenseModal.jsx';

import {
  getSettlementDownloadUrl,
} from '../services/expense.api.js';

import {
  getClaim,
  submitClaim,
  resubmitClaim,
  upsertClaim,
} from '../services/workflow.js';

const currency = (
  amount
) =>
  new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(Number(amount) || 0);

const ClaimDetails = () => {
  const {
    claimId,
  } = useParams();

  const navigate =
    useNavigate();

  const [
    claim,
    setClaim,
  ] = useState(null);

  const [
    editState,
    setEditState,
  ] = useState(null);

  const [
    showSubmitModal,
    setShowSubmitModal,
  ] = useState(false);

  useEffect(() => {
    const storedClaim =
      getClaim(claimId);

    setClaim(storedClaim);
  }, [claimId]);

  const isDraft =
    claim?.status === 'Draft';

  const isReturned =
    claim?.status === 'Returned';

  const isEditable =
    isDraft || isReturned;

  const grossClaim =
    Number(
      claim?.settlementSummary
        ?.netReimbursableClaim
    ) || 0;

  const approvalMessage =
    useMemo(() => {
      if (!claim) return '';

      if (grossClaim <= 25000) {
        return 'Reporting Manager approval is required before Finance verification.';
      }

      if (grossClaim <= 75000) {
        return 'Reporting Manager and HOD approval are required before Finance verification.';
      }

      if (grossClaim <= 200000) {
        return 'Reporting Manager, HOD and Head of Division approval are required.';
      }

      return 'Reporting Manager, HOD, Head of Division and MD/CEO approval are required.';
    }, [
      claim,
      grossClaim,
    ]);

  if (!claim) {
    return (
      <div className="empty-state page-empty">
        <div className="empty-icon">
          !
        </div>

        <h2>
          Claim not found
        </h2>

        <p>
          The requested expense
          claim is not available.
        </p>

        <button
          className="button primary"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const updateExpense = (
    type,
    index,
    updatedExpense
  ) => {
    const updated = {
      ...claim,
      [type]: claim[type].map(
        (item, itemIndex) =>
          itemIndex === index
            ? updatedExpense
            : item
      ),
    };

    setClaim(updated);
    upsertClaim(updated);
    setEditState(null);
  };

  const excludeExpense = (
    type,
    index
  ) => {
    const updatedExpenses =
      claim[type].map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                status:
                  'Excluded by Employee',
              }
            : item
      );

    const updated = {
      ...claim,
      [type]: updatedExpenses,
    };

    setClaim(updated);
    upsertClaim(updated);
  };

  const handleSubmit =
    () => {
      const updated =
        submitClaim(claim);

      setClaim(updated);
      setShowSubmitModal(false);
    };

  const handleResubmit =
    () => {
      const updated =
        resubmitClaim(claim);

      setClaim(updated);
    };

  const downloadUrl =
    getSettlementDownloadUrl(
      claim.settlementForm
        ?.downloadUrl
    );

  return (
    <div>
      <div className="breadcrumb">
        <button
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Dashboard
        </button>

        <span>›</span>

        <span>
          {claim.travelDetails
            ?.travelRequestId}
        </span>
      </div>

      <div className="claim-header">
        <div>
          <div className="claim-title-row">
            <h2>
              Travel Expense Settlement
            </h2>

            <StatusBadge
              status={claim.status}
            />
          </div>

          <p>
            {
              claim.travelDetails
                ?.travelRequestId
            }{' '}
            ·{' '}
            {
              claim.travelDetails
                ?.destination
            }
          </p>
        </div>

        <div className="claim-header-actions">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="button secondary"
              target="_blank"
              rel="noreferrer"
            >
              ↓ Download Excel
            </a>
          )}

          {isDraft && (
            <button
              className="button primary"
              onClick={() =>
                setShowSubmitModal(true)
              }
            >
              Submit for Approval
            </button>
          )}

          {isReturned && (
            <button
              className="button primary"
              onClick={
                handleResubmit
              }
            >
              Resubmit Claim
            </button>
          )}
        </div>
      </div>

      {isReturned &&
        claim.returnRemarks && (
          <div className="alert warning-alert">
            <strong>
              Claim returned for
              correction
            </strong>

            <p>
              {claim.returnRemarks}
            </p>
          </div>
        )}

      <div className="detail-grid">
        <section className="data-section">
          <div className="section-heading">
            <div>
              <h3>
                Employee Details
              </h3>

              <p>
                Claimant information
              </p>
            </div>
          </div>

          <div className="detail-fields">
            <div>
              <span>
                Employee
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.employeeName
                }
              </strong>
            </div>

            <div>
              <span>
                Employee Code
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.employeeCode
                }
              </strong>
            </div>

            <div>
              <span>
                Designation
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.designation
                }
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.department
                }
              </strong>
            </div>

            <div>
              <span>
                Cost Centre
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.costCentre
                }
              </strong>
            </div>

            <div>
              <span>
                Reporting Manager
              </span>

              <strong>
                {
                  claim.employeeDetails
                    ?.reportingManager
                    ?.name
                }
              </strong>
            </div>
          </div>
        </section>

        <section className="data-section">
          <div className="section-heading">
            <div>
              <h3>
                Travel Details
              </h3>

              <p>
                Approved travel
                information
              </p>
            </div>
          </div>

          <div className="detail-fields">
            <div>
              <span>
                Travel Request
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.travelRequestId
                }
              </strong>
            </div>

            <div>
              <span>
                Travel Dates
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.fromDate
                }{' '}
                →{' '}
                {
                  claim.travelDetails
                    ?.toDate
                }
              </strong>
            </div>

            <div>
              <span>
                Destination
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.destination
                }
              </strong>
            </div>

            <div>
              <span>
                Company
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.company
                }
              </strong>
            </div>

            <div>
              <span>
                Purpose
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.purpose
                }
              </strong>
            </div>

            <div>
              <span>
                Travel Category
              </span>

              <strong>
                {
                  claim.travelDetails
                    ?.travelCategory
                }
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="data-section">
        <div className="section-heading">
          <div>
            <h3>
              Estimated Cost
            </h3>

            <p>
              Amounts from the
              approved travel request
            </p>
          </div>
        </div>

        <div className="estimated-grid">
          {Object.entries(
            claim.estimatedCost ||
              {}
          )
            .filter(
              ([key]) =>
                key !== 'total'
            )
            .map(
              ([
                key,
                item,
              ]) => (
                <div
                  className="estimate-card"
                  key={key}
                >
                  <span>
                    {key
                      .replace(
                        /([A-Z])/g,
                        ' $1'
                      )
                      .replace(
                        /^./,
                        (char) =>
                          char.toUpperCase()
                      )}
                  </span>

                  <strong>
                    {currency(
                      item?.amount
                    )}
                  </strong>

                  <small>
                    {item?.borneBy ||
                      '—'}
                  </small>
                </div>
              )
            )}

          <div className="estimate-card total">
            <span>
              Total Estimated
            </span>

            <strong>
              {currency(
                claim.estimatedCost
                  ?.total
              )}
            </strong>
          </div>
        </div>
      </section>

      <ExpenseTable
        title="Lodging Expenses"
        expenses={
          claim.lodging || []
        }
        type="lodging"
        editable={isEditable}
        onEdit={(
          type,
          index
        ) =>
          setEditState({
            type,
            index,
            expense:
              claim[type][index],
          })
        }
      />

      <ExpenseTable
        title="Transportation"
        expenses={
          claim.transportation ||
          []
        }
        type="transportation"
        editable={isEditable}
        onEdit={(
          type,
          index
        ) =>
          setEditState({
            type,
            index,
            expense:
              claim[type][index],
          })
        }
      />

      <ExpenseTable
        title="Other Expenses"
        expenses={
          claim.otherExpenses ||
          []
        }
        type="otherExpenses"
        editable={isEditable}
        onEdit={(
          type,
          index
        ) =>
          setEditState({
            type,
            index,
            expense:
              claim[type][index],
          })
        }
        onExclude={
          excludeExpense
        }
      />

      <SummaryCard
        claim={claim}
      />

      {claim.status !==
        'Draft' &&
        claim.approvalWorkflow
          ?.length > 0 && (
          <section className="data-section">
            <div className="section-heading">
              <div>
                <h3>
                  Approval Workflow
                </h3>

                <p>
                  {approvalMessage}
                </p>
              </div>
            </div>

            <ApprovalTimeline
              workflow={
                claim.approvalWorkflow
              }
            />
          </section>
        )}

      <section className="submission-card">
        <div>
          <span className="eyebrow">
            CLAIM ACTION
          </span>

          <h3>
            {isDraft
              ? 'Review your claim before submitting'
              : claim.status}
          </h3>

          <p>
            {isDraft
              ? 'Check extracted expenses, supporting documents and settlement amount before sending the claim through the approval workflow.'
              : 'Track the claim through the Nortex approval and finance process from this page.'}
          </p>
        </div>

        <div className="submission-actions">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="button secondary"
              target="_blank"
              rel="noreferrer"
            >
              Download Excel
            </a>
          )}

          {isDraft && (
            <button
              className="button primary"
              onClick={() =>
                setShowSubmitModal(
                  true
                )
              }
            >
              Submit for Approval
            </button>
          )}

          {isReturned && (
            <button
              className="button primary"
              onClick={
                handleResubmit
              }
            >
              Resubmit
            </button>
          )}
        </div>
      </section>

      {editState && (
        <EditExpenseModal
          expense={
            editState.expense
          }
          type={editState.type}
          onClose={() =>
            setEditState(null)
          }
          onSave={(
            updatedExpense
          ) =>
            updateExpense(
              editState.type,
              editState.index,
              updatedExpense
            )
          }
        />
      )}

      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal confirmation-modal">
            <div className="modal-header">
              <div>
                <h3>
                  Submit Claim?
                </h3>

                <p>
                  Confirm your
                  expense settlement
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowSubmitModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="confirmation-content">
              <div className="confirmation-icon">
                ✓
              </div>

              <p>
                I confirm that I have
                reviewed the extracted
                expenses, amounts and
                supporting documents.
              </p>

              <div className="confirmation-summary">
                <span>
                  Claim Amount
                </span>

                <strong>
                  {currency(
                    claim
                      .settlementSummary
                      ?.netReimbursableClaim
                  )}
                </strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="button secondary"
                onClick={() =>
                  setShowSubmitModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                className="button primary"
                onClick={
                  handleSubmit
                }
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimDetails;