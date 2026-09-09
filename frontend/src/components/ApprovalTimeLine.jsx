// const ApprovalTimeline = ({
//   workflow = [],
// }) => {
//   return (
//     <div className="timeline">
//       {workflow.map(
//         (step, index) => {
//           const isLast =
//             index ===
//             workflow.length - 1;

//           return (
//             <div
//               className="timeline-item"
//               key={`${step.role}-${index}`}
//             >
//               <div className="timeline-marker">
//                 {step.status ===
//                 'Approved'
//                   ? '✓'
//                   : step.status ===
//                     'Pending'
//                     ? '●'
//                     : step.status ===
//                       'Returned'
//                       ? '!'
//                       : '○'}
//               </div>

//               {!isLast && (
//                 <div
//                   className={`timeline-line ${
//                     step.status ===
//                     'Approved'
//                       ? 'line-approved'
//                       : ''
//                   }`}
//                 />
//               )}

//               <div className="timeline-content">
//                 <div className="timeline-top">
//                   <div>
//                     <h4>
//                       {step.role}
//                     </h4>

//                     <p>
//                       {step.name}
//                       {' · '}
//                       {step.employeeCode}
//                     </p>
//                   </div>

//                   <span
//                     className={`workflow-status workflow-${(
//                       step.status ||
//                       ''
//                     )
//                       .toLowerCase()
//                       .replace(
//                         /\s+/g,
//                         '-'
//                       )}`}
//                   >
//                     {step.status}
//                   </span>
//                 </div>

//                 {step.remarks && (
//                   <div className="workflow-remarks">
//                     <strong>
//                       Remarks:
//                     </strong>{' '}
//                     {step.remarks}
//                   </div>
//                 )}

//                 {step.approvedAt && (
//                   <div className="workflow-date">
//                     Approved{' '}
//                     {new Date(
//                       step.approvedAt
//                     ).toLocaleString(
//                       'en-IN'
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           );
//         }
//       )}
//     </div>
//   );
// };

// export default ApprovalTimeline;

const ApprovalTimeline = ({ workflow = [] }) => {
  return (
    <div className="approval-timeline">
      {workflow.map((step, index) => {
        const isPending = step.status === 'Pending';
        const isApproved = step.status === 'Approved';
        const isReturned = step.status === 'Returned';

        return (
          <div
            className={`approval-step ${
              isPending
                ? 'pending'
                : isApproved
                ? 'approved'
                : isReturned
                ? 'returned'
                : 'waiting'
            }`}
            key={`${step.level}-${step.employeeCode}`}
          >
            {/* Connector */}
            {index < workflow.length - 1 && (
              <div className="approval-connector" />
            )}

            {/* Number / Status Icon */}
            <div className="approval-step-icon">
              {isApproved ? '✓' : isReturned ? '!' : step.level}
            </div>

            {/* Content */}
            <div className="approval-step-content">
              <div className="approval-step-top">
                <div>
                  <div className="approval-step-role">
                    {step.role}
                  </div>

                  <div className="approval-step-person">
                    {step.name}
                    <span>
                      {step.employeeCode}
                    </span>
                  </div>
                </div>

                <span className="approval-status">
                  {step.status}
                </span>
              </div>

              {isPending && (
                <div className="approval-current">
                  Current approval step
                </div>
              )}

              {step.reason && (
                <div className="approval-reason">
                  {step.reason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApprovalTimeline;