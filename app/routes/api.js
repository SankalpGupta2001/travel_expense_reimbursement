import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

import {
  processExpenses,
} from '../controllers/travel.controller.js';

const router =
  express.Router();

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const outputDirectory =
  path.join(
    __dirname,
    '../../output'
  );

const uploadDirectory =
  path.join(
    __dirname,
    '../../uploads'
  );

if (
  !fs.existsSync(
    uploadDirectory
  )
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const safeName =
        file.originalname
          .replace(
            /[^a-zA-Z0-9._-]/g,
            '_'
          );

      cb(
        null,
        `${Date.now()}-${safeName}`
      );
    },
  });

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      cb
    ) => {
      const allowed =
        [
          '.png',
          '.jpg',
          '.jpeg',
          '.pdf',
        ];

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      if (
        allowed.includes(
          extension
        )
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            'Only PNG, JPG, JPEG and PDF files are allowed'
          )
        );
      }
    },
  });

router.post(
  '/api/expenses/process',
  upload.array(
    'documents',
    20
  ),
  processExpenses
);

router.get(
  '/api/expenses/download/:fileName',
  (req, res, next) => {
    try {
      const fileName =
        path.basename(
          req.params.fileName
        );

      const filePath =
        path.join(
          outputDirectory,
          fileName
        );

      res.download(
        filePath,
        fileName,
        (error) => {
          if (
            error &&
            !res.headersSent
          ) {
            next(error);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;