import fs from 'fs/promises';
import path from 'path';

const ensureDirectory = async (filePath) => {
  const directory = path.dirname(filePath);

  await fs.mkdir(directory, {
    recursive: true,
  });
};

export const readJsonFile = async (
  filePath,
  defaultValue = []
) => {
  try {
    const content = await fs.readFile(
      filePath,
      'utf8'
    );

    if (!content.trim()) {
      return defaultValue;
    }

    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureDirectory(filePath);

      await fs.writeFile(
        filePath,
        JSON.stringify(defaultValue, null, 2)
      );

      return defaultValue;
    }

    throw error;
  }
};

export const writeJsonFile = async (
  filePath,
  data
) => {
  await ensureDirectory(filePath);

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2)
  );
};