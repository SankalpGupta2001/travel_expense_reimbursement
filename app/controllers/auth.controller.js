import path from 'path';
import { fileURLToPath } from 'url';

import {
  extractCsvData,
} from '../services/csv.service.js';

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const dataDirectory =
  path.join(
    __dirname,
    '../../data/expensepack'
  );

const employeeCsvPath =
  path.join(
    dataDirectory,
    'employee_master.csv'
  );

export const getUsers = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await extractCsvData(
        employeeCsvPath
      );

    const users =
      result.data.map(
        (employee) => ({
          employeeCode:
            employee.emp_code,
          name:
            employee.name,
          designation:
            employee.designation,
          department:
            employee.department,
          role:
            employee.role,
        })
      );

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
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
          'employeeCode is required',
      });
    }

    const result =
      await extractCsvData(
        employeeCsvPath
      );

    const employee =
      result.data.find(
        (item) =>
          item.emp_code ===
          employeeCode
      );

    if (!employee) {
      return res.status(401).json({
        success: false,
        message:
          'Employee not found in Employee Master',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        employeeCode:
          employee.emp_code,
        name:
          employee.name,
        email:
          employee.email,
        designation:
          employee.designation,
        department:
          employee.department,
        costCentre:
          employee.cost_centre,
        role:
          employee.role,
      },
    });
  } catch (error) {
    next(error);
  }
};