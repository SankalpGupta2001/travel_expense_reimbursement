const ApprovalTimeline = ({
  workflow = [],
}) => {
  if (!workflow.length) {
    return (
      <div className="approval-empty">
        No approval workflow
        configured.
      </div>
    );
  }

  return (
    <div className="approval-timeline">
      {workflow.map(
        (step, index) => {
          const isPending =
            step.status ===
            'Pending';

          const isApproved =
            step.status ===
            'Approved';

          const isReturned =
            step.status ===
            'Returned';

          const isWaiting =
            step.status ===
            'Waiting';

          return (
            <div
              className={`approval-step ${
                isPending
                  ? 'pending'
                  : isApproved
                  ? 'approved'
                  : isReturned
                  ? 'returned'
                  : 'waiting'
              }`}
              key={`${step.level}-${step.employeeCode}`}
            >
              {index <
                workflow.length -
                  1 && (
                <div className="approval-connector" />
              )}

              <div className="approval-step-icon">
                {isApproved
                  ? '✓'
                  : isReturned
                  ? '!'
                  : step.level}
              </div>

              <div className="approval-step-content">
                <div className="approval-step-top">
                  <div>
                    <div className="approval-step-role">
                      {
                        step.role
                      }
                    </div>

                    <div className="approval-step-person">
                      {
                        step.name
                      }

                      <span>
                        {
                          step.employeeCode
                        }
                      </span>
                    </div>
                  </div>

                  <span className="approval-status">
                    {
                      step.status
                    }
                  </span>
                </div>

                {isPending && (
                  <div className="approval-current">
                    Current approval step
                  </div>
                )}

                {isWaiting && (
                  <div className="approval-waiting">
                    Waiting for previous
                    approval
                  </div>
                )}

                {step.reason && (
                  <div className="approval-reason">
                    {
                      step.reason
                    }
                  </div>
                )}

                {step.remarks && (
                  <div className="approval-remarks">
                    <strong>
                      Remarks:
                    </strong>{' '}
                    {
                      step.remarks
                    }
                  </div>
                )}

                {step.actionedAt && (
                  <div className="approval-action-date">
                    {new Date(
                      step.actionedAt
                    ).toLocaleString(
                      'en-IN'
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export default ApprovalTimeline;