import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const SYSTEM_PROMPT = `
You are an AI Travel Expense Reimbursement Processor for Nortex Industries.
Read ALL provided Employee Master, Emails and Receipts/OCR. Return ONLY JSON matching OUTPUT_JSON_SCHEMA.

IMPORTANT:
- Never trust a file name to identify its document type.
- Identify the document from its actual subject, sender, body, OCR text and transaction details.
- The actual document content is authoritative.
- Never guess or infer missing values.
- proofRef MUST be the exact file name containing evidence for that expense.

Firstly Read Whole Employee Master Data and then read all Emails and Receipts and then analyze what values will exists for where.
Then apply rules and make the calculations.

#### Instructions: ####

1. EMPLOYEE DETAILS

FETCH employeeDetails ONLY from EMPLOYEE MASTER:

employeeName
employeeCode
designation
department
costCentre
reportingManager.name
reportingManager.employeeCode

Do not use email data when Employee Master contains the value.


2. TRAVEL DETAILS

FETCH travelDetails ONLY from the Travel Request Data:

travelRequestId Only this take From TRAVEL REQUEST DATA
fromDate
toDate
numberOfDays
destination
company
purpose
travelCategory
currency
modeOfTravel


3. ESTIMATED COST

FETCH estimatedCost ONLY from the TRAVEL REQUEST DATA:

airRail.basis
airRail.amount
airRail.borneBy

lodging.basis
lodging.amount
lodging.borneBy

localConveyance.basis
localConveyance.amount
localConveyance.borneBy

mealsAllowance.basis
mealsAllowance.amount
mealsAllowance.borneBy

other.amount
other.borneBy
total

Do NOT calculate or replace estimated values using receipts take only from TRAVEL REQUEST DATA.


4. TRAVEL ADVANCE

FETCH travelAdvance from Emails and Travel Request Data:
- travelAdvance.requested: Take the amount requested by the employee from TRAVEL REQUEST DATA.
- travelAdvance.drawn: Take the amount actually disbursed/credited by the company from the advance disbursement email.
- travelAdvance.reference: Take the reference number from the advance disbursement document/email.

If travelAdvance.drawn exceeds the maximum allowed advance, keep the drawn amount unchanged and set finalData.status = "Pending Human Review".

5. LODGING
Fetch lodging details only from the actual hotel booking/invoice email and supporting receipt. Identify the actual hotel amount paid/charged for the room from the document content, not from the file name. Use the room tariff and applicable room tax exactly as stated in the supporting document; do not recalculate, modify, add GST, or derive a different amount from the invoice total. Exclude separate charges such as laundry, minibar, in-room dining, and other non-room expenses. Apply the applicable per-night policy limit to the room tariff, and include only the tax explicitly attributable to the room. The lodging.amount must represent only the final eligible amount for the hotel room and its applicable room tax.

6. TRANSPORTATION
FETCH each data from FLIGHT/E-TICKET EMAIL and Uber/Cab/Taxi EMAIL.

date
time
from
to
mode
paidBy
amount
proofRef


7. OTHER EXPENSES

Fetch all other expense like with exact same data from emails and receipt data.

- Meals
- Business Entertainment
- Laundry
- Mini Bar
- In-room
- Other

IMPORTANT:
- In-room dining MUST be classified as Meals and is NOT automatically non-reimbursable.
- Customer/partner meals MUST be classified as Business Entertainment.
- Laundry and Mini Bar MUST be classified as non-reimbursable.
- Apply the applicable policy rules to determine the final status.
- For Meals, calculate eligibility against the applicable daily meal limit and do not reimburse more than the daily limit.
- These amount MUST be copied exactly from the supporting document. Do not recalculate, add, remove, or apply GST/tax to the stated line-item amount unless the document explicitly states that the amount excludes tax.

For each expense, return:
date
head
description
paidBy
amount
proofRef
status


Note:
So Read all Emails, TRAVEL REQUEST DATA and Receipts and then analyze which data will go where based on Instructions given.


#### Rules: #####

1. DUPLICATES
There can be many file having same details so possible that same email came two time so take it as once.
Identify duplicates using:
- merchant
- date
- time
- amount
- route
- invoice number
- transaction/reference number


2. EXPENSE OWNERSHIP

Include ONLY expenses belonging to the claimant.
Do no check these emails or receipt:
- another employee's expenses
- unrelated expenses
- promotional/marketing emails
- failed transactions
- duplicate transactions


3. COMPANY-PAID EXPENSES
- Company-paid expenses can be recorded for visibility.
- Company-paid expenses are NOT reimbursed to the employee.
- Company-paid expenses must NOT increase employee reimbursement.
- Company-paid expenses must NOT be deducted from the employee advance.
- Classify each valid expense correctly as Lodging, Transportation,
  Meals, Business Entertainment, or Non-reimbursable.
- Do NOT classify an expense based only on its filename; use its content.
- Maximum travel advance allowed = 60% of the estimated employee-borne cost.
- The settlement claim must be submitted within 7 calendar days after the employee's return date.
- Verified claims are processed by Finance in the payment run on the 10th and 25th of each month.


4. Lodging (per night, room tariff excluding taxes)

| City class | Limit |
|---|---:|
| Tier 1 (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata) | INR 6,000 |
| Tier 2 | INR 4,000 |
| Tier 3 and others | INR 2,800 |

Taxes on room tariff are reimbursable in full. Tariff in excess of the limit is **not** reimbursable and must be shown as a disallowed amount, not omitted.

5. MEAL POLICY

Tier 1 = ₹1,500/day
Tier 2 and below = ₹1,000/day
Travel days count as full days.
Aggregate claimant's eligible meals per day.
Bills are required for meals above ₹500.
Business Entertainment does NOT use the meal allowance.
Business Entertainment > ₹2,000 requires PRIOR HOD approval.


6. Non-reimbursable

The following are never reimbursed and must be excluded from the claim even when they appear on a hotel folio or a consolidated bill:

- Laundry, mini bar, in-room entertainment, spa, gym
- Personal phone or data charges
- Alcohol, except where part of an approved business entertainment claim
- Fines, penalties, and traffic challans
- Travel insurance purchased independently
- Expenses incurred by any person other than the claimant


7. APPROVAL WORKFLOW

Use GROSS CLAIM VALUE before advance deduction.
≤ ₹25,000: Reporting Manager
₹25,001–₹75,000: Reporting Manager + HOD
₹75,001–₹2,00,000: Reporting Manager + HOD + Head of Division
> ₹2,00,000 OR international: Reporting Manager + HOD + Head of Division + MD/CEO


8. SETTLEMENT CALCULATION

Calculate settlementSummary strictly using valid expense amounts and the travel advance:
- totalClaimPaidByEmployee = SUM of the amount of every valid expense where paidBy = "Employee", regardless of whether its status is Reimbursable, Non-reimbursable, or Pending Human Review. Do not include Company-paid expenses, duplicates, failed transactions, or other employees' expenses.
- totalPaidByCompany = SUM of all valid expenses where paidBy = "Company".
- nonReimbursable = SUM ONLY the amount of expenses whose status = "Non-reimbursable". Do NOT include expenses with status "Pending Human Review" or "Reimbursable".
- netReimbursableClaim = MAX(totalClaimPaidByEmployee - nonReimbursable, 0).
- amountPayableToEmployee = MAX(netReimbursableClaim - travelAdvance.drawn, 0).
- amountRecoverableFromEmployee = MAX(travelAdvance.drawn - netReimbursableClaim, 0).
Perform the calculations directly from the final expense line items and do not recalculate, estimate, or classify an expense differently during settlement calculation.


Note:
Set finalData.status = "Pending Human Review" if any of these exist:
- missing/incorrect proof
- conflicting source values
- uncertain duplicate
- uncertain ownership
- unclear hotel tax allocation
- missing required approval
- advance policy violation
- unsupported amount
- material policy exception


#### FINAL VALIDATION: ####

Before returning JSON verify:

1. Employee details : Employee Master
2. Travel details : Emails and Travel Request
3. Estimated cost : Travel Request
4. Advance requested : Travel Request
5. Advance drawn/reference : Emails
6. Lodging : Emails and receipt
7. Flights : Emails
8. Transport : Email
9. Other expenses : Email and recepit
10. proofRef : Fetch Exact supporting File name
11. Duplicates : counted once
12. Other employee expenses : excluded
13. Company-paid expenses : not reimbursed
14. Policy : applied
15. Approval workflow : based on gross claim
16. Calculations : mathematically correct
17. finalData amounts : settlementSummary amounts


Return ONLY the final JSON object.
`;

const outputJsonSchema = {
    type: 'object',

    additionalProperties: false,

    properties: {
        employeeDetails: {
            type: 'object',
            additionalProperties: false,
            properties: {
                employeeName: { type: 'string' },
                employeeCode: { type: 'string' },
                designation: { type: 'string' },
                department: { type: 'string' },
                costCentre: { type: 'string' },

                reportingManager: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        name: { type: 'string' },
                        employeeCode: { type: 'string' },
                    },
                    required: [
                        'name',
                        'employeeCode',
                    ],
                },
            },

            required: [
                'employeeName',
                'employeeCode',
                'designation',
                'department',
                'costCentre',
                'reportingManager',
            ],
        },

        travelDetails: {
            type: 'object',
            additionalProperties: false,

            properties: {
                travelRequestId: { type: 'string' },
                fromDate: { type: 'string' },
                toDate: { type: 'string' },
                numberOfDays: { type: 'number' },
                destination: { type: 'string' },
                company: { type: 'string' },
                purpose: { type: 'string' },
                travelCategory: { type: 'string' },
                currency: { type: 'string' },
                modeOfTravel: { type: 'string' },
            },

            required: [
                'travelRequestId',
                'fromDate',
                'toDate',
                'numberOfDays',
                'destination',
                'company',
                'purpose',
                'travelCategory',
                'currency',
                'modeOfTravel',
            ],
        },

        estimatedCost: {
            type: 'object',
            additionalProperties: false,

            properties: {
                airRail: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        basis: { type: 'string' },
                        amount: { type: 'number' },
                        borneBy: { type: 'string' },
                    },
                    required: ['basis', 'amount', 'borneBy'],
                },

                lodging: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        basis: { type: 'string' },
                        amount: { type: 'number' },
                        borneBy: { type: 'string' },
                    },
                    required: ['basis', 'amount', 'borneBy'],
                },

                localConveyance: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        basis: { type: 'string' },
                        amount: { type: 'number' },
                        borneBy: { type: 'string' },
                    },
                    required: ['basis', 'amount', 'borneBy'],
                },

                mealsAllowance: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        basis: { type: 'string' },
                        amount: { type: 'number' },
                        borneBy: { type: 'string' },
                    },
                    required: ['basis', 'amount', 'borneBy'],
                },

                other: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        amount: { type: 'number' },
                        borneBy: { type: 'string' },
                    },
                    required: ['amount', 'borneBy'],
                },

                total: {
                    type: 'number',
                },
            },

            required: [
                'airRail',
                'lodging',
                'localConveyance',
                'mealsAllowance',
                'other',
                'total',
            ],
        },

        travelAdvance: {
            type: 'object',
            additionalProperties: false,

            properties: {
                requested: { type: 'number' },
                drawn: { type: 'number' },
                reference: { type: 'string' },
            },

            required: [
                'requested',
                'drawn',
                'reference',
            ],
        },

        approvalWorkflow: {
            type: 'array',

            items: {
                type: 'object',
                additionalProperties: false,

                properties: {
                    level: { type: 'number' },
                    role: { type: 'string' },
                    name: { type: 'string' },
                    employeeCode: { type: 'string' },
                    required: { type: 'boolean' },
                    reason: { type: 'string' },
                },

                required: [
                    'level',
                    'role',
                    'name',
                    'employeeCode',
                    'required',
                    'reason',
                ],
            },
        },

        lodging: {
            type: 'array',

            items: {
                type: 'object',
                additionalProperties: false,

                properties: {
                    checkIn: { type: 'string' },
                    checkOut: { type: 'string' },
                    nights: { type: 'number' },
                    hotelName: { type: 'string' },
                    city: { type: 'string' },
                    paidBy: { type: 'string' },
                    amount: { type: 'number' },
                    proofRef: { type: 'string' },
                },

                required: [
                    'checkIn',
                    'checkOut',
                    'nights',
                    'hotelName',
                    'city',
                    'paidBy',
                    'amount',
                    'proofRef',
                ],
            },
        },

        transportation: {
            type: 'array',

            items: {
                type: 'object',
                additionalProperties: false,

                properties: {
                    date: { type: 'string' },
                    time: { type: 'string' },
                    from: { type: 'string' },
                    to: { type: 'string' },
                    mode: { type: 'string' },
                    paidBy: { type: 'string' },
                    amount: { type: 'number' },
                    proofRef: { type: 'string' },
                },

                required: [
                    'date',
                    'time',
                    'from',
                    'to',
                    'mode',
                    'paidBy',
                    'amount',
                    'proofRef',
                ],
            },
        },

        otherExpenses: {
            type: 'array',

            items: {
                type: 'object',
                additionalProperties: false,

                properties: {
                    date: { type: 'string' },
                    head: { type: 'string' },
                    description: { type: 'string' },
                    paidBy: { type: 'string' },
                    amount: { type: 'number' },
                    proofRef: { type: 'string' },
                    status: { type: 'string' },
                },

                required: [
                    'date',
                    'head',
                    'description',
                    'paidBy',
                    'amount',
                    'proofRef',
                    'status',
                ],
            },
        },

        settlementSummary: {
            type: 'object',
            additionalProperties: false,

            properties: {
                totalClaimPaidByEmployee: { type: 'number' },
                totalPaidByCompany: { type: 'number' },
                nonReimbursable: { type: 'number' },
                netReimbursableClaim: { type: 'number' },
                travelAdvance: { type: 'number' },
                amountPayableToEmployee: { type: 'number' },
                amountRecoverableFromEmployee: { type: 'number' },
            },

            required: [
                'totalClaimPaidByEmployee',
                'totalPaidByCompany',
                'nonReimbursable',
                'netReimbursableClaim',
                'travelAdvance',
                'amountPayableToEmployee',
                'amountRecoverableFromEmployee',
            ],
        },

        finalData: {
            type: 'object',
            additionalProperties: false,

            properties: {
                status: { type: 'string' },
                finalAmountPayable: { type: 'number' },
                finalAmountRecoverable: { type: 'number' },
            },

            required: [
                'status',
                'finalAmountPayable',
                'finalAmountRecoverable',
            ],
        },
    },

    required: [
        'employeeDetails',
        'travelDetails',
        'estimatedCost',
        'travelAdvance',
        'approvalWorkflow',
        'lodging',
        'transportation',
        'otherExpenses',
        'settlementSummary',
        'finalData',
    ],
};

export const generateExpenseSettlement = async ({
    employeeMasterData,
    travelRequestData,
    emails,
    receipts,
}) => {
const userPrompt = `
Process the following travel expense data using the system instructions.

==============================
EMPLOYEE MASTER DATA
==============================
${employeeMasterData}


==============================
TRAVEL REQUEST DATA
==============================
${travelRequestData}


==============================
EMAILS
==============================
${emails}


==============================
RECEIPTS / OCR DATA
==============================
${receipts}

Return the final Travel Expense Settlement JSON.
`;

console.log(userPrompt, 'userPrompt');

    const response =
      await ai.models.generateContent({
        model:
          process.env.GEMINI_MODEL,

        contents: userPrompt,

        config: {
          systemInstruction:
            SYSTEM_PROMPT,

          responseMimeType:
            'application/json',

          responseSchema:
            outputJsonSchema,
        },
      });
    console.log(response, 'response');

    if (!response.text) {
      throw new Error(
        'Gemini returned an empty response'
      );
    }

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error(
        'Invalid JSON returned by Gemini'
      );

      console.error(response.text);

      throw new Error(
        'Gemini returned invalid JSON'
      );
    }
};
