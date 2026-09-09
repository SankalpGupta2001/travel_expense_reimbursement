import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import StatusBadge from '../components/StatusBadge.jsx';

import {
  approveCurrentStep,
  loadClaims,
  returnClaim,
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

const Approvals = () => {
  const navigate =
    useNavigate();

  const [
    claims,
    setClaims,
  ] = useState([]);

  const [
    returnModal,
    setReturnModal,
  ] = useState(null);

  const [
    remarks,
    setRemarks,
  ] = useState('');

  const refresh =
    () => {
      setClaims(
        loadClaims()
      );
    };

  useEffect(() => {
    refresh();
  }, []);

  const pendingClaims =
    claims.filter(
      (claim) =>
        claim.approvalWorkflow?.some(
          (step) =>
            step.status ===
            'Pending'
        )
    );

  const handleApprove =
    (claim) => {
      approveCurrentStep(
        claim
      );

      refresh();
    };

  const handleReturn =
    () => {
      if (!remarks.trim()) {
        return;
      }

      returnClaim(
        returnModal,
        remarks.trim()
      );

      setReturnModal(null);
      setRemarks('');
      refresh();
    };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            APPROVER PORTAL
          </span>

          <h2>
            Pending Approvals
          </h2>

          <p>
            Review and action claims
            assigned to your approval
            level.
          </p>
        </div>

        <div className="page-counter">
          <strong>
            {pendingClaims.length}
          </strong>

          <span>
            pending
          </span>
        </div>
      </div>

      {pendingClaims.length ===
      0 ? (
        <div className="empty-state page-empty">
          <div className="empty-icon">
            ✓
          </div>

          <h2>
            No pending approvals
          </h2>

          <p>
            All assigned claims have
            been processed.
          </p>
        </div>
      ) : (
        <div className="approval-list">
          {pendingClaims.map(
            (claim) => {
              const currentStep =
                claim.approvalWorkflow.find(
                  (step) =>
                    step.status ===
                    'Pending'
                );

              return (
                <div
                  className="approval-card"
                  key={claim.travelDetails.travelRequestId}
                >
                  <div className="approval-card-main">
                    <div className="claim-icon">
                      ✈
                    </div>

                    <div className="approval-info">
                      <div className="approval-title">
                        <h3>
                          {
                            claim.travelDetails
                              ?.travelRequestId
                          }
                        </h3>

                        <StatusBadge
                          status={
                            claim.status
                          }
                        />
                      </div>

                      <p>
                        {
                          claim.employeeDetails
                            ?.employeeName
                        }{' '}
                        ·{' '}
                        {
                          claim.employeeDetails
                            ?.employeeCode
                        }
                      </p>

                      <div className="approval-meta">
                        <span>
                          {
                            claim.travelDetails
                              ?.destination
                          }
                        </span>

                        <span>
                          {currency(
                            claim
                              .settlementSummary
                              ?.netReimbursableClaim
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="current-approver">
                    <span>
                      CURRENT STEP
                    </span>

                    <strong>
                      {currentStep?.role}
                    </strong>

                    <small>
                      {currentStep?.name}
                      {' · '}
                      {
                        currentStep?.employeeCode
                      }
                    </small>
                  </div>

                  <div className="approval-actions">
                    <button
                      className="button secondary"
                      onClick={() =>
                       navigate(
  `/claims/${claim.travelDetails.travelRequestId}`
)
                      }
                    >
                      View Claim
                    </button>

                    <button
                      className="button danger-outline"
                      onClick={() =>
                        setReturnModal(
                          claim
                        )
                      }
                    >
                      Return
                    </button>

                    <button
                      className="button primary"
                      onClick={() =>
                        handleApprove(
                          claim
                        )
                      }
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {returnModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>
                  Return Claim
                </h3>

                <p>
                  {
                    returnModal.travelRequestId
                  }
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setReturnModal(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="full-label">
                <span>
                  Remarks
                </span>

                <textarea
                  rows="5"
                  placeholder="Explain what needs to be corrected..."
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(
                      event.target
                        .value
                    )
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="button secondary"
                onClick={() => {
                  setReturnModal(
                    null
                  );
                  setRemarks('');
                }}
              >
                Cancel
              </button>

              <button
                className="button danger"
                disabled={
                  !remarks.trim()
                }
                onClick={
                  handleReturn
                }
              >
                Return Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;