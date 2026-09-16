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

import ApprovalTimeline
  from '../components/ApprovalTimeline.jsx';

import TravelSummaryCard
  from '../components/TravelSummaryCard.jsx';

import TravelRequestStepper
  from '../components/TravelRequestStepper.jsx';

import StatusBadge
  from '../components/StatusBadge.jsx';


const getWorkflowStatus = (
  request
) => {

  return (
    request?.workflowStatus ||
    request?.status ||
    request?.settlement?.workflowStatus ||
    request?.settlement?.status ||
    request?.settlement?.finalData?.status ||
    ''
  );

};


const getCurrentStep = (
  request
) => {

  const status =
    getWorkflowStatus(request);


  /*
   * --------------------------------------------------
   * FINANCE RETURN
   * --------------------------------------------------
   *
   * Finance returns settlement.
   * Employee goes back to Step 4.
   */
  if (
    status ===
    'Returned by Finance'
  ) {
    return 4;
  }


  /*
   * --------------------------------------------------
   * APPROVAL RETURN
   * --------------------------------------------------
   *
   * Manager / HOD / other approval
   * authority returned the Travel Request.
   *
   * Employee must correct the original
   * Travel Request.
   *
   * Therefore Step 1 is active.
   */
  if (
    status === 'Returned'
  ) {
    return 1;
  }


  /*
   * --------------------------------------------------
   * STEP 6
   * --------------------------------------------------
   */
  if (
    status === 'Paid' ||
    status === 'Payment Pending' ||
    status === 'Recovery Pending' ||
    status === 'Pending Payout' ||
    status === 'Finance Verified' ||
    status === 'Verified' ||
    status === 'Ready for Payout'
  ) {
    return 6;
  }


  /*
   * --------------------------------------------------
   * STEP 5
   * --------------------------------------------------
   */
  if (
    status ===
      'Pending Finance Verification' ||
    status ===
      'Finance Verification' ||
    status ===
      'Ready for Finance'
  ) {
    return 5;
  }


  /*
   * --------------------------------------------------
   * STEP 4
   * --------------------------------------------------
   */
  if (
    status ===
      'Pending Settlement' ||
    status === 'AI Processing'
  ) {
    return 4;
  }


  /*
   * --------------------------------------------------
   * STEP 3
   * --------------------------------------------------
   */
  if (
    status === 'Advance Disbursement' ||
    status === 'Advance Pending'
  ) {
    return 3;
  }


  /*
   * --------------------------------------------------
   * STEP 2
   * --------------------------------------------------
   */
  if (
    status === 'Pending Approval' ||
    status ===
      'Pending Manager Approval' ||
    status === 'Manager Approval' ||
    status === 'HOD Approval' ||
    status ===
      'Pending HOD Approval' ||
    status ===
      'Pending Head of Division Approval' ||
    status ===
      'Pending MD/CEO Approval'
  ) {
    return 2;
  }


  /*
   * --------------------------------------------------
   * STEP 1
   * --------------------------------------------------
   */
  return 1;
};


export default function TravelRequestDetails() {

  const {
    travelRequestId,
  } = useParams();

  const navigate =
    useNavigate();

  const user =
    requireUser();


  const [
    request,
    setRequest,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  useEffect(() => {

    let mounted = true;


    const loadRequest =
      async () => {

        try {

          setLoading(true);
          setError('');


          const response =
            await getTravelRequest(
              travelRequestId
            );


          const data =
            response?.data ||
            response;


          if (mounted) {
            setRequest(data);
          }

        } catch (requestError) {

          console.error(
            'Failed to load travel request:',
            requestError
          );


          if (mounted) {

            setError(
              requestError.message ||
              'Failed to load travel request.'
            );

          }

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


  const status =
    getWorkflowStatus(request);


  const currentStep =
    useMemo(
      () =>
        getCurrentStep(request),
      [request]
    );


  const mine =
    request?.employeeDetails
      ?.employeeCode ===
    user?.employeeCode;


  /*
   * Only these two statuses give the
   * employee a correction action.
   */
  const canCorrectRequest =
    status === 'Returned';


  const canCorrectSettlement =
    status ===
    'Returned by Finance';


  const settlementReady =
    status ===
      'Pending Settlement' ||
    canCorrectSettlement;


  if (loading) {

    return (
      <div className="card">
        Loading Travel Request...
      </div>
    );

  }


  if (error) {

    return (
      <div className="alert error-alert">

        <strong>
          Unable to load Travel Request
        </strong>

        <span>
          {error}
        </span>

      </div>
    );

  }


  if (!request) {

    return (
      <div className="card">
        Travel Request not found.
      </div>
    );

  }


  return (
    <div>

      <TravelRequestStepper
        currentStep={currentStep}
      />


      <div className="page-header">

        <div>

          <span className="eyebrow">
            TRAVEL REQUEST
          </span>

          <h2>
            {request.travelRequestId}
          </h2>

          <p>
            {
              request.travelDetails
                ?.purpose ||
              'Business travel request'
            }
          </p>

        </div>


        <StatusBadge
          status={status}
        />

      </div>


      <TravelSummaryCard
        travelRequest={
          request
        }
      />


      <div className="card">

        <div className="card-header">

          <div>

            <h2>
              Approval Workflow
            </h2>

            <p>
              Approval status based on the
              Nortex approval matrix.
            </p>

          </div>

        </div>


        <ApprovalTimeline
          workflow={
            request.approvalWorkflow ||
            []
          }
        />

      </div>


      {request.returnRemarks && (

        <div className="card">

          <h3>
            Return Remarks
          </h3>

          <p>
            {request.returnRemarks}
          </p>

        </div>

      )}


      {mine &&
        canCorrectRequest && (

          <div
            className="page-actions"
          >

            <button
              type="button"
              className="button primary"
              onClick={() =>
                navigate(
                  `/travel-requests/${request.travelRequestId}/edit`
                )
              }
            >
              Correct Request →
            </button>

          </div>

        )}


      {mine &&
        settlementReady &&
        !canCorrectRequest && (

          <div
            className="page-actions"
          >

            <button
              type="button"
              className="button primary"
              onClick={() =>
                navigate(
                  `/settlement/${request.travelRequestId}`
                )
              }
            >
              {canCorrectSettlement
                ? 'Correct & Resubmit →'
                : 'Continue to Settlement →'}
            </button>

          </div>

        )}


      {mine &&
        status ===
          'Pending Finance Verification' && (

          <div
            className="page-actions"
          >

            <button
              type="button"
              className="button primary"
              onClick={() =>
                navigate(
                  `/claims/${request.travelRequestId}`
                )
              }
            >
              View Settlement →
            </button>

          </div>

        )}

    </div>
  );
}