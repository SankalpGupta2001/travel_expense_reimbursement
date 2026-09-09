import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { processExpenses } from '../controllers/travel.controller.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDirectory = path.join(__dirname, '../../output');

router.post('/api/expenses/process', processExpenses);
router.get('/api/expenses/download/:fileName', (req, res, next) => {
    try {
      const fileName = path.basename(req.params.fileName);
      const filePath = path.join(outputDirectory, fileName);
      res.download(filePath, fileName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
