import express from 'express';

import {
  getAllPayouts,
  payout,
} from '../controllers/payout.controller.js';

const router =
  express.Router();

router.get(
  '/api/payouts',
  getAllPayouts
);

router.post(
  '/api/payouts/:travelRequestId',
  payout
);

export default router;