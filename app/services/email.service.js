import fs from 'fs';
import path from 'path';
import { simpleParser } from 'mailparser';

const isBinaryLikeLine = (line = '') => {
  if (!line.trim()) {
    return false;
  }

  const totalCharacters = line.length;
  const replacementCharacters = (
    line.match(/\uFFFD/g) || []
  ).length;

  if (replacementCharacters / totalCharacters > 0.03) {
    return true;
  }

  const readableCharacters = (
    line.match(
      /[a-zA-Z0-9\s.,!?@#$%&*()_+\-=:;'"/\\<>[\]{}]/g
    ) || []
  ).length;

  const readableRatio = readableCharacters / totalCharacters;
  if (totalCharacters > 80 && readableRatio < 0.60) {
    return true;
  }

  return false;
};

const cleanEmailText = (text = '') => {
  if (!text) {
    return '';
  }

  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalizedText.split('\n');

  const cleanedLines = [];

  let consecutiveBinaryLines = 0;
  let binaryBlockStarted = false;

  for (const line of lines) {
    const binaryLine = isBinaryLikeLine(line);

    if (binaryLine) {
      consecutiveBinaryLines++;

      if (consecutiveBinaryLines >= 3) {
        binaryBlockStarted = true;
      }

      continue;
    }

    if (binaryBlockStarted) {
      continue;
    }

    consecutiveBinaryLines = 0;

    cleanedLines.push(line);
  }

  return cleanedLines
    .join('\n')

    .replace(/\uFFFD/g, '')

    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ''
    )

    .replace(/\n{3,}/g, '\n\n')

    .trim();
};

const formatAddresses = (addressObject) => {
  if (!addressObject?.value) {
    return [];
  }

  return addressObject.value.map((item) => ({
    name: item.name || '',
    address: item.address || '',
  }));
};

export const extractEmailContent = async (filePath) => {
  try {
    const rawEmail = await fs.promises.readFile(filePath);

    const email = await simpleParser(rawEmail);

    return {
      fileName: path.basename(filePath),

      subject: email.subject || '',

      from: formatAddresses(email.from),

      to: formatAddresses(email.to),

      cc: formatAddresses(email.cc),

      date: email.date || null,

      text: cleanEmailText(email.text || ''),

      html: email.html || '',

      attachments: (email.attachments || []).map((attachment) => ({
        fileName: attachment.filename || '',
        contentType: attachment.contentType || '',
        size: attachment.size || 0,
      })),
    };
  } catch (error) {
    console.error(`Failed to parse email: ${filePath}`);
    console.error(error);

    throw error;
  }
};

export const extractAllEmails = async (directoryPath) => {
  const files = await fs.promises.readdir(directoryPath);

  const emailFiles = files
    .filter((file) => file.toLowerCase().endsWith('.eml'))
    .sort();

  const emails = [];

  for (const file of emailFiles) {
    const filePath = path.join(directoryPath, file);

    const email = await extractEmailContent(filePath);

    emails.push(email);
  }

  return emails;
};

export const formatEmailsForAI = (emails) => {
  return emails
    .map((email, index) => {
      const from = email.from
        .map((person) =>
          person.name
            ? `${person.name} <${person.address}>`
            : person.address
        )
        .join(', ');

      const to = email.to
        .map((person) =>
          person.name
            ? `${person.name} <${person.address}>`
            : person.address
        )
        .join(', ');

      const cc = email.cc
        .map((person) =>
          person.name
            ? `${person.name} <${person.address}>`
            : person.address
        )
        .join(', ');

      const attachments = email.attachments
        .map(
          (attachment) =>
            `${attachment.fileName} (${attachment.contentType}, ${attachment.size} bytes)`
        )
        .join('\n');

      return `
============================================================
EMAIL ${index + 1}
============================================================

FILE NAME:
${email.fileName}

FROM:
${from}

TO:
${to}

CC:
${cc}

DATE:
${email.date || ''}

SUBJECT:
${email.subject}

BODY:
${email.text}

ATTACHMENTS:
${attachments || 'None'}
`;
    })
    .join('\n');
};
