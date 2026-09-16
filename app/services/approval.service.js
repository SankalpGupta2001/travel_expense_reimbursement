import {
  getTravelRequestById,
  getTravelRequests,
  updateTravelRequest,
} from './travel-request.service.js';

const normalizeStatus = (status) =>
  String(status || '').toLowerCase().trim();

const getWorkflowStatusForPendingRole = (role) => {
  if (role === 'Reporting Manager') {
    return 'Pending Manager Approval';
  }

  if (role === 'Head of Department') {
    return 'Pending HOD Approval';
  }

  if (role === 'Head of Division') {
    return 'Pending Head of Division Approval';
  }

  if (role === 'MD/CEO') {
    return 'Pending MD/CEO Approval';
  }

  return 'Pending Approval';
};

const activateNextApproval = (workflow) => {
  const updated = workflow.map((item) => ({ ...item }));

  const hasActive = updated.some(
    (item) => normalizeStatus(item.status) === 'pending'
  );

  if (hasActive) {
    return updated;
  }

  const next = updated.find(
    (item) => normalizeStatus(item.status) === 'waiting'
  );

  if (next) {
    next.status = 'Pending';
  }

  return updated;
};

const getCurrentWorkflowStatus = (workflow) => {
  const pending = workflow.find(
    (item) => normalizeStatus(item.status) === 'pending'
  );

  if (pending) {
    return getWorkflowStatusForPendingRole(pending.role);
  }

  const hasWaiting = workflow.some(
    (item) => normalizeStatus(item.status) === 'waiting'
  );

  if (hasWaiting) {
    return 'Pending Approval';
  }

  return 'Pending Settlement';
};

export const getPendingApprovals = async (employeeCode) => {
  const requests = await getTravelRequests();

  return requests.filter((request) =>
    request.approvalWorkflow?.some(
      (item) =>
        item.employeeCode === employeeCode &&
        normalizeStatus(item.status) === 'pending'
    )
  );
};

export const approveTravelRequest = async ({
  travelRequestId,
  approverCode,
}) => {
  const request = await getTravelRequestById(travelRequestId);

  if (!request) {
    const error = new Error('Travel Request not found');
    error.statusCode = 404;
    throw error;
  }

  const workflow = request.approvalWorkflow || [];

  const currentIndex = workflow.findIndex(
    (item) =>
      item.employeeCode === approverCode &&
      normalizeStatus(item.status) === 'pending'
  );

  if (currentIndex === -1) {
    const error = new Error(
      'You are not the current approver for this request'
    );
    error.statusCode = 403;
    throw error;
  }

  const current = workflow[currentIndex];
  current.status = 'Approved';
  current.actionDate = new Date().toISOString();
  current.remarks = '';

  const updatedWorkflow = activateNextApproval(workflow);
  const workflowStatus = getCurrentWorkflowStatus(updatedWorkflow);

  return updateTravelRequest(travelRequestId, {
    approvalWorkflow: updatedWorkflow,
    workflowStatus,
    status: workflowStatus,
    returnRemarks: '',
  });
};

export const returnTravelRequest = async ({
  travelRequestId,
  approverCode,
  remarks,
}) => {
  const request = await getTravelRequestById(travelRequestId);

  if (!request) {
    const error = new Error('Travel Request not found');
    error.statusCode = 404;
    throw error;
  }

  const workflow = request.approvalWorkflow || [];

  const current = workflow.find(
    (item) =>
      item.employeeCode === approverCode &&
      normalizeStatus(item.status) === 'pending'
  );

  if (!current) {
    const error = new Error(
      'You are not the current approver for this request'
    );
    error.statusCode = 403;
    throw error;
  }

  if (!remarks?.trim()) {
    const error = new Error(
      'Remarks are required when returning a request'
    );
    error.statusCode = 400;
    throw error;
  }

  current.status = 'Returned';
  current.remarks = remarks.trim();
  current.actionDate = new Date().toISOString();

  return updateTravelRequest(travelRequestId, {
    approvalWorkflow: workflow,
    workflowStatus: 'Returned',
    status: 'Returned',
    returnRemarks: remarks.trim(),
  });
};
