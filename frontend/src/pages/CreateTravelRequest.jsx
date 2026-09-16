import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import TravelRequestStepper
  from '../components/TravelRequestStepper.jsx';

import FormSection
  from '../components/FormSection.jsx';

import {
  createTravelRequest,
  getTravelRequest,
  resubmitTravelRequest,
} from '../services/travel-request.api.js';

import {
  requireUser,
} from '../services/auth.api.js';


export default function CreateTravelRequest() {

  const user =
    requireUser();

  const navigate =
    useNavigate();

  const {
    travelRequestId,
  } = useParams();


  /*
   * If travelRequestId exists,
   * this is correction mode.
   */
  const isEditMode =
    Boolean(travelRequestId);


  const [
    form,
    setForm,
  ] = useState({

    fromDate: '',
    toDate: '',
    destination: '',
    company: '',
    purpose: '',

    travelCategory:
      'Domestic - Tier 1',

    currency: 'INR',

    modeOfTravel:
      'Flight',

    airRail: 0,
    lodging: 0,
    localConveyance: 0,
    mealsAllowance: 0,
    other: 0,

    advanceRequested: 0,
  });


  const [
    error,
    setError,
  ] = useState('');


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    loadingRequest,
    setLoadingRequest,
  ] = useState(
    isEditMode
  );


  /*
   * --------------------------------------------------
   * RETURNED REQUEST INFORMATION
   * --------------------------------------------------
   *
   * Stores the existing request so that we can show
   * who returned it and the exact remarks.
   */
  const [
    returnedRequest,
    setReturnedRequest,
  ] = useState(null);


  /*
   * --------------------------------------------------
   * LOAD EXISTING REQUEST IN EDIT MODE
   * --------------------------------------------------
   */
  useEffect(() => {

    if (!isEditMode) {
      return;
    }


    let mounted = true;


    const loadRequest =
      async () => {

        try {

          setLoadingRequest(true);
          setError('');


          const request =
            await getTravelRequest(
              travelRequestId
            );


          const data =
            request?.data ||
            request;


          if (!data) {
            throw new Error(
              'Travel Request not found'
            );
          }


          /*
           * Security / ownership check.
           */
          if (
            data.employeeDetails
              ?.employeeCode !==
            user.employeeCode
          ) {
            throw new Error(
              'You are not authorized to edit this Travel Request.'
            );
          }


          /*
           * Only approval-returned requests
           * can use this page.
           */
          if (
            data.workflowStatus !==
            'Returned'
          ) {
            throw new Error(
              'This Travel Request is not available for correction.'
            );
          }


          /*
           * Keep the complete returned request
           * so the UI can display the approver,
           * role, date and remarks.
           */
          if (mounted) {
            setReturnedRequest(data);
          }


          const estimated =
            data.estimatedCost || {};


          const advance =
            data.travelAdvance || {};


          if (mounted) {

            setForm({

              fromDate:
                data.travelDetails
                  ?.fromDate || '',

              toDate:
                data.travelDetails
                  ?.toDate || '',

              destination:
                data.travelDetails
                  ?.destination || '',

              company:
                data.travelDetails
                  ?.company || '',

              purpose:
                data.travelDetails
                  ?.purpose || '',

              travelCategory:
                data.travelDetails
                  ?.travelCategory ||
                'Domestic - Tier 1',

              currency:
                data.travelDetails
                  ?.currency ||
                'INR',

              modeOfTravel:
                data.travelDetails
                  ?.modeOfTravel ||
                'Flight',

              airRail:
                estimated.airRail
                  ?.amount || 0,

              lodging:
                estimated.lodging
                  ?.amount || 0,

              localConveyance:
                estimated.localConveyance
                  ?.amount || 0,

              mealsAllowance:
                estimated.mealsAllowance
                  ?.amount || 0,

              other:
                estimated.other
                  ?.amount || 0,

              advanceRequested:
                advance.requested || 0,
            });

          }

        } catch (requestError) {

          console.error(
            'Failed to load Travel Request:',
            requestError
          );


          if (mounted) {

            setError(
              requestError.message ||
              'Failed to load Travel Request.'
            );

          }

        } finally {

          if (mounted) {
            setLoadingRequest(false);
          }

        }

      };


    loadRequest();


    return () => {
      mounted = false;
    };

  }, [
    isEditMode,
    travelRequestId,
    user.employeeCode,
  ]);


  /*
   * --------------------------------------------------
   * RETURNED APPROVAL
   * --------------------------------------------------
   *
   * The approvalWorkflow already contains:
   * name, role, remarks and actionDate.
   */
  const returnedApproval =
    useMemo(() => {

      if (!returnedRequest) {
        return null;
      }

      return (
        returnedRequest.approvalWorkflow
          ?.find(
            (approval) =>
              approval.status ===
              'Returned'
          ) ||
        null
      );

    }, [
      returnedRequest,
    ]);


  const updateField = (
    field,
    value
  ) => {

    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

  };


  /*
   * --------------------------------------------------
   * NUMBER OF TRAVEL DAYS
   * --------------------------------------------------
   */

  const numberOfDays =
    useMemo(() => {

      if (
        !form.fromDate ||
        !form.toDate
      ) {
        return 0;
      }


      const startDate =
        new Date(
          form.fromDate
        );

      const endDate =
        new Date(
          form.toDate
        );


      if (
        endDate < startDate
      ) {
        return 0;
      }


      return (
        Math.floor(
          (
            endDate -
            startDate
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        ) + 1
      );

    }, [
      form.fromDate,
      form.toDate,
    ]);


  /*
   * --------------------------------------------------
   * TOTAL ESTIMATED COST
   * --------------------------------------------------
   */

  const estimatedTotal =
    useMemo(() => {

      return [
        'airRail',
        'lodging',
        'localConveyance',
        'mealsAllowance',
        'other',
      ].reduce(
        (
          total,
          field
        ) =>
          total +
          (
            Number(
              form[field]
            ) || 0
          ),
        0
      );

    }, [form]);


  /*
   * --------------------------------------------------
   * SUBMIT
   * --------------------------------------------------
   */

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError('');


      if (
        !form.fromDate ||
        !form.toDate
      ) {

        setError(
          'Please enter valid travel dates.'
        );

        return;
      }


      if (
        numberOfDays <= 0
      ) {

        setError(
          'To Date must be on or after From Date.'
        );

        return;
      }


      if (
        !form.destination.trim()
      ) {

        setError(
          'Destination is required.'
        );

        return;
      }


      if (
        !form.company.trim()
      ) {

        setError(
          'Company / Customer is required.'
        );

        return;
      }


      if (
        !form.purpose.trim()
      ) {

        setError(
          'Travel purpose is required.'
        );

        return;
      }


      if (
        estimatedTotal <= 0
      ) {

        setError(
          'At least one estimated expense is required.'
        );

        return;
      }


      setSaving(true);


      try {

        const payload = {

          employeeCode:
            user.employeeCode,

          fromDate:
            form.fromDate,

          toDate:
            form.toDate,

          numberOfDays,

          destination:
            form.destination.trim(),

          company:
            form.company.trim(),

          purpose:
            form.purpose.trim(),

          travelCategory:
            form.travelCategory,

          currency:
            form.currency,

          modeOfTravel:
            form.modeOfTravel,

          estimatedCost: {

            airRail: {
              basis:
                'Estimated',

              amount:
                Number(
                  form.airRail
                ) || 0,

              borneBy:
                'Company',
            },

            lodging: {
              basis:
                'Estimated',

              amount:
                Number(
                  form.lodging
                ) || 0,

              borneBy:
                'Company',
            },

            localConveyance: {
              basis:
                'Actuals',

              amount:
                Number(
                  form.localConveyance
                ) || 0,

              borneBy:
                'Employee',
            },

            mealsAllowance: {
              basis:
                'As per policy',

              amount:
                Number(
                  form.mealsAllowance
                ) || 0,

              borneBy:
                'Employee',
            },

            other: {
              basis:
                'Estimated',

              amount:
                Number(
                  form.other
                ) || 0,

              borneBy:
                'Employee',
            },
          },

          travelAdvance: {
            requested:
              Number(
                form.advanceRequested
              ) || 0,
          },
        };


        let response;


        /*
         * CREATE MODE
         */
        if (!isEditMode) {

          response =
            await createTravelRequest(
              payload
            );

        }

        /*
         * RESUBMIT MODE
         */
        else {

          response =
            await resubmitTravelRequest(
              travelRequestId,
              payload
            );

        }


        navigate(
          `/travel-requests/${response.travelRequestId}`
        );

      } catch (err) {

        setError(
          err?.message ||
          (
            isEditMode
              ? 'Unable to resubmit Travel Request.'
              : 'Unable to create Travel Request.'
          )
        );

      } finally {

        setSaving(false);

      }

    };


  /*
   * --------------------------------------------------
   * FORMAT CURRENCY
   * --------------------------------------------------
   */

  const formatCurrency =
    (value) =>
      Number(
        value || 0
      ).toLocaleString(
        'en-IN',
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      );


  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loadingRequest) {

    return (
      <div className="card">

        Loading Travel Request...

      </div>
    );

  }


  return (
    <div className="create-travel-page">


      {/* PAGE HEADER */}

      <div className="page-header">

        <div>

          <span className="eyebrow">

            {isEditMode
              ? 'CORRECT TRAVEL REQUEST'
              : 'STEP 1 OF 6'}

          </span>


          <h2>

            {isEditMode
              ? 'Correct Travel Request'
              : 'Create Travel Request'}

          </h2>


          <p>

            {isEditMode
              ? 'Review the return remarks, correct the request and resubmit it for approval.'
              : 'Submit your proposed business travel for approval.'}

          </p>

        </div>

      </div>


      {/* WORKFLOW */}

      <TravelRequestStepper
        currentStep={1}
      />


      {/* RETURN INFORMATION */}

      {isEditMode && (

        <div className="card">

          <h3>
            Returned for Correction
          </h3>


          <p>
            Please correct the issue identified
            by the approver before resubmitting.
          </p>


          <div className="form-grid">

            <div>

              <strong>
                Returned By
              </strong>

              <p>
                {
                  returnedApproval?.name ||
                  'Approver'
                }
              </p>

            </div>


            <div>

              <strong>
                Role
              </strong>

              <p>
                {
                  returnedApproval?.role ||
                  'Approver'
                }
              </p>

            </div>


            <div>

              <strong>
                Returned On
              </strong>

              <p>

                {
                  returnedApproval?.actionDate
                    ? new Date(
                        returnedApproval.actionDate
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )
                    : '—'
                }

              </p>

            </div>

          </div>


          <div>

            <strong>
              Issue / Remarks
            </strong>

            <p>
              {
                returnedRequest?.returnRemarks ||
                returnedApproval?.remarks ||
                'No return remarks were provided.'
              }
            </p>

          </div>

        </div>

      )}


      {/* FORM */}

      <form
        className="travel-request-form"
        onSubmit={handleSubmit}
      >


        {/* =========================================
            01 EMPLOYEE DETAILS
        ========================================= */}

        <FormSection
          number="01"
          title="Employee Details"
          description="Employee information is populated from Employee Master."
        >

          <div className="form-grid">

            <label>

              <span>
                Name
              </span>

              <input
                value={
                  user.name || ''
                }
                disabled
              />

            </label>


            <label>

              <span>
                Employee Code
              </span>

              <input
                value={
                  user.employeeCode || ''
                }
                disabled
              />

            </label>


            <label>

              <span>
                Designation
              </span>

              <input
                value={
                  user.designation || ''
                }
                disabled
              />

            </label>


            <label>

              <span>
                Department
              </span>

              <input
                value={
                  user.department || ''
                }
                disabled
              />

            </label>


            <label>

              <span>
                Cost Centre
              </span>

              <input
                value={
                  user.costCentre || ''
                }
                disabled
              />

            </label>

          </div>

        </FormSection>


        {/* =========================================
            02 TRAVEL DETAILS
        ========================================= */}

        <FormSection
          number="02"
          title="Travel Details"
          description="Enter the details of the proposed business trip. Please enter accurate details."
        >

          <div className="form-grid">

            <label>

              <span>
                From Date
              </span>

              <input
                type="date"
                value={
                  form.fromDate
                }
                onChange={(event) =>
                  updateField(
                    'fromDate',
                    event.target.value
                  )
                }
              />

            </label>


            <label>

              <span>
                To Date
              </span>

              <input
                type="date"
                value={
                  form.toDate
                }
                onChange={(event) =>
                  updateField(
                    'toDate',
                    event.target.value
                  )
                }
              />

            </label>


            <label className="field-full">

              <span>
                Destination
              </span>

              <input
                type="text"
                value={
                  form.destination
                }
                placeholder="e.g. Bengaluru"
                onChange={(event) =>
                  updateField(
                    'destination',
                    event.target.value
                  )
                }
              />

            </label>


            <label>

              <span>
                Company / Customer
              </span>

              <input
                type="text"
                value={
                  form.company
                }
                placeholder="e.g. Vertex Technologies"
                onChange={(event) =>
                  updateField(
                    'company',
                    event.target.value
                  )
                }
              />

            </label>


            <label>

              <span>
                Mode of Travel
              </span>

              <select
                value={
                  form.modeOfTravel
                }
                onChange={(event) =>
                  updateField(
                    'modeOfTravel',
                    event.target.value
                  )
                }
              >

                <option value="Flight">
                  Flight
                </option>

                <option value="Train">
                  Train
                </option>

                <option value="Road">
                  Road
                </option>

              </select>

            </label>


            <label>

              <span>
                Travel Category
              </span>

              <select
                value={
                  form.travelCategory
                }
                onChange={(event) =>
                  updateField(
                    'travelCategory',
                    event.target.value
                  )
                }
              >

                <option value="Domestic - Tier 1">
                  Domestic - Tier 1
                </option>

                <option value="Domestic - Tier 2">
                  Domestic - Tier 2
                </option>

                <option value="Domestic - Tier 3">
                  Domestic - Tier 3
                </option>

                <option value="International">
                  International
                </option>

              </select>

            </label>


            <label>

              <span>
                Currency
              </span>

              <select
                value={
                  form.currency
                }
                onChange={(event) =>
                  updateField(
                    'currency',
                    event.target.value
                  )
                }
              >

                <option value="INR">
                  INR - Indian Rupee
                </option>

              </select>

            </label>


            <label className="field-full">

              <span>
                Purpose
              </span>

              <textarea
                rows="4"
                value={
                  form.purpose
                }
                placeholder="e.g. Customer meeting + site visit"
                onChange={(event) =>
                  updateField(
                    'purpose',
                    event.target.value
                  )
                }
              />

            </label>

          </div>

        </FormSection>


        {/* =========================================
            03 ESTIMATED EXPENSES
        ========================================= */}

        <FormSection
          number="03"
          title="Estimated Expenses"
          description="Enter the expected cost for each expense category."
        >

          <div className="expense-input-grid">

            <label>

              <span>
                Air / Rail
              </span>

              <div className="currency-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.airRail
                  }
                  onChange={(event) =>
                    updateField(
                      'airRail',
                      event.target.value
                    )
                  }
                />

              </div>

              <small>
                Company paid
              </small>

            </label>


            <label>

              <span>
                Lodging
              </span>

              <div className="currency-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.lodging
                  }
                  onChange={(event) =>
                    updateField(
                      'lodging',
                      event.target.value
                    )
                  }
                />

              </div>

              <small>
                Company paid
              </small>

            </label>


            <label>

              <span>
                Local Conveyance
              </span>

              <div className="currency-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.localConveyance
                  }
                  onChange={(event) =>
                    updateField(
                      'localConveyance',
                      event.target.value
                    )
                  }
                />

              </div>

              <small>
                Employee paid
              </small>

            </label>


            <label>

              <span>
                Meals / Allowance
              </span>

              <div className="currency-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.mealsAllowance
                  }
                  onChange={(event) =>
                    updateField(
                      'mealsAllowance',
                      event.target.value
                    )
                  }
                />

              </div>

              <small>
                Employee paid
              </small>

            </label>


            <label>

              <span>
                Other
              </span>

              <div className="currency-input">

                <span>
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.other
                  }
                  onChange={(event) =>
                    updateField(
                      'other',
                      event.target.value
                    )
                  }
                />

              </div>

              <small>
                Employee paid
              </small>

            </label>

          </div>


          <div className="travel-total-box">

            <div>

              <span>
                Total Estimated Cost
              </span>

              <small>
                Used for approval routing and
                advance calculation.
              </small>

            </div>

            <strong>
              ₹
              {formatCurrency(
                estimatedTotal
              )}
            </strong>

          </div>

        </FormSection>


        {/* =========================================
            04 TRAVEL ADVANCE
        ========================================= */}

        <FormSection
          number="04"
          title="Travel Advance"
          description="Request an advance amount to cover eligible expenses during your business trip."
        >

          <div className="travel-advance-card">

            <div className="travel-advance-content">

              <div className="travel-advance-info">

                <div className="travel-advance-icon">
                  ₹
                </div>

                <div>

                  <h4>
                    Advance Request
                  </h4>

                  <p>
                    Enter the amount you would like
                    to receive before your business trip.
                  </p>

                </div>

              </div>


              <label className="advance-request-field">

                <span>
                  Advance Requested
                </span>

                <div className="currency-input large">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.advanceRequested
                    }
                    onChange={(event) =>
                      updateField(
                        'advanceRequested',
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                  />

                </div>

              </label>

            </div>


            <div className="travel-advance-note">

              <p>
                The requested advance will be evaluated
                against the Nortex travel and expense
                policy during processing.
              </p>

            </div>

          </div>

        </FormSection>


        {/* =========================================
            05 DECLARATION
        ========================================= */}

        <FormSection
          number="05"
          title="Declaration"
          description="Please confirm the following before submitting your travel request."
        >

          <div className="declaration-card">

            <div className="declaration-icon">
              ✓
            </div>

            <div className="declaration-content">

              <div className="declaration-title">
                Business Travel Declaration
              </div>

              <p>
                I confirm that this travel is for an
                official business purpose and that I
                will comply with the Nortex travel and
                expense policy.
              </p>

            </div>

            <div className="declaration-status">
              Confirmed
            </div>

          </div>

        </FormSection>


        {/* ERROR */}

        {error && (

          <div className="alert error-alert">
            {error}
          </div>

        )}


        {/* FOOTER */}

        <div className="travel-form-footer">

          <div>

            <span>
              Next step
            </span>

            <strong>
              Trip Approval
            </strong>

          </div>


          <div className="travel-form-actions">

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate(
                  '/travel-requests'
                )
              }
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="button primary"
              disabled={saving}
            >

              {saving
                ? 'Submitting...'
                : isEditMode
                  ? 'Correct & Resubmit →'
                  : 'Submit Travel Request →'}

            </button>

          </div>

        </div>

      </form>

    </div>
  );
}