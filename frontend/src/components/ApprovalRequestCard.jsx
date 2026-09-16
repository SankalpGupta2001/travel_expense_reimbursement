import StatusBadge from './StatusBadge.jsx';

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
  ).format(
    Number(amount) || 0
  );

const ApprovalRequestCard = ({
  request,
  currentApproverCode,
  onOpen,
}) => {
  const workflow =
    request.approvalWorkflow ||
    [];

  const currentStep =
    workflow.find(
      (step) =>
        step.status ===
        'Pending'
    );

  const isCurrentApprover =
    currentStep
      ?.employeeCode ===
    currentApproverCode;

  return (
    <div className="approval-request-card">
      <div className="approval-request-card-main">
        <div className="approval-request-icon">
          ✈
        </div>

        <div className="approval-request-info">
          <div className="approval-request-heading">
            <strong>
              {
                request.travelRequestId
              }
            </strong>

            <StatusBadge
              status={
                request.status
              }
            />
          </div>

          <h3>
            {
              request.employee
                ?.name
            }
          </h3>

          <p>
            {
              request.employee
                ?.designation
            }
          </p>

          <div className="approval-request-meta">
            <span>
              <b>
                Destination
              </b>

              {
                request.destination
              }
            </span>

            <span>
              <b>
                Travel
              </b>

              {
                request.fromDate
              }{' '}
              →
              {' '}
              {
                request.toDate
              }
            </span>

            <span>
              <b>
                Category
              </b>

              {
                request.travelCategory
              }
            </span>
          </div>
        </div>
      </div>

      <div className="approval-request-amount">
        <span>
          Estimated Cost
        </span>

        <strong>
          {currency(
            request
              .estimatedCost
              ?.total
          )}
        </strong>

        {request.advance
          ?.requested >
          0 && (
          <small>
            Advance:{' '}
            {currency(
              request.advance
                .requested
            )}
          </small>
        )}
      </div>

      <div className="approval-request-action">
        <div className="approval-next">
          <span>
            Current Step
          </span>

          <strong>
            {currentStep
              ? currentStep.role
              : 'Completed'}
          </strong>

          {isCurrentApprover && (
            <small>
              Requires your
              action
            </small>
          )}
        </div>

        <button
          className={`button ${
            isCurrentApprover
              ? 'primary'
              : 'secondary'
          }`}
          onClick={() =>
            onOpen(request)
          }
        >
          {isCurrentApprover
            ? 'Review Request'
            : 'View Request'}
        </button>
      </div>
    </div>
  );
};

export default ApprovalRequestCard;