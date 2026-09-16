import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getTravelRequest,
} from '../services/travel-request.api.js';

import {
  requireUser,
} from '../services/auth.api.js';

import DocumentUpload from '../components/DocumentUpload.jsx';

import SelectedDocumentList from '../components/SelectedDocumentList.jsx';

import SettlementStepIndicator from '../components/SettlementStepIndicator.jsx';


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString(
    'en-IN',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};


const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

const getSettlementDeadline = (returnDate) => {
  if (!returnDate) {
    return null;
  }

  const date = new Date(`${returnDate}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + 7);

  return date;
};

/*
|--------------------------------------------------------------------------
| Trip Settlement
|--------------------------------------------------------------------------
*/

export default function TripSettlement() {

  const {
    travelRequestId,
  } = useParams();


  const navigate =
    useNavigate();


  const user =
    requireUser();


  const [
    travelRequest,
    setTravelRequest,
  ] = useState(null);


  const [
    files,
    setFiles,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  /*
  |--------------------------------------------------------------------------
  | Load Travel Request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let mounted = true;


    const loadRequest = async () => {

      try {

        setLoading(true);
        setError('');


        const response =
          await getTravelRequest(
            travelRequestId
          );


        if (!mounted) {
          return;
        }


        setTravelRequest(
          response
        );

      } catch (requestError) {

        if (!mounted) {
          return;
        }


        console.error(
          'Failed to load Travel Request:',
          requestError
        );


        setError(
          requestError.message ||
          'Failed to load Travel Request.'
        );

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadRequest();


    return () => {
      mounted = false;
    };

  }, [
    travelRequestId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Finance Return Remarks
  |--------------------------------------------------------------------------
  |
  | Finance remarks are stored by the backend when Finance
  | returns the claim.
  |
  | Prefer returnRemarks and fall back to finance.remarks
  | for compatibility with existing Travel Request data.
  |--------------------------------------------------------------------------
  */

  const financeRemarks =
    travelRequest?.returnRemarks ||
    travelRequest?.finance?.remarks ||
    '';


  const isReturnedByFinance =
    travelRequest?.workflowStatus ===
    'Returned by Finance';


  /*
  |--------------------------------------------------------------------------
  | Add Documents
  |--------------------------------------------------------------------------
  */

  const handleFilesSelected = (
    selectedFiles
  ) => {

    setFiles((previous) => {

      const existingKeys =
        new Set(
          previous.map(
            (file) =>
              `${file.name}-${file.size}-${file.lastModified}`
          )
        );


      const newFiles =
        selectedFiles.filter(
          (file) =>
            !existingKeys.has(
              `${file.name}-${file.size}-${file.lastModified}`
            )
        );


      return [
        ...previous,
        ...newFiles,
      ];

    });

  };


  /*
  |--------------------------------------------------------------------------
  | Remove Document
  |--------------------------------------------------------------------------
  */

  const handleRemoveFile = (
    index
  ) => {

    setFiles((previous) =>
      previous.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Employee Validation
  |--------------------------------------------------------------------------
  */

  const isOwner =
    travelRequest?.employeeDetails
      ?.employeeCode ===
    user?.employeeCode;


  /*
  |--------------------------------------------------------------------------
  | Request Information
  |--------------------------------------------------------------------------
  */

  const destination =
    travelRequest?.travelDetails
      ?.destination ||
    '—';


  const company =
    travelRequest?.travelDetails
      ?.company ||
    '—';


  const fromDate =
    travelRequest?.travelDetails
      ?.fromDate;


  const toDate =
    travelRequest?.travelDetails
      ?.toDate;

  const settlementDeadline =
  getSettlementDeadline(toDate);

const settlementWithin7Days =
  settlementDeadline
    ? new Date() <= settlementDeadline
    : true;


  const numberOfDays =
    travelRequest?.travelDetails
      ?.numberOfDays ||
    0;


  const purpose =
    travelRequest?.travelDetails
      ?.purpose ||
    'Business travel';


  const estimatedTotal =
    travelRequest?.estimatedCost
      ?.total ||
    0;


  const advanceRequested =
    travelRequest?.travelAdvance
      ?.requested ||
    0;


  /*
  |--------------------------------------------------------------------------
  | File Summary
  |--------------------------------------------------------------------------
  */

  const fileSummary = useMemo(() => {

    if (!files.length) {

      return {
        count: 0,
        size: 0,
      };

    }


    return files.reduce(
      (summary, file) => ({

        count:
          summary.count + 1,

        size:
          summary.size +
          (file.size || 0),

      }),
      {
        count: 0,
        size: 0,
      }
    );

  }, [
    files,
  ]);


  const formatSize = (bytes) => {

    if (!bytes) {
      return '0 KB';
    }


    if (
      bytes <
      1024 * 1024
    ) {

      return `${Math.round(
        bytes / 1024
      )} KB`;

    }


    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;

  };


  /*
  |--------------------------------------------------------------------------
  | Continue To AI
  |--------------------------------------------------------------------------
  |
  | Finance remarks are NOT passed from the frontend.
  |
  | The backend already has the Travel Request and therefore
  | can safely read the persisted Finance remarks.
  |--------------------------------------------------------------------------
  */

  const handleContinue = () => {

    setError('');

  if (!settlementWithin7Days) {
    alert(
  `Settlement Policy Validation\n\n` +
  `Your trip settlement is outside the allowed submission period.\n\n` +
  `Return Date:        ${formatDate(toDate)}\n` +
  `Settlement Deadline: ${formatDate(settlementDeadline)}\n\n` +
  `Policy: Settlements must be submitted within 7 calendar days ` +
  `of the employee's return date.\n\n` +
  `Demo Mode: Processing will continue for demonstration purposes. ` +
  `In production, this submission would be blocked.`
);
}


    navigate(
      `/process/${travelRequestId}`,
      {
        state: {
          files,
        },
      }
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <div className="settlement-page">

        <div className="settlement-loading">

          <div className="loading-spinner" />

          <div>

            <strong>
              Loading settlement
            </strong>

            <span>
              Fetching Travel Request details...
            </span>

          </div>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Error / Not Found
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    !travelRequest
  ) {

    return (

      <div className="settlement-page">

        <div className="settlement-error-card">

          <div className="settlement-error-icon">
            !
          </div>

          <div>

            <h3>
              Unable to load settlement
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate(
                  '/travel-requests'
                )
              }
            >
              Back to Travel Requests
            </button>

          </div>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | User Ownership
  |--------------------------------------------------------------------------
  */

  if (!isOwner) {

    return (

      <div className="settlement-page">

        <div className="settlement-error-card">

          <div className="settlement-error-icon">
            !
          </div>

          <div>

            <h3>
              Access restricted
            </h3>

            <p>
              This Travel Request does not
              belong to the current employee.
            </p>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate(
                  '/travel-requests'
                )
              }
            >
              Back to Travel Requests
            </button>

          </div>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Workflow Guard
  |--------------------------------------------------------------------------
  */

  if (
    travelRequest.workflowStatus !== 'Pending Settlement' &&
    travelRequest.workflowStatus !== 'Returned by Finance'
  ) {

    return (

      <div className="settlement-page">

        <SettlementStepIndicator
          currentStep={4}
        />

        <div className="page-header">

          <div>

            <span className="eyebrow">
              STEP 4 OF 6
            </span>

            <h2>
              Trip Settlement
            </h2>

            <p>
              This request is not currently
              available for settlement.
            </p>

          </div>

        </div>

        <div className="settlement-status-card">

          <div className="settlement-status-icon">
            ⓘ
          </div>

          <div>

            <h3>
              Settlement is not available yet
            </h3>

            <p>
              The current workflow status is:
            </p>

            <strong>
              {travelRequest.workflowStatus}
            </strong>

          </div>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Main UI
  |--------------------------------------------------------------------------
  */

  return (

    <div className="settlement-page">

      {/* WORKFLOW */}

      <SettlementStepIndicator
        currentStep={4}
      />


      {/* PAGE HEADER */}

      <div className="page-header settlement-page-header">

        <div>

          <span className="eyebrow">
            STEP 4 OF 6
          </span>

          <h2>
            Trip Settlement
          </h2>

          <p>
            {isReturnedByFinance
              ? 'Correct the returned settlement and resubmit it for AI processing.'
              : 'Submit supporting documents for AI-powered expense processing.'}
          </p>

        </div>


        <div className="settlement-request-id">

          <span>
            TRAVEL REQUEST
          </span>

          <strong>
            {travelRequestId}
          </strong>

        </div>

      </div>


      {/* FINANCE RETURN REMARKS */}

      {isReturnedByFinance && financeRemarks && (

        <section
          className="settlement-summary-card"
          style={{
            marginBottom: '20px',
            border: '1px solid #f0c36d',
            background: '#fffaf0',
          }}
        >

          <div className="settlement-summary-header">

            <div>

              <span className="eyebrow">
                FINANCE CORRECTION REQUIRED
              </span>

              <h3>
                Finance returned this settlement
              </h3>

              <p>
                Please review the remarks below. The same remarks
                will be provided to AI during reprocessing.
              </p>

            </div>

            <span className="settlement-ready-badge">
              Returned by Finance
            </span>

          </div>


          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #ead8ad',
            }}
          >

            <strong>
              Finance Remarks
            </strong>

            <p
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {financeRemarks}
            </p>

          </div>

        </section>

      )}


      {/* TRAVEL SUMMARY */}

      <section className="settlement-summary-card">

        <div className="settlement-summary-header">

          <div>

            <span className="eyebrow">
              TRIP SUMMARY
            </span>

            <h3>
              {destination}
            </h3>

            <p>
              {purpose}
            </p>

          </div>

          <span className="settlement-ready-badge">

            {isReturnedByFinance
              ? 'Correction Required'
              : 'Ready for Settlement'}

          </span>

        </div>


        <div className="settlement-summary-grid">

          <div className="settlement-summary-item">

            <span>
              Employee
            </span>

            <strong>
              {
                travelRequest
                  .employeeDetails
                  ?.employeeName ||
                '—'
              }
            </strong>

            <small>
              {
                travelRequest
                  .employeeDetails
                  ?.employeeCode ||
                '—'
              }
            </small>

          </div>


          <div className="settlement-summary-item">

            <span>
              Travel Dates
            </span>

            <strong>
              {formatDate(fromDate)}
              {' — '}
              {formatDate(toDate)}
            </strong>

            <small>
              {numberOfDays} days
            </small>

          </div>


          <div className="settlement-summary-item">

            <span>
              Customer / Company
            </span>

            <strong>
              {company}
            </strong>

            <small>
              {destination}
            </small>

          </div>


          <div className="settlement-summary-item">

            <span>
              Estimated Cost
            </span>

            <strong>
              ₹{formatCurrency(
                estimatedTotal
              )}
            </strong>

            <small>
              Travel Request estimate
            </small>

          </div>


          <div className="settlement-summary-item">

            <span>
              Advance Received
            </span>

            <strong>
              ₹{formatCurrency(
                advanceRequested
              )}
            </strong>

            <small>
              Will be adjusted during settlement
            </small>

          </div>

        </div>

      </section>


      {/* DOCUMENT AREA */}

      <section className="settlement-document-section">

        <div className="settlement-section-header">

          <div className="settlement-section-number">
            01
          </div>

          <div>

            <h3>
              Supporting Documents
            </h3>

            <p>
              Upload receipts, invoices, tickets,
              hotel bills and other supporting
              documents for this trip.
            </p>

          </div>

        </div>


        <div className="settlement-upload-card">

          <DocumentUpload
            files={files}
            onFilesSelected={
              handleFilesSelected
            }
          />


          {/* OPTIONAL NOTICE */}

          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f7f9fc',
              border: '1px solid #e4e8ef',
              fontSize: '13px',
              color: '#596579',
            }}
          >

            <strong>
              Documents are optional.
            </strong>

            {' '}

            You can continue with AI processing
            even if you do not have any files
            to upload.

          </div>

        </div>


        {/* SELECTED DOCUMENTS */}

        {files.length > 0 && (

          <div className="settlement-files-card">

            <div className="settlement-files-header">

              <div>

                <h4>
                  Selected Documents
                </h4>

                <p>
                  These files will be sent to
                  the expense processing service.
                </p>

              </div>

              <div className="settlement-files-count">

                <strong>
                  {fileSummary.count}
                </strong>

                <span>
                  {fileSummary.count === 1
                    ? 'document'
                    : 'documents'}
                </span>

              </div>

            </div>


            <SelectedDocumentList
              files={files}
              onRemove={
                handleRemoveFile
              }
            />


            <div className="settlement-files-footer">

              <div className="settlement-file-ready">

                <div className="settlement-check">
                  ✓
                </div>

                <div>

                  <strong>
                    Documents ready
                  </strong>

                  <span>
                    {fileSummary.count}{' '}
                    {fileSummary.count === 1
                      ? 'file'
                      : 'files'}
                    {' · '}
                    {formatSize(
                      fileSummary.size
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="alert error-alert settlement-error">

            <div>

              <strong>
                Unable to continue
              </strong>

              <span>
                {error}
              </span>

            </div>

          </div>

        )}

      </section>


      {/* PROCESSING INFORMATION */}

      <section className="settlement-next-step">

        <div className="settlement-next-icon">
          ✦
        </div>

        <div>

          <span className="eyebrow">
            NEXT STEP
          </span>

          <h3>
            - AI Expense Processing
          </h3>

          <p>
            {isReturnedByFinance
              ? 'AI will reprocess the settlement using Finance remarks and focus on correcting the returned issues.'
              : 'The system will extract expenses, detect duplicates, validate policy rules and prepare the settlement for Finance review. Uploaded documents are optional.'}
          </p>

          <br />

          <h3>
            - Verification
          </h3>

          <p>
  The system will verify your travel request against relevant company
  emails and company policy.
</p>

<div className="ai-checking">
  <p>Checking:</p>
  <div>✓ Employee and trip details</div>
  <div>✓ Destination and travel dates</div>
  <div>✓ Travel purpose and category</div>
  <div>✓ Estimated spend and advance</div>
  <div>✓ Supporting email evidence</div>
</div>

<p>
  If any submitted details differ from the verified email information,
  the verified information will be used.
</p>

        </div>

      </section>


      {/* FOOTER */}

      <div className="settlement-footer">

        <div className="settlement-footer-info">

          <span>
            Current workflow
          </span>

          <strong>
            {isReturnedByFinance
              ? 'Correction Required'
              : 'Trip Settlement'}
          </strong>

          <small>
            Please submit the trip settlement in next 7 day after returning from the trip. Otherwise we will not allow to submit details.
          </small>

        </div>


        <div className="settlement-footer-actions">

          <button
            type="button"
            className="button primary settlement-continue-button"
            onClick={
              handleContinue
            }
          >

            {isReturnedByFinance
              ? 'Correct & Process with AI'
              : files.length > 0
                ? 'Submit & Process with AI'
                : 'Process with AI'}

            <span>
              →
            </span>

          </button>

        </div>

      </div>

    </div>

  );

}