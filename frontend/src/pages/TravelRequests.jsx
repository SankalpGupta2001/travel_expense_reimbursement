import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  getMyTravelRequests,
} from '../services/travel-request.api.js';

import {
  requireUser,
} from '../services/auth.api.js';

import StatusBadge from '../components/StatusBadge.jsx';


/* =========================================================
   HELPERS
   ========================================================= */

const getEffectiveStatus = (request) => {

  return (
    request?.workflowStatus ||
    request?.status ||
    request?.finance?.status ||
    'Unknown'
  );

};

const getRequestRoute = (
  request
) => {

  const status =
    getEffectiveStatus(
      request
    );


  const travelRequestId =
    request?.travelRequestId;


  if (!travelRequestId) {
    return '/travel-requests';
  }


  /*
   * Normal settlement.
   */
  if (
    status === 'Pending Settlement'
  ) {
    return `/settlement/${travelRequestId}`;
  }


  /*
   * Finance returned settlement.
   */
  if (
    status === 'Returned by Finance'
  ) {
    return `/settlement/${travelRequestId}`;
  }


  /*
   * Manager / HOD returned Travel Request.
   */
  if (
    status === 'Returned'
  ) {
    return `/travel-requests/${travelRequestId}/edit`;
  }


  /*
   * Claim / Finance / Payout stages.
   */
  if (
    status ===
      'Pending Finance Verification' ||
    status ===
      'Finance Verification' ||
    status ===
      'Ready for Finance' ||
    status ===
      'Pending Payout' ||
    status ===
      'Finance Verified' ||
    status ===
      'Verified' ||
    status ===
      'Ready for Payout' ||
    status === 'Paid'
  ) {
    return `/claims/${travelRequestId}`;
  }


  return `/travel-requests/${travelRequestId}`;
};

const getActionLabel = (
  request
) => {

  const status =
    getEffectiveStatus(
      request
    );


  if (
    status === 'Pending Settlement'
  ) {
    return 'Submit Expenses';
  }


  if (
    status === 'Returned by Finance'
  ) {
    return 'Correct Settlement';
  }


  if (
    status === 'Returned'
  ) {
    return 'Correct Request';
  }


  if (
    status ===
      'Pending Finance Verification' ||
    status ===
      'Finance Verification' ||
    status ===
      'Ready for Finance' ||
    status ===
      'Pending Payout' ||
    status ===
      'Finance Verified' ||
    status ===
      'Verified' ||
    status ===
      'Ready for Payout'
  ) {
    return 'View Claim';
  }


  if (status === 'Paid') {
    return 'View Details';
  }


  return 'View Request';
};

const isPrimaryAction = (request) => {

  const status =
    getEffectiveStatus(request);

  return (
    status === 'Pending Settlement' ||
    status === 'Returned' ||
    status === 'Returned by Finance' ||
    status ===
      'Pending Finance Verification' ||
    status ===
      'Finance Verification' ||
    status ===
      'Ready for Finance' ||
    status ===
      'Pending Payout' ||
    status ===
      'Finance Verified' ||
    status ===
      'Verified' ||
    status ===
      'Ready for Payout' ||
    status === 'Paid'
  );
};


const formatDate = (
  value
) => {

  if (!value) {
    return '—';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );

};


/* =========================================================
   COMPONENT
   ========================================================= */

export default function TravelRequests() {

  const user =
    requireUser();


  const navigate =
    useNavigate();


  const [
    rows,
    setRows,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  /* =========================================================
     LOAD
     ========================================================= */

  const loadRequests =
    useCallback(async () => {

      try {

        setLoading(true);
        setError('');


        const response =
          await getMyTravelRequests(
            user.employeeCode
          );


        const data =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];


        setRows(
          data
        );

      } catch (requestError) {

        console.error(
          'Failed to load travel requests:',
          requestError
        );


        setError(
          requestError.message ||
          'Failed to load travel requests.'
        );


        setRows([]);

      } finally {

        setLoading(false);

      }

    }, [
      user.employeeCode,
    ]);


  useEffect(() => {

    loadRequests();

  }, [
    loadRequests,
  ]);


  /* =========================================================
     OPEN REQUEST
     ========================================================= */

  const handleRequestClick =
    (
      request
    ) => {

      navigate(
        getRequestRoute(
          request
        )
      );

    };


  return (
    <div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            TRAVEL REQUESTS
          </span>

          <h2>
            My Travel Requests
          </h2>

          <p>
            Track requests from creation
            through payout.
          </p>

        </div>


        <button
          type="button"
          className="button primary"
          onClick={() =>
            navigate(
              '/travel-requests/new'
            )
          }
        >
          + New Request
        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="alert error-alert">
          {error}
        </div>

      )}


      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="card">

        {loading ? (

          <div className="page-loading">

            <div className="loading-spinner" />

            <span>
              Loading travel requests...
            </span>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    TR ID
                  </th>

                  <th>
                    Destination
                  </th>

                  <th>
                    Travel Dates
                  </th>

                  <th>
                    Estimated
                  </th>

                  <th>
                    Current Stage
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {rows.map(
                  (request) => {

                    const status =
                      getEffectiveStatus(
                        request
                      );


                    const actionLabel =
                      getActionLabel(
                        request
                      );


                    const primary =
                      isPrimaryAction(
                        request
                      );


                    return (

                      <tr
                        key={
                          request.travelRequestId
                        }
                        className="dashboard-request-row"
                        onClick={() =>
                          handleRequestClick(
                            request
                          )
                        }
                      >

                        {/* TR ID */}

                        <td>

                          <strong>
                            {
                              request.travelRequestId
                            }
                          </strong>

                        </td>


                        {/* DESTINATION */}

                        <td>

                          <div className="dashboard-destination">

                            <strong>
                              {
                                request
                                  .travelDetails
                                  ?.destination ||
                                '—'
                              }
                            </strong>
                            /
                            <span>
                              {
                                request
                                  .travelDetails
                                  ?.company ||
                                'Business travel'
                              }
                            </span>

                          </div>

                        </td>


                        {/* DATES */}

                        <td>

                          <span>

                            {formatDate(
                              request
                                .travelDetails
                                ?.fromDate
                            )}

                            {' → '}

                            {formatDate(
                              request
                                .travelDetails
                                ?.toDate
                            )}

                          </span>

                        </td>


                        {/* ESTIMATED */}

                        <td>

                          <strong>
                            ₹
                            {Number(
                              request
                                .estimatedCost
                                ?.total ||
                              0
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </strong>

                        </td>


                        {/* STATUS */}

                        <td>

                          <StatusBadge
                            status={
                              status
                            }
                          />

                        </td>


                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className={
                              primary
                                ? 'button primary dashboard-action-button'
                                : 'button secondary dashboard-action-button'
                            }
                            onClick={(event) => {

                              event.stopPropagation();

                              handleRequestClick(
                                request
                              );

                            }}
                          >

                            {actionLabel}

                            <span>
                              →
                            </span>

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}


                {!rows.length && (

                  <tr>

                    <td
                      colSpan="6"
                      style={{
                        textAlign:
                          'center',
                        padding:
                          '40px',
                      }}
                    >

                      No travel requests yet.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}