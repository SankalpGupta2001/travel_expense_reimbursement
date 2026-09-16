import React from 'react';

const WORKFLOW_STEPS = [
  {
    number: 1,
    title: 'Travel Request',
    description: 'Create request',
    icon: '✈',
  },
  {
    number: 2,
    title: 'Trip Approval',
    description: 'Manager review',
    icon: '✓',
  },
  {
    number: 3,
    title: 'Advance Disbursement',
    description: 'Finance advance',
    icon: '₹',
  },
  {
    number: 4,
    title: 'Trip Settlement',
    description: 'Submit expenses',
    icon: '▣',
  },
  {
    number: 5,
    title: 'Finance Review',
    description: 'Verify claim',
    icon: '▤',
  },
  {
    number: 6,
    title: 'Payout',
    description: 'Payment / recovery',
    icon: '✓',
  },
];

const TravelRequestStepper = ({
  currentStep = 1,
  isWorkflowCompleted = false,
}) => {
  return (
    <div className="workflow-stepper">

      <div className="workflow-stepper-line" />

      {WORKFLOW_STEPS.map((step) => {

        const completed =
          isWorkflowCompleted ||
          step.number < currentStep;

        const active =
          !isWorkflowCompleted &&
          step.number === currentStep;

        return (
          <div
            key={step.number}
            className={[
              'workflow-step',
              active ? 'active' : '',
              completed ? 'completed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >

            <div className="workflow-step-top">

              <div className="workflow-circle">

                <span className="workflow-icon">
                  {completed
                    ? '✓'
                    : step.icon}
                </span>

              </div>

            </div>

            <div className="workflow-label">
              {step.title}
            </div>

            <div className="workflow-description">
              {step.description}
            </div>

          </div>
        );
      })}

    </div>
  );
};

export default TravelRequestStepper;