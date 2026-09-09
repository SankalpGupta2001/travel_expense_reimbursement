import {
  useEffect,
  useState,
} from 'react';

const EditExpenseModal = ({
  expense,
  type,
  onClose,
  onSave,
}) => {
  const [
    form,
    setForm,
  ] = useState(expense || {});

  useEffect(() => {
    setForm(expense || {});
  }, [expense]);

  if (!expense) {
    return null;
  }

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>
              Edit Expense
            </h3>

            <p>
              Update extracted
              expense details
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              <span>Date</span>

              <input
                value={
                  form.date ||
                  form.checkIn ||
                  ''
                }
                onChange={(event) =>
                  updateField(
                    type ===
                      'lodging'
                      ? 'checkIn'
                      : 'date',
                    event.target.value
                  )
                }
              />
            </label>

            {type ===
              'lodging' && (
              <label>
                <span>
                  Check Out
                </span>

                <input
                  value={
                    form.checkOut ||
                    ''
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      'checkOut',
                      event.target
                        .value
                    )
                  }
                />
              </label>
            )}

            <label>
              <span>
                Amount
              </span>

              <input
                type="number"
                step="0.01"
                value={
                  form.amount ??
                  ''
                }
                onChange={(event) =>
                  updateField(
                    'amount',
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />
            </label>

            <label>
              <span>
                Paid By
              </span>

              <select
                value={
                  form.paidBy ||
                  'Employee'
                }
                onChange={(event) =>
                  updateField(
                    'paidBy',
                    event.target.value
                  )
                }
              >
                <option>
                  Employee
                </option>

                <option>
                  Company
                </option>
              </select>
            </label>

            {type ===
              'otherExpenses' && (
              <>
                <label>
                  <span>
                    Head
                  </span>

                  <input
                    value={
                      form.head ||
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        'head',
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Description
                  </span>

                  <input
                    value={
                      form.description ||
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        'description',
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="button secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="button primary"
            onClick={() =>
              onSave(form)
            }
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;