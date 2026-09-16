import express from 'express';

import {
  getClaims,
  getClaim,
  verify,
  returnFinanceClaim,
  payout,
} from '../controllers/finance.controller.js';


const router = express.Router();


router.get(
  '/api/finance/claims',
  getClaims
);


router.get(
  '/api/finance/claims/:travelRequestId',
  getClaim
);


router.post(
  '/api/finance/claims/:travelRequestId/verify',
  verify
);


router.post(
  '/api/finance/claims/:travelRequestId/return',
  returnFinanceClaim
);


// Release payout
router.post(
  '/api/finance/claims/:travelRequestId/payout',
  payout
);


export default router;