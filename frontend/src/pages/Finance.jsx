import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getFinanceClaims,
  getFinanceClaim,
  verifyFinanceClaim,
  returnFinanceClaim,
  createPayout,
} from '../services/finance.api.js';

import TravelRequestStepper from '../components/TravelRequestStepper.jsx';


/* =========================================================
   HELPERS
========================================================= */

const getCurrentUser = () => {

  try {

    const storedUser =
      localStorage.getItem(
        'nortexCurrentUser'
      );


    if (!storedUser) {
      return null;
    }


    return JSON.parse(
      storedUser
    );

  } catch (error) {

    console.error(
      'Failed to read current user:',
      error
    );


    return null;

  }

};


const currency = (
  value
) => {

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );

};


const getTravelRequestId = (
  claim
) => {

  return (
    claim?.travelRequestId ||
    claim?.travelDetails?.travelRequestId ||
    claim?.settlement?.travelDetails
      ?.travelRequestId ||
    '—'
  );

};


const getEmployeeName = (
  claim
) => {

  return (
    claim?.employeeDetails?.employeeName ||
    claim?.employeeDetails?.name ||
    claim?.employee?.name ||
    claim?.settlement?.employeeDetails
      ?.employeeName ||
    'Unknown Employee'
  );

};


const getEmployeeCode = (
  claim
) => {

  return (
    claim?.employeeDetails?.employeeCode ||
    claim?.employee?.employeeCode ||
    claim?.settlement?.employeeDetails
      ?.employeeCode ||
    '—'
  );

};


const getEmployeeDesignation = (
  claim
) => {

  return (
    claim?.employeeDetails?.designation ||
    claim?.employee?.designation ||
    claim?.settlement?.employeeDetails
      ?.designation ||
    'Employee'
  );

};


const getEmployeeInitials = (
  claim
) => {

  const name =
    getEmployeeName(
      claim
    );


  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
    )
    .join('')
    .toUpperCase();

};


/* =========================================================
   SETTLEMENT HELPERS
========================================================= */

const getSettlement = (
  claim
) => {

  return (
    claim?.settlement ||
    claim?.claim ||
    claim ||
    {}
  );

};


const getSummary = (
  claim
) => {

  const settlement =
    getSettlement(
      claim
    );


  return (
    settlement?.settlementSummary ||
    {}
  );

};


const getStatus = (claim) => {
  return (
    claim?.workflowStatus ||
    claim?.status ||
    'Unknown'
  );
};

const isPayoutDay = () => {
  const day = new Date().getDate();
  return day === 10 || day === 25;
};

/* =========================================================
   RESPONSE NORMALIZATION
========================================================= */

const normalizeClaim = (
  response,
  fallback = {}
) => {

  const travelRequest =
    response?.data ||
    response ||
    {};


  const settlement =
    travelRequest?.settlement ||
    response?.settlement ||
    response?.claim ||
    fallback?.settlement ||
    fallback ||
    {};


  return {

    ...settlement,


    travelRequestId:
      travelRequest?.travelRequestId ||
      settlement?.travelDetails
        ?.travelRequestId ||
      fallback?.travelRequestId ||
      '',


    workflowStatus:
      travelRequest?.workflowStatus ||
      travelRequest?.status ||
      settlement?.workflowStatus ||
      fallback?.workflowStatus ||
      settlement?.finalData?.status ||
      settlement?.status ||
      '',


    status:
      travelRequest?.status ||
      settlement?.status ||
      fallback?.status ||
      settlement?.finalData?.status ||
      '',


    approvalWorkflow:
      travelRequest?.approvalWorkflow ||
      settlement?.approvalWorkflow ||
      fallback?.approvalWorkflow ||
      [],


    settlementForm:
      travelRequest?.settlementForm ||
      settlement?.settlementForm ||
      fallback?.settlementForm ||
      null,


    finance:
      travelRequest?.finance ||
      settlement?.finance ||
      fallback?.finance ||
      null,


    returnRemarks:
      travelRequest?.returnRemarks ||
      settlement?.returnRemarks ||
      fallback?.returnRemarks ||
      '',

  };

};


/* =========================================================
   STATUS PILL
========================================================= */

const StatusPill = ({
  status,
}) => {

  const normalized =
    String(status || '')
      .toLowerCase();


  let background =
    '#f1f5f9';


  let color =
    '#475569';


  if (
    normalized.includes(
      'pending'
    ) ||
    normalized.includes(
      'verification'
    )
  ) {

    background =
      '#fff7ed';

    color =
      '#c2410c';

  }


  if (
    normalized.includes(
      'approved'
    ) ||
    normalized.includes(
      'verified'
    ) ||
    normalized.includes(
      'paid'
    ) ||
    normalized.includes(
      'payout'
    )
  ) {

    background =
      '#ecfdf5';

    color =
      '#047857';

  }


  if (
    normalized.includes(
      'return'
    )
  ) {

    background =
      '#fef2f2';

    color =
      '#b91c1c';

  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '6px 10px',
        borderRadius: '999px',
        background,
        color,
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >

      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
        }}
      />

      {status}

    </span>
  );

};


/* =========================================================
   AVATAR
========================================================= */

const EmployeeAvatar = ({
  claim,
}) => {

  return (
    <div
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background:
          'linear-gradient(135deg, #dbeafe, #e0e7ff)',
        color: '#3730a3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {
        getEmployeeInitials(
          claim
        )
      }
    </div>
  );

};


/* =========================================================
   FINANCE PAGE
========================================================= */

export default function Finance() {

  const currentUser =
    getCurrentUser();


  const isFinanceUser =
    currentUser?.role === 'Finance' ||
    currentUser?.role === 'Finance Manager' ||
    currentUser?.role === 'Controller';


  const [
    claims,
    setClaims,
  ] = useState([]);


  const [
    selectedClaim,
    setSelectedClaim,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState('');


  /* =======================================================
     LOAD CLAIMS
  ======================================================= */

  const loadClaims =
    useCallback(
      async ({
        showLoader = true,
      } = {}) => {

        try {

          if (showLoader) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }


          setError('');


          const response =
            await getFinanceClaims();


          const rawClaims =
            Array.isArray(response)
              ? response
              : Array.isArray(response?.claims)
                ? response.claims
                : Array.isArray(response?.data)
                  ? response.data
                  : [];


          const normalizedClaims =
            rawClaims.map(
              (claim) =>
                normalizeClaim(
                  claim,
                  claim
                )
            );


          setClaims(
            normalizedClaims
          );

        } catch (
          financeError
        ) {

          console.error(
            'Failed to load finance claims:',
            financeError
          );


          setError(
            financeError?.message ||
            'Failed to load finance claims.'
          );


          setClaims([]);

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      []
    );


  useEffect(() => {

    if (isFinanceUser) {
      loadClaims();
    } else {
      setLoading(false);
    }

  }, [
    isFinanceUser,
    loadClaims,
  ]);


  /* =======================================================
     VISIBILITY REFRESH
  ======================================================= */

  useEffect(() => {

    const handleVisibility =
      () => {

        if (
          document.visibilityState ===
            'visible' &&
          isFinanceUser
        ) {

          loadClaims({
            showLoader: false,
          });

        }

      };


    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );


    return () => {

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

    };

  }, [
    isFinanceUser,
    loadClaims,
  ]);


  /* =======================================================
     FILTERS
  ======================================================= */

  const pendingClaims =
    useMemo(
      () =>
        claims.filter(
          (claim) => {

            const status =
              getStatus(
                claim
              );


            return (
              status ===
                'Pending Finance Verification' ||
              status ===
                'Finance Verification' ||
              status ===
                'Ready for Finance'
            );

          }
        ),
      [claims]
    );


  /*
   * Claims which are ready for payout.
   */
  const payoutClaims =
    useMemo(
      () =>
        claims.filter(
          (claim) => {

            const status =
              getStatus(
                claim
              );


            return (
              status ===
                'Pending Payout' ||
              status ===
                'Finance Verified' ||
              status ===
                'Verified' ||
              status ===
                'Ready for Payout'
            );

          }
        ),
      [claims]
    );


  /*
   * Everything that isn't in the two active queues.
   */
  const processedClaims =
    useMemo(
      () => {

        const activeIds =
          new Set(
            [
              ...pendingClaims,
              ...payoutClaims,
            ].map(
              (claim) =>
                getTravelRequestId(
                  claim
                )
            )
          );


        return claims.filter(
          (claim) =>
            !activeIds.has(
              getTravelRequestId(
                claim
              )
            )
        );

      },
      [
        claims,
        pendingClaims,
        payoutClaims,
      ]
    );


  const pendingValue =
    pendingClaims.reduce(
      (
        total,
        claim
      ) =>
        total +
        Number(
          getSummary(
            claim
          )?.netReimbursableClaim ||
          0
        ),
      0
    );


  const pendingPayable =
    pendingClaims.reduce(
      (
        total,
        claim
      ) =>
        total +
        Number(
          getSummary(
            claim
          )?.amountPayableToEmployee ||
          0
        ),
      0
    );


  const payoutValue =
    payoutClaims.reduce(
      (
        total,
        claim
      ) =>
        total +
        Number(
          getSummary(
            claim
          )?.amountPayableToEmployee ||
          0
        ),
      0
    );


  /* =======================================================
     OPEN CLAIM
  ======================================================= */

  const handleOpenClaim =
    async (
      claim
    ) => {

      try {

        setError('');


        const travelRequestId =
          getTravelRequestId(
            claim
          );


        if (
          !travelRequestId ||
          travelRequestId === '—'
        ) {

          throw new Error(
            'Travel Request ID is missing.'
          );

        }


        const response =
          await getFinanceClaim(
            travelRequestId
          );


        const normalizedClaim =
          normalizeClaim(
            response,
            claim
          );


        setSelectedClaim(
          normalizedClaim
        );

      } catch (
        claimError
      ) {

        console.error(
          'Failed to load claim:',
          claimError
        );


        setError(
          claimError?.message ||
          'Failed to load claim.'
        );

      }

    };


  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose =
    () => {

      if (actionLoading) {
        return;
      }


      setSelectedClaim(
        null
      );

    };


  /* =======================================================
     VERIFY
  ======================================================= */

  const handleVerify =
    async () => {

      if (
        !selectedClaim ||
        !isFinanceUser
      ) {
        return;
      }


      const travelRequestId =
        getTravelRequestId(
          selectedClaim
        );


      try {

        setActionLoading(
          true
        );

        setError('');


        await verifyFinanceClaim(
          travelRequestId,
          currentUser?.employeeCode
        );


        /*
         * Close the verification modal.
         */
        setSelectedClaim(
          null
        );


        /*
         * Reload from backend.
         *
         * The backend should now return:
         *
         * Pending Payout
         *
         * or equivalent verified state.
         */
        await loadClaims({
          showLoader: false,
        });

      } catch (
        verifyError
      ) {

        console.error(
          'Finance verification failed:',
          verifyError
        );


        setError(
          verifyError?.message ||
          'Finance verification failed.'
        );

      } finally {

        setActionLoading(
          false
        );

      }

    };


  /* =======================================================
     RETURN
  ======================================================= */

  const handleReturn =
    async () => {

      if (
        !selectedClaim ||
        !isFinanceUser
      ) {
        return;
      }


      const travelRequestId =
        getTravelRequestId(
          selectedClaim
        );


      const remarks =
        window.prompt(
          'Enter Finance return remarks:',
          'Finance review requires correction.'
        );


      if (
        remarks === null
      ) {
        return;
      }


      if (
        !remarks.trim()
      ) {

        setError(
          'Return remarks are required.'
        );

        return;
      }


      try {

        setActionLoading(
          true
        );

        setError('');


        await returnFinanceClaim(
          travelRequestId,
          currentUser?.employeeCode,
          remarks.trim()
        );


        setSelectedClaim(
          null
        );


        await loadClaims({
          showLoader: false,
        });

      } catch (
        returnError
      ) {

        console.error(
          'Finance return failed:',
          returnError
        );


        setError(
          returnError?.message ||
          'Failed to return claim.'
        );

      } finally {

        setActionLoading(
          false
        );

      }

    };


  /* =======================================================
     PAYOUT
  ======================================================= */

  const handlePayout =
    async (
      claim
    ) => {

      if (
        !isFinanceUser
      ) {
        return;
      }


      const travelRequestId =
        getTravelRequestId(
          claim
        );


      if (
        !travelRequestId ||
        travelRequestId === '—'
      ) {

        setError(
          'Travel Request ID is missing.'
        );

        return;
      }


      try {

        setActionLoading(
          true
        );

        setError('');


        await createPayout(
          travelRequestId,
          currentUser?.employeeCode
        );


        await loadClaims({
          showLoader: false,
        });

      } catch (
        payoutError
      ) {

        console.error(
          'Payout failed:',
          payoutError
        );


        setError(
          payoutError?.message ||
          'Failed to create payout.'
        );

      } finally {

        setActionLoading(
          false
        );

      }

    };


  /* =======================================================
     NON-FINANCE USER
  ======================================================= */

  if (!currentUser) {

    return (
      <div className="card">

        <h3>
          Session not found
        </h3>

        <p>
          Please log in again.
        </p>

      </div>
    );

  }


  if (!isFinanceUser) {

    return (
      <div
        style={{
          maxWidth: '620px',
          margin: '50px auto',
        }}
      >

        <div
          style={{
            background: '#ffffff',
            border:
              '1px solid #e5e7eb',
            borderRadius: '18px',
            padding: '42px',
            textAlign: 'center',
          }}
        >

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              margin:
                '0 auto 18px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            !
          </div>


          <h2>
            Finance Access Required
          </h2>


          <p
            style={{
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            This section is restricted
            to Finance users. You do not
            have permission to verify or
            release employee settlements.
          </p>

        </div>

      </div>
    );

  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding:
          '8px 0 48px',
      }}
    >

      {/* ===================================================
          SIX STEP WORKFLOW
      =================================================== */}

      {/* <TravelRequestStepper
        currentStep={5}
      /> */}


      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent:
            'space-between',
          gap: '24px',
          marginBottom: '28px',
        }}
      >

        <div>

          <span className="eyebrow">
            FINANCE OPERATIONS
          </span>


          <h2
            style={{
              margin:
                '7px 0 5px',
            }}
          >
            Finance Review
          </h2>


          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            Verify AI-processed travel
            settlements before payment
            or employee recovery.
          </p>

        </div>


        <button
          type="button"
          className="button secondary"
          onClick={() =>
            loadClaims({
              showLoader: false,
            })
          }
          disabled={
            refreshing ||
            actionLoading
          }
        >
          {refreshing
            ? 'Refreshing...'
            : '↻ Refresh'}
        </button>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div
          className="alert error-alert"
          style={{
            marginBottom: '22px',
          }}
        >
          {error}
        </div>

      )}


      {/* ===================================================
          METRICS
      =================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >

        <Metric
          label="Pending Verification"
          value={
            pendingClaims.length
          }
          description="Claims awaiting Finance"
        />


        <Metric
          label="Pending Claim Value"
          value={
            currency(
              pendingValue
            )
          }
          description="Net reimbursable amount"
        />


        <Metric
          label="Employee Payable"
          value={
            currency(
              pendingPayable
            )
          }
          description="Amount due after advance"
        />


        <Metric
          label="Pending Payout"
          value={
            payoutClaims.length
          }
          description={
            currency(
              payoutValue
            )
          }
        />

      </div>


      {/* ===================================================
          PENDING VERIFICATION
      =================================================== */}

      <section
        style={{
          background: '#ffffff',
          border:
            '1px solid #e5e7eb',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow:
            '0 1px 3px rgba(15, 23, 42, 0.04)',
          marginBottom: '24px',
        }}
      >

        <div
          style={{
            padding:
              '22px 24px',
            borderBottom:
              '1px solid #eef2f7',
          }}
        >

          <span className="eyebrow">
            REVIEW QUEUE
          </span>


          <h3
            style={{
              margin:
                '6px 0 4px',
            }}
          >
            Pending Finance Verification
          </h3>


          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            Claims that have completed
            employee and approval processing.
          </p>

        </div>


        {loading ? (

          <div
            style={{
              padding: '50px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >

            <div className="loading-spinner" />

            <p>
              Loading finance claims...
            </p>

          </div>

        ) : pendingClaims.length === 0 ? (

          <div
            style={{
              padding: '50px 24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >

            <div
              style={{
                fontSize: '30px',
                marginBottom: '10px',
              }}
            >
              ✓
            </div>


            <strong>
              No claims awaiting verification
            </strong>


            <p>
              Finance has no pending settlements
              at the moment.
            </p>

          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <div
              style={{
                minWidth:
                  '950px',
              }}
            >

              <FinanceTableHeader />


              {pendingClaims.map(
                (
                  claim
                ) => {

                  const summary =
                    getSummary(
                      claim
                    );


                  const travelRequestId =
                    getTravelRequestId(
                      claim
                    );


                  return (
                    <FinanceQueueRow
                      key={
                        travelRequestId
                      }
                      claim={
                        claim
                      }
                      summary={
                        summary
                      }
                      travelRequestId={
                        travelRequestId
                      }
                      onReview={
                        handleOpenClaim
                      }
                      actionLabel="Review"
                    />
                  );

                }
              )}

            </div>

          </div>

        )}

      </section>


      {/* ===================================================
          PAYOUT QUEUE
      =================================================== */}

      <section
        style={{
          background: '#ffffff',
          border:
            '1px solid #e5e7eb',
          borderRadius: '18px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >

        <div
          style={{
            padding:
              '22px 24px',
            borderBottom:
              '1px solid #eef2f7',
          }}
        >

          <span className="eyebrow">
            PAYMENT QUEUE
          </span>


          <h3
            style={{
              margin:
                '6px 0 4px',
            }}
          >
            Pending Payout
          </h3>


          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            Finance-verified settlements waiting
            for payout release. On 10th and 25th of every month we can Process Payment for verified claims.
          </p>

        </div>


        {payoutClaims.length === 0 ? (

          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#94a3b8',
            }}
          >
            No settlements waiting for payout.
          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <div
              style={{
                minWidth:
                  '850px',
              }}
            >

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '2.2fr 1.3fr 1.2fr 1.3fr 130px',
                  gap: '18px',
                  padding:
                    '12px 24px',
                  background:
                    '#f8fafc',
                  borderBottom:
                    '1px solid #eef2f7',
                  color:
                    '#64748b',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.7px',
                }}
              >

                <div>
                  Employee / Request
                </div>

                <div>
                  Payable
                </div>

                <div>
                  Advance
                </div>

                <div>
                  Status
                </div>

                <div>
                  Action
                </div>

              </div>


              {payoutClaims.map(
                (
                  claim
                ) => {

                  const summary =
                    getSummary(
                      claim
                    );


                  const travelRequestId =
                    getTravelRequestId(
                      claim
                    );


                  const payable =
                    Number(
                      summary
                        ?.amountPayableToEmployee ||
                      0
                    );


                  const advance =
                    Number(
                      summary
                        ?.travelAdvance ||
                      claim
                        ?.travelAdvance
                        ?.drawn ||
                      0
                    );


                  const status =
                    getStatus(
                      claim
                    );


                  return (

                    <div
                      key={
                        travelRequestId
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '2.2fr 1.3fr 1.2fr 1.3fr 130px',
                        gap: '18px',
                        alignItems:
                          'center',
                        padding:
                          '17px 24px',
                        borderBottom:
                          '1px solid #eef2f7',
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          gap: '11px',
                          alignItems:
                            'center',
                        }}
                      >

                        <EmployeeAvatar
                          claim={
                            claim
                          }
                        />


                        <div>

                          <strong>
                            {
                              getEmployeeName(
                                claim
                              )
                            }
                          </strong>


                          <span
                            style={{
                              display:
                                'block',
                              marginTop:
                                '4px',
                              color:
                                '#94a3b8',
                              fontSize:
                                '10px',
                            }}
                          >
                            {
                              travelRequestId
                            }
                            {' · '}
                            {
                              getEmployeeCode(
                                claim
                              )
                            }
                          </span>

                        </div>

                      </div>


                      <strong
                        style={{
                          color:
                            '#1d4ed8',
                        }}
                      >
                        {
                          currency(
                            payable
                          )
                        }
                      </strong>


                      <div>
                        {
                          currency(
                            advance
                          )
                        }
                      </div>


                      <StatusPill
                        status={
                          status
                        }
                      />

                      <button
  type="button"
  className="button primary"
  onClick={() =>
    handlePayout(claim)
  }
  disabled={
    actionLoading || !isPayoutDay()
  }
>
  {actionLoading
    ? 'Processing...'
    : 'Release Payout'}
</button>
                    </div>

                  );

                }
              )}

            </div>

          </div>

        )}

      </section>


      {/* ===================================================
          HISTORY
      =================================================== */}

      <section
        style={{
          background: '#ffffff',
          border:
            '1px solid #e5e7eb',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >

        <div
          style={{
            padding:
              '22px 24px',
            borderBottom:
              '1px solid #eef2f7',
          }}
        >

          <span className="eyebrow">
            FINANCE HISTORY
          </span>


          <h3
            style={{
              margin:
                '6px 0 4px',
            }}
          >
            Processed Settlements
          </h3>


          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            Previously verified, returned,
            paid or recovered settlements.
          </p>

        </div>


        {processedClaims.length === 0 ? (

          <div
            style={{
              padding: '42px',
              textAlign: 'center',
              color: '#94a3b8',
            }}
          >
            No processed settlements yet.
          </div>

        ) : (

          <div
            style={{
              overflowX:
                'auto',
            }}
          >

            <div
              style={{
                minWidth:
                  '800px',
              }}
            >

              {processedClaims.map(
                (
                  claim
                ) => {

                  const summary =
                    getSummary(
                      claim
                    );


                  const travelRequestId =
                    getTravelRequestId(
                      claim
                    );


                  const payable =
                    Number(
                      summary
                        ?.amountPayableToEmployee ||
                      0
                    );


                  const recoverable =
                    Number(
                      summary
                        ?.amountRecoverableFromEmployee ||
                      0
                    );


                  const status =
                    getStatus(
                      claim
                    );


                  return (

                    <div
                      key={
                        travelRequestId
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '2.2fr 1.3fr 1.2fr 1.2fr 90px',
                        gap: '18px',
                        alignItems:
                          'center',
                        padding:
                          '17px 24px',
                        borderBottom:
                          '1px solid #eef2f7',
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          gap: '11px',
                          alignItems:
                            'center',
                        }}
                      >

                        <EmployeeAvatar
                          claim={
                            claim
                          }
                        />


                        <div>

                          <strong>
                            {
                              getEmployeeName(
                                claim
                              )
                            }
                          </strong>


                          <span
                            style={{
                              display:
                                'block',
                              marginTop:
                                '4px',
                              color:
                                '#94a3b8',
                              fontSize:
                                '10px',
                            }}
                          >
                            {
                              travelRequestId
                            }
                          </span>

                        </div>

                      </div>


                      <StatusPill
                        status={
                          status
                        }
                      />


                      <div>
                        {
                          currency(
                            payable
                          )
                        }
                      </div>


                      <div>
                        {
                          currency(
                            recoverable
                          )
                        }
                      </div>


                      <button
                        type="button"
                        className="button secondary"
                        onClick={() =>
                          handleOpenClaim(
                            claim
                          )
                        }
                      >
                        View
                      </button>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        )}

      </section>


      {/* ===================================================
          REVIEW MODAL
      =================================================== */}

      {selectedClaim && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background:
              'rgba(15, 23, 42, 0.55)',
            backdropFilter:
              'blur(4px)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: '24px',
          }}
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
                event.currentTarget &&
              !actionLoading
            ) {

              handleClose();

            }

          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              overflowY:
                'auto',
              background:
                '#ffffff',
              borderRadius:
                '20px',
              boxShadow:
                '0 25px 70px rgba(15, 23, 42, 0.28)',
            }}
          >

            {/* HEADER */}

            <div
              style={{
                padding:
                  '24px 26px',
                borderBottom:
                  '1px solid #eef2f7',
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '20px',
              }}
            >

              <div>

                <span className="eyebrow">
                  FINANCE REVIEW
                </span>


                <h3
                  style={{
                    margin:
                      '7px 0 4px',
                  }}
                >
                  {
                    getTravelRequestId(
                      selectedClaim
                    )
                  }
                </h3>


                <p
                  style={{
                    margin: 0,
                    color:
                      '#64748b',
                    fontSize:
                      '12px',
                  }}
                >
                  Review settlement evidence,
                  policy exceptions and final
                  payable amount.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleClose
                }
                disabled={
                  actionLoading
                }
                style={{
                  width: '34px',
                  height: '34px',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: '9px',
                  background:
                    '#ffffff',
                  fontSize: '20px',
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>

            </div>


            <div
              style={{
                padding:
                  '24px 26px',
              }}
            >

              {/* EMPLOYEE */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '12px',
                  padding:
                    '14px',
                  background:
                    '#f8fafc',
                  borderRadius:
                    '12px',
                  marginBottom:
                    '20px',
                }}
              >

                <EmployeeAvatar
                  claim={
                    selectedClaim
                  }
                />


                <div>

                  <strong>
                    {
                      getEmployeeName(
                        selectedClaim
                      )
                    }
                  </strong>


                  <span
                    style={{
                      display:
                        'block',
                      marginTop:
                        '4px',
                      color:
                        '#64748b',
                      fontSize:
                        '11px',
                    }}
                  >
                    {
                      getEmployeeCode(
                        selectedClaim
                      )
                    }
                    {' · '}
                    {
                      getEmployeeDesignation(
                        selectedClaim
                      )
                    }
                  </span>

                </div>


                <div
                  style={{
                    marginLeft:
                      'auto',
                    textAlign:
                      'right',
                  }}
                >

                  <small
                    style={{
                      display:
                        'block',
                      color:
                        '#94a3b8',
                    }}
                  >
                    Status
                  </small>


                  <StatusPill
                    status={
                      getStatus(
                        selectedClaim
                      )
                    }
                  />

                </div>

              </div>


              {/* SIX STEP WORKFLOW */}

<TravelRequestStepper
  currentStep={
    getStatus(selectedClaim) === 'Paid'
      ? 7
      : getStatus(selectedClaim) === 'Pending Payout' ||
        getStatus(selectedClaim) === 'Finance Verified' ||
        getStatus(selectedClaim) === 'Verified' ||
        getStatus(selectedClaim) === 'Ready for Payout'
        ? 6
        : 5
  }
/>

              {/* SUMMARY */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(4, minmax(0, 1fr))',
                  gap: '10px',
                  margin:
                    '20px 0',
                }}
              >

                <SummaryBox
                  label="Employee Claim"
                  value={
                    currency(
                      getSummary(
                        selectedClaim
                      )
                        ?.totalClaimPaidByEmployee
                    )
                  }
                />


                <SummaryBox
                  label="Non-Reimbursable"
                  value={
                    currency(
                      getSummary(
                        selectedClaim
                      )
                        ?.nonReimbursable
                    )
                  }
                />


                <SummaryBox
                  label="Advance"
                  value={
                    currency(
                      selectedClaim
                        ?.travelAdvance
                        ?.drawn ||
                      selectedClaim
                        ?.travelAdvance
                        ?.requested ||
                      getSummary(
                        selectedClaim
                      )
                        ?.travelAdvance
                    )
                  }
                />


                <SummaryBox
                  label="Amount Payable"
                  value={
                    currency(
                      getSummary(
                        selectedClaim
                      )
                        ?.amountPayableToEmployee
                    )
                  }
                  primary
                />

              </div>


              {/* TRAVEL */}

              <div
                style={{
                  marginBottom:
                    '20px',
                }}
              >

                <h4>
                  Travel Information
                </h4>


                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: '10px',
                  }}
                >

                  <InfoBox
                    label="Destination"
                    value={
                      selectedClaim
                        ?.travelDetails
                        ?.destination
                    }
                  />


                  <InfoBox
                    label="Company / Customer"
                    value={
                      selectedClaim
                        ?.travelDetails
                        ?.company
                    }
                  />


                  <InfoBox
                    label="Travel Dates"
                    value={
                      `${selectedClaim?.travelDetails?.fromDate || '—'} → ${selectedClaim?.travelDetails?.toDate || '—'}`
                    }
                  />


                  <InfoBox
                    label="Purpose"
                    value={
                      selectedClaim
                        ?.travelDetails
                        ?.purpose
                    }
                  />

                </div>

              </div>


              {/* LODGING */}

              <ExpenseSection
                title="Lodging"
                items={
                  selectedClaim
                    ?.lodging ||
                  []
                }
              />


              {/* TRANSPORT */}

              <ExpenseSection
                title="Transportation"
                items={
                  selectedClaim
                    ?.transportation ||
                  []
                }
              />


              {/* OTHER */}

              <ExpenseSection
                title="Other Expenses"
                items={
                  selectedClaim
                    ?.otherExpenses ||
                  []
                }
              />


              {/* HUMAN REVIEW */}
{/* 
              {(
                getStatus(
                  selectedClaim
                ) ===
                  'Pending Human Review' ||
                selectedClaim
                  ?.returnRemarks
              ) && (

                <div
                  style={{
                    padding:
                      '14px 16px',
                    borderRadius:
                      '11px',
                    background:
                      '#fff7ed',
                    border:
                      '1px solid #fed7aa',
                    marginBottom:
                      '20px',
                  }}
                >

                  <strong
                    style={{
                      color:
                        '#9a3412',
                      fontSize:
                        '12px',
                    }}
                  >
                    Human review required
                  </strong>


                  <p
                    style={{
                      margin:
                        '6px 0 0',
                      color:
                        '#c2410c',
                      fontSize:
                        '11px',
                      lineHeight:
                        1.5,
                    }}
                  >
                    Verify supporting documents,
                    policy exceptions and approval
                    requirements before completing
                    Finance verification.
                  </p>


                  {selectedClaim
                    ?.returnRemarks && (

                    <p
                      style={{
                        margin:
                          '8px 0 0',
                        color:
                          '#9a3412',
                        fontSize:
                          '11px',
                      }}
                    >
                      <strong>
                        Return remarks:
                      </strong>{' '}
                      {
                        selectedClaim
                          .returnRemarks
                      }
                    </p>

                  )}

                </div>

              )} */}


              {/* ACTIONS */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  paddingTop:
                    '18px',
                  borderTop:
                    '1px solid #eef2f7',
                }}
              >

                <button
                  type="button"
                  className="button secondary"
                  onClick={
                    handleClose
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Close
                </button>


                {(
                  getStatus(
                    selectedClaim
                  ) ===
                    'Pending Finance Verification' ||
                  getStatus(
                    selectedClaim
                  ) ===
                    'Finance Verification' ||
                  getStatus(
                    selectedClaim
                  ) ===
                    'Ready for Finance'
                ) && (

                  <>

                    <button
                      type="button"
                      className="button secondary"
                      onClick={
                        handleReturn
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Return for Correction
                    </button>


                    <button
                      type="button"
                      className="button primary"
                      onClick={
                        handleVerify
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      {actionLoading
                        ? 'Processing...'
                        : '✓ Verify Claim'}
                    </button>

                  </>

                )}


                {(
                  getStatus(
                    selectedClaim
                  ) ===
                    'Pending Payout' ||
                  getStatus(
                    selectedClaim
                  ) ===
                    'Finance Verified' ||
                  getStatus(
                    selectedClaim
                  ) ===
                    'Verified' ||
                  getStatus(
                    selectedClaim
                  ) ===
                    'Ready for Payout'
                ) && (

<button
  type="button"
  className="button primary"
  onClick={() =>
    handlePayout(
      selectedClaim
    )
  }
  disabled={
    actionLoading || !isPayoutDay()
  }
>
  Release Payout
</button>
                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   FINANCE TABLE HEADER
========================================================= */

const FinanceTableHeader = () => {

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          '2.1fr 1.2fr 1.1fr 1.1fr 1.2fr 90px',
        gap: '16px',
        padding:
          '12px 24px',
        background:
          '#f8fafc',
        borderBottom:
          '1px solid #eef2f7',
        color:
          '#64748b',
        fontSize: '10px',
        fontWeight: 800,
        textTransform:
          'uppercase',
        letterSpacing:
          '0.7px',
      }}
    >

      <div>
        Employee / Request
      </div>

      <div>
        Claim
      </div>

      <div>
        Advance
      </div>

      <div>
        Payable
      </div>

      <div>
        Status
      </div>

      <div>
        Action
      </div>

    </div>
  );

};


/* =========================================================
   FINANCE QUEUE ROW
========================================================= */

const FinanceQueueRow = ({
  claim,
  summary,
  travelRequestId,
  onReview,
  actionLabel,
}) => {

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          '2.1fr 1.2fr 1.1fr 1.1fr 1.2fr 90px',
        gap: '16px',
        alignItems:
          'center',
        padding:
          '18px 24px',
        borderBottom:
          '1px solid #eef2f7',
      }}
    >

      <div
        style={{
          display: 'flex',
          gap: '11px',
          alignItems:
            'center',
        }}
      >

        <EmployeeAvatar
          claim={
            claim
          }
        />


        <div>

          <strong
            style={{
              display:
                'block',
              color:
                '#0f172a',
              fontSize:
                '12px',
            }}
          >
            {
              getEmployeeName(
                claim
              )
            }
          </strong>


          <span
            style={{
              display:
                'block',
              marginTop:
                '4px',
              color:
                '#64748b',
              fontSize:
                '10px',
            }}
          >
            {
              travelRequestId
            }
            {' · '}
            {
              getEmployeeCode(
                claim
              )
            }
          </span>


          <span
            style={{
              display:
                'block',
              marginTop:
                '3px',
              color:
                '#94a3b8',
              fontSize:
                '10px',
            }}
          >
            {
              getEmployeeDesignation(
                claim
              )
            }
          </span>

        </div>

      </div>


      <div>

        <strong>
          {
            currency(
              summary
                ?.netReimbursableClaim
            )
          }
        </strong>


        <small
          style={{
            display:
              'block',
            marginTop:
              '3px',
            color:
              '#94a3b8',
            fontSize:
              '10px',
          }}
        >
          Net claim
        </small>

      </div>


      <div>

        <strong>
          {
            currency(
              claim
                ?.travelAdvance
                ?.drawn ||
              claim
                ?.travelAdvance
                ?.requested ||
              summary
                ?.travelAdvance
            )
          }
        </strong>

      </div>


      <div>

        <strong
          style={{
            color:
              '#1d4ed8',
          }}
        >
          {
            currency(
              summary
                ?.amountPayableToEmployee
            )
          }
        </strong>

      </div>


      <div>

        <StatusPill
          status={
            getStatus(
              claim
            )
          }
        />

      </div>


      <button
        type="button"
        className="button secondary"
        onClick={() =>
          onReview(
            claim
          )
        }
      >
        {actionLabel}
      </button>

    </div>
  );

};


/* =========================================================
   SMALL COMPONENTS
========================================================= */

const Metric = ({
  label,
  value,
  description,
}) => {

  return (
    <div
      style={{
        background:
          '#ffffff',
        border:
          '1px solid #e5e7eb',
        borderRadius:
          '15px',
        padding:
          '18px',
      }}
    >

      <span
        style={{
          display:
            'block',
          color:
            '#64748b',
          fontSize:
            '11px',
        }}
      >
        {label}
      </span>


      <strong
        style={{
          display:
            'block',
          marginTop:
            '7px',
          color:
            '#0f172a',
          fontSize:
            '23px',
        }}
      >
        {value}
      </strong>


      <small
        style={{
          display:
            'block',
          marginTop:
            '5px',
          color:
            '#94a3b8',
        }}
      >
        {description}
      </small>

    </div>
  );

};


const SummaryBox = ({
  label,
  value,
  primary = false,
}) => {

  return (
    <div
      style={{
        padding:
          '14px',
        border:
          `1px solid ${
            primary
              ? '#bfdbfe'
              : '#e5e7eb'
          }`,
        borderRadius:
          '11px',
        background:
          primary
            ? '#eff6ff'
            : '#ffffff',
      }}
    >

      <span
        style={{
          display:
            'block',
          color:
            primary
              ? '#2563eb'
              : '#64748b',
          fontSize:
            '10px',
        }}
      >
        {label}
      </span>


      <strong
        style={{
          display:
            'block',
          marginTop:
            '7px',
          color:
            primary
              ? '#1d4ed8'
              : '#0f172a',
          fontSize:
            '16px',
        }}
      >
        {value}
      </strong>

    </div>
  );

};


const InfoBox = ({
  label,
  value,
}) => {

  return (
    <div
      style={{
        padding:
          '13px 15px',
        background:
          '#f8fafc',
        borderRadius:
          '10px',
      }}
    >

      <span
        style={{
          display:
            'block',
          color:
            '#94a3b8',
          fontSize:
            '10px',
          marginBottom:
            '5px',
        }}
      >
        {label}
      </span>


      <strong
        style={{
          color:
            '#334155',
          fontSize:
            '12px',
        }}
      >
        {value || '—'}
      </strong>

    </div>
  );

};


const ExpenseSection = ({
  title,
  items,
}) => {

  return (
    <div
      style={{
        marginBottom:
          '20px',
      }}
    >

      <h4>
        {title}
      </h4>


      {items.length === 0 ? (

        <div
          style={{
            padding:
              '14px',
            background:
              '#f8fafc',
            borderRadius:
              '10px',
            color:
              '#94a3b8',
            fontSize:
              '11px',
          }}
        >
          No expenses recorded.
        </div>

      ) : (

        <div
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius:
              '11px',
            overflow:
              'hidden',
          }}
        >

          {items.map(
            (
              item,
              index
            ) => (

              <div
                key={
                  `${item.proofRef || 'expense'}-${index}`
                }
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1.1fr 2fr 1fr 1fr',
                  gap:
                    '12px',
                  padding:
                    '12px 14px',
                  borderBottom:
                    index ===
                    items.length - 1
                      ? 'none'
                      : '1px solid #eef2f7',
                }}
              >

                <div>

                  <small
                    style={{
                      display:
                        'block',
                      color:
                        '#94a3b8',
                      fontSize:
                        '9px',
                    }}
                  >
                    Date
                  </small>


                  <strong
                    style={{
                      fontSize:
                        '11px',
                    }}
                  >
                    {
                      item.date ||
                      item.checkIn ||
                      '—'
                    }
                  </strong>

                </div>


                <div>

                  <small
                    style={{
                      display:
                        'block',
                      color:
                        '#94a3b8',
                      fontSize:
                        '9px',
                    }}
                  >
                    Description
                  </small>


                  <strong
                    style={{
                      fontSize:
                        '11px',
                    }}
                  >
                    {
                      item.description ||
                      item.mode ||
                      item.hotelName ||
                      item.head ||
                      'Expense'
                    }
                  </strong>

                </div>


                <div>

                  <small
                    style={{
                      display:
                        'block',
                      color:
                        '#94a3b8',
                      fontSize:
                        '9px',
                    }}
                  >
                    Paid By
                  </small>


                  <strong
                    style={{
                      fontSize:
                        '11px',
                    }}
                  >
                    {
                      item.paidBy ||
                      '—'
                    }
                  </strong>

                </div>


                <div>

                  <small
                    style={{
                      display:
                        'block',
                      color:
                        '#94a3b8',
                      fontSize:
                        '9px',
                    }}
                  >
                    Amount
                  </small>


                  <strong
                    style={{
                      fontSize:
                        '11px',
                    }}
                  >
                    {
                      currency(
                        item.amount
                      )
                    }
                  </strong>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );

};
