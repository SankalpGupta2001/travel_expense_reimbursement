import {
  useState,
} from 'react';

const ApprovalActionModal = ({
  action,
  request,
  onClose,
  onConfirm,
}) => {
  const [
    remarks,
    setRemarks,
  ] = useState('');

  const isReturn =
    action === 'return';

  const handleConfirm =
    () => {
      if (
        isReturn &&
        !remarks.trim()
      ) {
        return;
      }

      onConfirm(
        remarks.trim()
      );
    };

  return (
    <div className="modal-overlay">
      <div className="modal approval-action-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {isReturn
                ? 'RETURN REQUEST'
                : 'APPROVE REQUEST'}
            </span>

            <h3>
              {isReturn
                ? 'Return Travel Request'
                : 'Approve Travel Request'}
            </h3>

            <p>
              {
                request.travelRequestId
              }
            </p>
          </div>

          <button
            className="modal-close"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {isReturn ? (
            <>
              <div className="modal-warning">
                <span>!</span>

                <div>
                  <strong>
                    Remarks are
                    required
                  </strong>

                  <p>
                    Tell the employee
                    what needs to be
                    corrected before
                    resubmission.
                  </p>
                </div>
              </div>

              <label>
                <span>
                  Return Remarks
                </span>

                <textarea
                  rows="5"
                  value={
                    remarks
                  }
                  onChange={(
                    event
                  ) =>
                    setRemarks(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Please provide a more detailed business purpose."
                />
              </label>
            </>
          ) : (
            <div className="modal-success">
              <div className="modal-success-icon">
                ✓
              </div>

              <h4>
                Approve this
                request?
              </h4>

              <p>
                This will move the
                request to the next
                approval level.
              </p>

              <label>
                <span>
                  Remarks
                  <small>
                    {' '}
                    Optional
                  </small>
                </span>

                <textarea
                  rows="4"
                  value={
                    remarks
                  }
                  onChange={(
                    event
                  ) =>
                    setRemarks(
                      event.target
                        .value
                    )
                  }
                  placeholder="Add an optional approval remark..."
                />
              </label>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="button secondary"
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            className={`button ${
              isReturn
                ? 'danger'
                : 'primary'
            }`}
            onClick={
              handleConfirm
            }
            disabled={
              isReturn &&
              !remarks.trim()
            }
          >
            {isReturn
              ? 'Return Request'
              : 'Approve Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalActionModal;