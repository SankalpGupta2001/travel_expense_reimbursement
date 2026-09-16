import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  processExpenses,
} from '../services/expense.api.js';

import {
  getTravelRequest,
} from '../services/travel-request.api.js';

import StatusBadge from '../components/StatusBadge.jsx';
import TravelRequestStepper from '../components/TravelRequestStepper.jsx';


const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Validate Travel Request',
    description: 'Checking request and workflow status.',
  },
  {
    id: 2,
    title: 'Read Documents',
    description: 'Reading uploaded receipts and invoices.',
  },
  {
    id: 3,
    title: 'Extract Expenses',
    description: 'Identifying expense amounts and categories.',
  },
  {
    id: 4,
    title: 'Apply Travel Policy',
    description: 'Checking expenses against company policy.',
  },
  {
    id: 5,
    title: 'Generate Settlement',
    description: 'Preparing the final reimbursement settlement.',
  },
];


export default function ProcessExpense() {

  const {
    travelRequestId,
  } = useParams();


  const {
    state,
  } = useLocation();


  const navigate =
    useNavigate();


  const [
    status,
    setStatus,
  ] = useState(
    'Starting AI processing...'
  );


  const [
    error,
    setError,
  ] = useState('');


  const [
    result,
    setResult,
  ] = useState(null);


  const [
    processing,
    setProcessing,
  ] = useState(true);


  const [
    currentProcessingStep,
    setCurrentProcessingStep,
  ] = useState(1);


  /*
   * Prevent duplicate API requests in React StrictMode.
   */
  const processingStarted =
    useRef(false);


  useEffect(() => {

    if (processingStarted.current) {
      return;
    }


    processingStarted.current = true;


    const runProcessing =
      async () => {

        try {

          setProcessing(true);
          setError('');


          /*
           * STEP 1
           */
          setCurrentProcessingStep(1);

          setStatus(
            'Validating Travel Request...'
          );


          if (!travelRequestId) {

            throw new Error(
              'Travel Request ID is missing.'
            );

          }


          const travelRequest =
            await getTravelRequest(
              travelRequestId
            );


          console.log(
            'Travel Request response:',
            travelRequest
          );


          const currentStatus =
            travelRequest?.workflowStatus ||
            travelRequest?.status ||
            '';


          /*
           * Settlement can be processed when:
           *
           * 1. It is the normal settlement stage.
           * 2. Finance has returned it for correction.
           */
          const settlementAllowed =
            currentStatus === 'Pending Settlement' ||
            currentStatus === 'Returned by Finance';


          if (!settlementAllowed) {

            throw new Error(
              `This request is not ready for AI processing. Current status: ${
                currentStatus || 'Unknown'
              }`
            );

          }


          /*
           * STEP 2
           */
          setCurrentProcessingStep(2);

          setStatus(
            'Reading Expense Documents...'
          );


          const files =
            Array.isArray(state?.files)
              ? state.files
              : [];


          console.log(
            'Files being processed:',
            files
          );


          /*
           * STEP 3
           */
          setCurrentProcessingStep(3);

          setStatus(
            files.length > 0
              ? 'Extracting Expense Details...'
              : 'Preparing Expense Data...'
          );


          /*
           * Call backend.
           */
          const output =
            await processExpenses({
              travelRequestId,
              files,
            });


          console.log(
            'Expense processing response:',
            output
          );


          /*
           * STEP 4
           */
          setCurrentProcessingStep(4);

          setStatus(
            'Applying Travel Policy...'
          );


          /*
           * STEP 5
           */
          setCurrentProcessingStep(5);

          setStatus(
            'Generating Settlement...'
          );


          const settlementResult =
            output?.data ||
            output;


          setResult(
            settlementResult
          );


          /*
           * Processing complete.
           */
          setCurrentProcessingStep(6);

          setStatus(
            'Settlement Generated Successfully'
          );


          setProcessing(false);


          /*
           * Give the user a short visual completion
           * state before moving to Claim Details.
           */
          setTimeout(() => {

            navigate(
              `/claims/${travelRequestId}`,
              {
                replace: true,

                state: {
                  processingCompleted: true,

                  settlement:
                    settlementResult,
                },

              }
            );

          }, 900);


        } catch (
          processingError
        ) {

          console.error(
            'Expense processing failed:',
            processingError
          );


          setError(
            processingError?.message ||
            'Expense processing failed.'
          );


          setStatus(
            'Processing Failed'
          );


          setProcessing(false);

        }

      };


    runProcessing();

  }, [
    travelRequestId,
    navigate,
    state?.files,
  ]);


  /*
   * Error state.
   */
  if (error) {

    return (

      <div className="page">

        <TravelRequestStepper
          currentStep={4}
        />


        <div
          className="card"
          style={{
            maxWidth: '900px',
            margin: '32px auto',
            padding: '40px',
          }}
        >

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff1f0',
              color: '#d92d20',
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '20px',
            }}
          >
            !
          </div>


          <span className="eyebrow">
            STEP 4 OF 6
          </span>


          <h2>
            AI Processing Failed
          </h2>


          <p
            style={{
              color: '#667085',
              marginTop: '8px',
            }}
          >
            We could not complete the expense
            settlement for this Travel Request.
          </p>


          <div
            className="alert error-alert"
            style={{
              marginTop: '24px',
            }}
          >
            {error}
          </div>


          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
              flexWrap: 'wrap',
            }}
          >

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate(
                  `/settlement/${travelRequestId}`
                )
              }
            >
              ← Back to Settlement
            </button>

          </div>

        </div>

      </div>

    );

  }


  /*
   * Processing / completion screen.
   */
  return (

    <div className="page">

      <TravelRequestStepper
        currentStep={4}
      />


      <div
        className="page-header"
        style={{
          marginBottom: '28px',
        }}
      >

        <div>

          <span className="eyebrow">
            STEP 4 OF 6 · AI SETTLEMENT
          </span>


          <h2>
            Preparing Your Settlement
          </h2>


          <p>
            AI is analysing the Travel Request
            and preparing the reimbursement settlement.
          </p>

        </div>

      </div>


      <div
        className="card"
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >

        {/* TOP STATUS */}

        <div
          style={{
            textAlign: 'center',
            padding: '36px 24px 28px',
            borderBottom: '1px solid #edf0f5',
          }}
        >

          <div
            style={{
              width: '76px',
              height: '76px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                processing
                  ? '#eef4ff'
                  : '#ecfdf3',
              color:
                processing
                  ? '#315bea'
                  : '#12b76a',
              fontSize: '30px',
              fontWeight: '700',
            }}
          >

            {processing ? (
              <div
                className="loading-spinner"
                style={{
                  width: '30px',
                  height: '30px',
                }}
              />
            ) : (
              '✓'
            )}

          </div>


          <h2
            style={{
              marginBottom: '8px',
            }}
          >
            {status}
          </h2>


          <p
            style={{
              margin: 0,
              color: '#667085',
            }}
          >

            {processing

              ? 'Please wait while the settlement is being prepared.'

              : 'Your settlement is ready. Redirecting to the claim details...'

            }

          </p>


          <div
            style={{
              marginTop: '18px',
              fontSize: '13px',
              color: '#667085',
            }}
          >

            Travel Request:{' '}

            <strong>
              {travelRequestId}
            </strong>

          </div>

        </div>


        {/* PROGRESS */}

        <div
          style={{
            padding: '28px 32px',
          }}
        >

          {PROCESSING_STEPS.map(
            (step) => {

              const completed =
                currentProcessingStep >
                step.id;


              const active =
                currentProcessingStep ===
                step.id &&
                processing;


              return (

                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom:
                      step.id ===
                      PROCESSING_STEPS.length
                        ? 0
                        : '20px',
                  }}
                >

                  {/* STEP CIRCLE */}

                  <div
                    style={{
                      flexShrink: 0,
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border:
                        completed || active
                          ? 'none'
                          : '1px solid #d9dee8',
                      background:
                        completed
                          ? '#315bea'
                          : active
                            ? '#111827'
                            : '#ffffff',
                      color:
                        completed || active
                          ? '#ffffff'
                          : '#667085',
                      fontWeight: '700',
                    }}
                  >

                    {completed
                      ? '✓'
                      : step.id}

                  </div>


                  {/* STEP CONTENT */}

                  <div
                    style={{
                      flex: 1,
                      paddingTop: '2px',
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >

                      <strong>
                        {step.title}
                      </strong>


                      {active && (

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: '#eef4ff',
                            color: '#315bea',
                          }}
                        >
                          IN PROGRESS
                        </span>

                      )}


                      {completed && (

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: '#ecfdf3',
                            color: '#067647',
                          }}
                        >
                          COMPLETED
                        </span>

                      )}

                    </div>


                    <p
                      style={{
                        margin:
                          '5px 0 0',
                        color: '#667085',
                        fontSize: '13px',
                      }}
                    >
                      {step.description}
                    </p>

                  </div>

                </div>

              );

            }
          )}

        </div>


        {/* BOTTOM INFORMATION */}

        <div
          style={{
            padding: '18px 32px',
            background: '#f8fafc',
            borderTop: '1px solid #edf0f5',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >

          <div>

            <strong>
              {state?.files?.length || 0}
            </strong>

            {' '}

            document(s) submitted

          </div>


          <div
            style={{
              color: '#667085',
              fontSize: '13px',
            }}
          >

            Please do not close this page
            while processing is in progress.

          </div>

        </div>

      </div>

    </div>

  );

}