import {
  getPayouts,
  processPayout,
} from '../services/payout.service.js';

export const getAllPayouts =
  async (
    req,
    res,
    next
  ) => {
    try {
      const payouts =
        await getPayouts();

      res.status(200).json({
        success: true,
        data: payouts,
      });
    } catch (error) {
      next(error);
    }
  };

export const payout =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        employeeCode,
      } = req.body;

      const request =
        await processPayout({
          travelRequestId:
            req.params
              .travelRequestId,

          financeEmployeeCode:
            employeeCode,
        });

      res.status(200).json({
        success: true,
        message:
          'Payout processed successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  };