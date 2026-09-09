import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export const extractCsvData = async (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve({
          fileName: path.basename(filePath),
          data: rows,
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};


export const formatCsvForAI = (csvResult) => {
  return `
FILE NAME:
${csvResult.fileName}

EMPLOYEE RECORDS:

${JSON.stringify(csvResult.data, null, 2)}
`;
};