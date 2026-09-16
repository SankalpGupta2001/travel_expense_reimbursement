import {
  useState,
} from 'react';

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
  ).format(Number(amount) || 0);

const ExpenseTable = ({
  title,
  expenses = [],
  type,
  editable = false,
  onEdit,
  onExclude,
}) => {
  const [
    expanded,
    setExpanded,
  ] = useState(true);

  return (
    <section className="data-section">
      <div
        className="section-heading clickable"
        onClick={() =>
          setExpanded(!expanded)
        }
      >
        <div>
          <h3>{title}</h3>

          <p>
            {expenses.length} expense
            {expenses.length !== 1
              ? 's'
              : ''}
          </p>
        </div>

        <span>
          {expanded ? '⌃' : '⌄'}
        </span>
      </div>

      {expanded && (
        <div className="table-wrapper">
          {expenses.length === 0 ? (
            <div className="empty-state small">
              No expenses available.
            </div>
          ) : type === 'lodging' ? (
            <table>
              <thead>
                <tr>
                  <th>
                    Stay
                  </th>
                  <th>
                    Hotel
                  </th>
                  <th>
                    City
                  </th>
                  <th>
                    Paid By
                  </th>
                  <th>
                    Amount
                  </th>
                  <th>
                    Proof
                  </th>
                  {editable && (
                    <th>
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (item, index) => (
                    <tr
                      key={`${item.proofRef}-${index}`}
                    >
                      <td>
                        <strong>
                          {item.checkIn}
                        </strong>

                        <span className="table-subtext">
                          to{' '}
                          {item.checkOut}
                        </span>
                      </td>

                      <td>
                        {item.hotelName}
                      </td>

                      <td>
                        {item.city}
                      </td>

                      <td>
                        <span
                          className={
                            item.paidBy ===
                            'Employee'
                              ? 'paid-employee'
                              : 'paid-company'
                          }
                        >
                          {item.paidBy}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {currency(
                            item.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="proof-ref">
                          {item.proofRef}
                        </span>
                      </td>

                      {editable && (
                        <td>
                          <button
                            className="table-action"
                            onClick={() =>
                              onEdit(
                                type,
                                index
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : type ===
            'transportation' ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Mode</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                  <th>Proof</th>
                  {editable && (
                    <th>
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (item, index) => (
                    <tr
                      key={`${item.proofRef}-${index}`}
                    >
                      <td>
                        {item.date}
                        <span className="table-subtext">
                          {item.time}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {item.from}
                        </strong>

                        <span className="table-subtext">
                          → {item.to}
                        </span>
                      </td>

                      <td>
                        {item.mode}
                      </td>

                      <td>
                        <span
                          className={
                            item.paidBy ===
                            'Employee'
                              ? 'paid-employee'
                              : 'paid-company'
                          }
                        >
                          {item.paidBy}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {currency(
                            item.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="proof-ref">
                          {item.proofRef}
                        </span>
                      </td>

                      {editable && (
                        <td>
                          <button
                            className="table-action"
                            onClick={() =>
                              onEdit(
                                type,
                                index
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                  <th>Proof</th>
                  <th>Status</th>
                  {editable && (
                    <th>
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (item, index) => (
                    <tr
                      key={`${item.proofRef}-${index}`}
                    >
                      <td>
                        {item.date}
                      </td>

                      <td>
                        <strong>
                          {item.head}
                        </strong>

                        <span className="table-subtext">
                          {
                            item.description
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            item.paidBy ===
                            'Employee'
                              ? 'paid-employee'
                              : 'paid-company'
                          }
                        >
                          {item.paidBy}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {currency(
                            item.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="proof-ref">
                          {item.proofRef}
                        </span>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            item.status ||
                            'Eligible'
                          }
                        />
                      </td>

                      {editable && (
                        <td>
                          <div className="action-group">
                            <button
                              className="table-action"
                              onClick={() =>
                                onEdit(
                                  item,
                                  index
                                )
                              }
                            >
                              Edit
                            </button>

                            {/* <button
                              className="table-action danger-action"
                              onClick={() =>
                                onExclude(
                                  type,
                                  index
                                )
                              }
                            >
                              Exclude
                            </button> */}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
};

export default ExpenseTable;