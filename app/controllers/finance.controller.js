import {
  getFinanceClaims,
  getFinanceClaim,
  verifyClaim,
  returnClaim,
  createPayout,
} from '../services/finance.service.js';


/*
|--------------------------------------------------------------------------
| GET FINANCE CLAIMS
|--------------------------------------------------------------------------
*/

export const getClaims = async (
  req,
  res,
  next
) => {
  try {
    const claims =
      await getFinanceClaims();

    res.status(200).json({
      success: true,
      data: claims,
    });

  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const getClaim = async (
  req,
  res,
  next
) => {
  try {
    const claim =
      await getFinanceClaim(
        req.params.travelRequestId
      );

    res.status(200).json({
      success: true,
      data: claim,
    });

  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| VERIFY FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const verify = async (
  req,
  res,
  next
) => {
  try {

    const {
      employeeCode,
    } = req.body;


    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message:
          'Finance employee code is required.',
      });
    }


    const request =
      await verifyClaim({
        travelRequestId:
          req.params.travelRequestId,

        financeEmployeeCode:
          employeeCode,
      });


    res.status(200).json({
      success: true,

      message:
        'Claim verified successfully and moved to payout.',

      data: request,
    });

  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| RETURN FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const returnFinanceClaim = async (
  req,
  res,
  next
) => {
  try {

    const {
      employeeCode,
      remarks,
    } = req.body;


    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message:
          'Finance employee code is required.',
      });
    }


    if (!remarks?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          'Return remarks are required.',
      });
    }


    const request =
      await returnClaim({
        travelRequestId:
          req.params.travelRequestId,

        financeEmployeeCode:
          employeeCode,

        remarks:
          remarks.trim(),
      });


    res.status(200).json({
      success: true,

      message:
        'Claim returned successfully.',

      data: request,
    });

  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| RELEASE PAYOUT
|--------------------------------------------------------------------------
*/

export const payout = async (
  req,
  res,
  next
) => {
  try {

    const {
      employeeCode,
    } = req.body;


    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message:
          'Finance employee code is required.',
      });
    }


    const request =
      await createPayout({
        travelRequestId:
          req.params.travelRequestId,

        financeEmployeeCode:
          employeeCode,
      });


    res.status(200).json({
      success: true,

      message:
        'Payout released successfully.',

      data: request,
    });

  } catch (error) {
    next(error);
  }
};