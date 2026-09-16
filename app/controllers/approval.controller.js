import {
  getPendingApprovals,
  approveTravelRequest,
  returnTravelRequest,
} from '../services/approval.service.js';

export const getPending = async (
  req,
  res,
  next
) => {
  try {
    const {
      employeeCode,
    } = req.query;

    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message:
          'employeeCode is required',
      });
    }

    const approvals =
      await getPendingApprovals(
        employeeCode
      );

    return res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    next(error);
  }
};

export const approve = async (
  req,
  res,
  next
) => {
  try {
    const {
      travelRequestId,
    } = req.params;

    const {
      employeeCode,
    } = req.body;

    const request =
      await approveTravelRequest({
        travelRequestId,
        approverCode:
          employeeCode,
      });

    res.status(200).json({
      success: true,
      message:
        'Travel Request approved successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const returnRequest =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        travelRequestId,
      } = req.params;

      const {
        employeeCode,
        remarks,
      } = req.body;

      const request =
        await returnTravelRequest({
          travelRequestId,
          approverCode:
            employeeCode,
          remarks,
        });
      
      res.status(200).json({
        success: true,
        message:
          'Travel Request returned successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  };
