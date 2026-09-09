import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  processExpensePack,
} from '../services/expense.api.js';

import {
  upsertClaim,
} from '../services/workflow.js';

const ProcessExpense = () => {
  const navigate =
    useNavigate();

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const handleProcess =
    async () => {
      try {
        setProcessing(true);
        setError('');
        setCompleted(false);

        const response =
          await processExpensePack();

        if (!response.success) {
          throw new Error(
            'Expense processing failed'
          );
        }

        const claim =
          response.data;

        upsertClaim({
          ...claim,
          status: 'Draft',
          approvalWorkflow: [],
          settlementForm:
            response.settlementForm,
          sourceSummary:
            response.sourceSummary,
        });

        setCompleted(true);

        setTimeout(() => {
          navigate(
            `/claims/${claim.travelDetails.travelRequestId}`
          );
        }, 800);
      } catch (err) {
        setError(
          err.message ||
            'Unable to process expense pack.'
        );
      } finally {
        setProcessing(false);
      }
    };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            AUTOMATED PROCESSING
          </span>

          <h2>
            Process Travel Expense
          </h2>

          <p>
            Convert emails, receipts,
            and employee master data
            into a settlement claim.
          </p>
        </div>
      </div>

      <div className="process-container">
        <section className="process-card">
          <div className="process-hero">
            <div className="process-icon">
              ✦
            </div>

            <h3>
              AI Expense Processing
            </h3>

            <p>
              The application will
              process the provided
              expense pack and
              automatically generate
              the Travel Expense
              Settlement.
            </p>
          </div>

          <div className="process-steps">
            <div className="process-step">
              <span>1</span>

              <div>
                <strong>
                  Read Emails
                </strong>

                <small>
                  Travel approval,
                  advance, booking and
                  receipt emails
                </small>
              </div>
            </div>

            <div className="process-step">
              <span>2</span>

              <div>
                <strong>
                  Process Receipts
                </strong>

                <small>
                  OCR receipt images
                  and extract expense
                  details
                </small>
              </div>
            </div>

            <div className="process-step">
              <span>3</span>

              <div>
                <strong>
                  Apply Policy
                </strong>

                <small>
                  Detect duplicates,
                  exclusions, proofs
                  and approvals
                </small>
              </div>
            </div>

            <div className="process-step">
              <span>4</span>

              <div>
                <strong>
                  Generate Settlement
                </strong>

                <small>
                  Create structured JSON
                  and completed Excel
                  form
                </small>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert error-alert">
              {error}
            </div>
          )}

          {completed && (
            <div className="alert success-alert">
              ✓ Expense processed
              successfully. Opening
              claim...
            </div>
          )}

          <button
            className="button primary process-button"
            onClick={
              handleProcess
            }
            disabled={processing}
          >
            {processing
              ? 'Processing Expense Pack...'
              : 'Start Processing'}
          </button>
        </section>

        <section className="process-side-card">
          <h3>
            What happens next?
          </h3>

          <div className="next-flow">
            <div>
              <span>✓</span>
              AI extracts claim
            </div>

            <div>
              <span>✓</span>
              Employee reviews claim
            </div>

            <div>
              <span>→</span>
              Employee submits
              for approval
            </div>

            <div>
              <span>→</span>
              Approval chain
            </div>

            <div>
              <span>→</span>
              Finance verification
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProcessExpense;