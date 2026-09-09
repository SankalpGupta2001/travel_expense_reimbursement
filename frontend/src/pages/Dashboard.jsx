import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  loadClaims,
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

const Dashboard = () => {
  const navigate =
    useNavigate();

  const [
    claims,
    setClaims,
  ] = useState([]);

  useEffect(() => {
    setClaims(loadClaims());
  }, []);

  const pending =
    claims.filter(
      (claim) =>
        claim.status ===
          'Pending Approval' ||
        claim.status ===
          'Finance Verification'
    ).length;

  const completed =
    claims.filter(
      (claim) =>
        claim.status ===
          'Payment Released' ||
        claim.status ===
          'Completed'
    ).length;

  const returned =
    claims.filter(
      (claim) =>
        claim.status ===
        'Returned'
    ).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h2>
            Good afternoon,
            Chaitanya
          </h2>

          <p>
            Manage your travel
            expenses and settlement
            approvals.
          </p>
        </div>

        <button
          className="button primary"
          onClick={() =>
            navigate('/process')
          }
        >
          + Process Expense
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Claims"
          value={claims.length}
          description="All submitted claims"
          icon="▦"
        />

        <StatCard
          title="Pending Approval"
          value={pending}
          description="Awaiting action"
          icon="◷"
        />

        <StatCard
          title="Returned"
          value={returned}
          description="Needs correction"
          icon="↩"
        />

        <StatCard
          title="Completed"
          value={completed}
          description="Payment completed"
          icon="✓"
        />
      </div>

      <div className="dashboard-grid">
        <section className="data-section">
          <div className="section-heading">
            <div>
              <h3>
                Recent Claims
              </h3>

              <p>
                Your latest travel
                expense settlements
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate('/process')
              }
            >
              New claim →
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ₹
              </div>

              <h3>
                No claims yet
              </h3>

              <p>
                Process the provided
                expense pack to
                generate your first
                settlement.
              </p>

              <button
                className="button primary"
                onClick={() =>
                  navigate('/process')
                }
              >
                Process Expense
              </button>
            </div>
          ) : (
            <div className="claim-list">
              {claims.map(
                (claim) => (
                  <div
                    className="claim-list-item"
                    key={
                      claim.travelDetails.travelRequestId
                    }
                    onClick={() =>
                      navigate(
                        `/claims/${claim.travelDetails.travelRequestId}`
                      )
                    }
                  >
                    <div className="claim-icon">
                      ✈
                    </div>

                    <div className="claim-info">
                      <strong>
                        {
                          claim.travelDetails.travelRequestId
                        }
                      </strong>

                      <span>
                        {
                          claim.travelDetails
                            ?.destination
                        }{' '}
                        ·{' '}
                        {
                          claim.travelDetails
                            ?.fromDate
                        }
                      </span>
                    </div>

                    <div className="claim-amount">
                      <strong>
                        {currency(
                          claim
                            .settlementSummary
                            ?.netReimbursableClaim
                        )}
                      </strong>

                      <StatusBadge
                        status={
                          claim.status
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="info-card">
          <div className="info-card-icon">
            ✓
          </div>

          <h3>
            Expense workflow
          </h3>

          <p>
            Your claim follows
            Nortex's reimbursement
            process automatically.
          </p>

          <div className="mini-workflow">
            <span>
              <b>1</b> Review & Submit
            </span>

            <span>
              <b>2</b> Business Approval
            </span>

            <span>
              <b>3</b> Finance Verification
            </span>

            <span>
              <b>4</b> Payment / Recovery
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;