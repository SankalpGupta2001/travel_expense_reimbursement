import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import StatusBadge from '../components/StatusBadge.jsx';

import {
  loadClaims,
  verifyFinance,
  releasePayment,
  markRecovery,
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

const Finance = () => {
  const navigate =
    useNavigate();

  const [
    claims,
    setClaims,
  ] = useState([]);

  const refresh =
    () =>
      setClaims(
        loadClaims()
      );

  useEffect(() => {
    refresh();
  }, []);

  const financeClaims =
    claims.filter(
      (claim) =>
        claim.approvalWorkflow?.some(
          (step) =>
            step.role ===
              'Finance Verification' &&
            step.status ===
              'Pending'
        ) ||
        claim.status ===
          'Payment Pending' ||
        claim.status ===
          'Recovery Pending'
    );

  const handleVerify =
    (claim) => {
      verifyFinance(claim);
      refresh();
    };

  const handlePayment =
    (claim) => {
      releasePayment(claim);
      refresh();
    };

  const handleRecovery =
    (claim) => {
      markRecovery(claim);
      refresh();
    };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            FINANCE PORTAL
          </span>

          <h2>
            Finance Verification
          </h2>

          <p>
            Verify approved claims
            and process payment or
            recovery.
          </p>
        </div>
      </div>

      {financeClaims.length ===
      0 ? (
        <div className="empty-state page-empty">
          <div className="empty-icon">
            ₹
          </div>

          <h2>
            No finance actions
          </h2>

          <p>
            No claims are currently
            waiting for Finance.
          </p>
        </div>
      ) : (
        <div className="finance-list">
          {financeClaims.map(
            (claim) => {
              const summary =
                claim.settlementSummary ||
                {};

              const payable =
                Number(
                  summary.amountPayableToEmployee
                ) || 0;

              const recoverable =
                Number(
                  summary.amountRecoverableFromEmployee
                ) || 0;

              const financePending =
                claim.approvalWorkflow?.some(
                  (step) =>
                    step.role ===
                      'Finance Verification' &&
                    step.status ===
                      'Pending'
                );

              return (
                <div
                  className="finance-card"
                  key={
                    claim.travelDetails.travelRequestId
                  }
                >
                  <div className="finance-header">
                    <div>
                      <div className="claim-title-row">
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
                    </div>

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
                  </div>

                  <div className="finance-grid">
                    <div>
                      <span>
                        Net Claim
                      </span>

                      <strong>
                        {currency(
                          summary.netReimbursableClaim
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Advance
                      </span>

                      <strong>
                        {currency(
                          summary.travelAdvance
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Payable
                      </span>

                      <strong className="success-text">
                        {currency(
                          payable
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Recoverable
                      </span>

                      <strong className="danger-text">
                        {currency(
                          recoverable
                        )}
                      </strong>
                    </div>
                  </div>

                  {financePending && (
                    <div className="finance-checklist">
                      <h4>
                        Verification
                        Checklist
                      </h4>

                      <label>
                        <input
                          type="checkbox"
                        />
                        Supporting
                        documents checked
                      </label>

                      <label>
                        <input
                          type="checkbox"
                        />
                        Duplicate
                        transactions checked
                      </label>

                      <label>
                        <input
                          type="checkbox"
                        />
                        Company-paid
                        expenses checked
                      </label>

                      <label>
                        <input
                          type="checkbox"
                        />
                        Policy
                        compliance checked
                      </label>

                      <label>
                        <input
                          type="checkbox"
                        />
                        Advance
                        adjustment checked
                      </label>
                    </div>
                  )}

                  <div className="finance-actions">
                    {financePending ? (
                      <button
                        className="button primary"
                        onClick={() =>
                          handleVerify(
                            claim
                          )
                        }
                      >
                        ✓ Verify Claim
                      </button>
                    ) : claim.status ===
                      'Payment Pending' ? (
                      <button
                        className="button primary"
                        onClick={() =>
                          handlePayment(
                            claim
                          )
                        }
                      >
                        ₹ Release Payment
                      </button>
                    ) : claim.status ===
                      'Recovery Pending' ? (
                      <button
                        className="button danger"
                        onClick={() =>
                          handleRecovery(
                            claim
                          )
                        }
                      >
                        Initiate Recovery
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};

export default Finance;