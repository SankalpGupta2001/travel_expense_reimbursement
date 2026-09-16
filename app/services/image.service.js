import fs from 'fs/promises';
import path from 'path';
import { createWorker } from 'tesseract.js';

let worker = null;

const initializeWorker = async () => {
  if (worker) {
    return worker;
  }

  console.log(
    'Initializing OCR worker...'
  );

  worker =
    await createWorker('eng');

  console.log(
    'OCR worker initialized'
  );

  return worker;
};

export const extractTextFromImage =
  async (imagePath) => {
    try {
      const ocrWorker =
        await initializeWorker();

      const imageBuffer =
        await fs.readFile(
          imagePath
        );

      const result =
        await ocrWorker.recognize(
          imageBuffer
        );

      return {
        fileName:
          path.basename(imagePath),

        text:
          result.data.text,
      };
    } catch (error) {
      console.error(
        `OCR failed for ${imagePath}`
      );

      console.error(error);

      throw error;
    }
  };

export const extractAllImages =
  async (directoryPath) => {
    const files =
      await fs.readdir(
        directoryPath
      );

    const imageFiles =
      files
        .filter((file) => {
          const extension =
            path.extname(file)
              .toLowerCase();

          return [
            '.png',
            '.jpg',
            '.jpeg',
          ].includes(
            extension
          );
        })
        .sort();

    const results = [];

    for (
      const file of imageFiles
    ) {
      const filePath =
        path.join(
          directoryPath,
          file
        );

      const result =
        await extractTextFromImage(
          filePath
        );

      results.push(result);
    }

    return results;
  };

export const extractUploadedImages =
  async (files = []) => {
    const results = [];

    for (
      const file of files
    ) {
      const result =
        await extractTextFromImage(
          file.path
        );

      results.push({
        fileName:
          file.originalname,

        text:
          result.text,
      });
    }

    return results;
  };

export const formatImagesForAI =
  (images) => {
    return images
      .map(
        (image, index) => `
============================================================
RECEIPT / OCR ${index + 1}
============================================================

FILE NAME:
${image.fileName}

OCR TEXT:
${image.text}
`
      )
      .join('\n');
  };

export const closeImageWorker =
  async () => {
    if (worker) {
      await worker.terminate();

      worker = null;

      console.log(
        'OCR worker terminated'
      );
    }
  };