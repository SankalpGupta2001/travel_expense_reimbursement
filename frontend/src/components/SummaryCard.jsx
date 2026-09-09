const formatCurrency = (
  amount
) => {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(Number(amount) || 0);
};

const SummaryCard = ({
  claim,
}) => {
  const summary =
    claim?.settlementSummary || {};

  return (
    <div className="summary-card">
      <div className="section-heading">
        <div>
          <h3>
            Settlement Summary
          </h3>

          <p>
            Final reimbursement
            calculation
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-row">
          <span>
            Employee expenses
          </span>

          <strong>
            {formatCurrency(
              summary.totalClaimPaidByEmployee
            )}
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Company paid
          </span>

          <strong>
            {formatCurrency(
              summary.totalPaidByCompany
            )}
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Non-reimbursable
          </span>

          <strong className="danger-text">
            {formatCurrency(
              summary.nonReimbursable
            )}
          </strong>
        </div>

        <div className="summary-row total-row">
          <span>
            Net reimbursable claim
          </span>

          <strong>
            {formatCurrency(
              summary.netReimbursableClaim
            )}
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Travel advance
          </span>

          <strong>
            {formatCurrency(
              summary.travelAdvance
            )}
          </strong>
        </div>

        <div className="summary-row payable-row">
          <span>
            Amount payable
          </span>

          <strong>
            {formatCurrency(
              summary.amountPayableToEmployee
            )}
          </strong>
        </div>

        <div className="summary-row recovery-row">
          <span>
            Amount recoverable
          </span>

          <strong>
            {formatCurrency(
              summary.amountRecoverableFromEmployee
            )}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;