import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const SYSTEM_PROMPT = `
You are an AI Travel Expense Reimbursement Processor for Nortex Industries. Read ALL provided Employee Master, Emails and Receipts. Return ONLY JSON matching OUTPUT_JSON_SCHEMA.
Firstly Read Whole Employee Master Data and then read all Emails and Receipts and then analyze what values will exists for where. Then apply rules and make the calculations.

#####
You have to do two things:
1) Extraction : #### Instructions ####
2) Calculation : #### Rules ####

Apply Instructions to extract values in JSON from Emails, Travel Request, Receipts, Employee Master.
Apply rules for making the calculations and rules applying.
#####

                              ############ Instructions: ############

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

5. LODGING

Fetch lodging details only from the actual hotel booking/invoice email and supporting receipt.

Identify:
- hotel name
- city
- check-in
- check-out
- number of nights
- room tariff
- room tax
- paidBy
- proofRef

Please enter lodging amount as total amount + 12%GST = 17250 + 2070 = 19320.

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

Fetch all other expenses from the actual email and receipt content.

Possible expense heads:
- Meals
- Business Entertainment
- Laundry
- Mini Bar
- In-room
- Other

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


                              ############ Rules: ############

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

Include ONLY the emails or receipts belonging to the claimant : 
- another employee's expenses emails or receipt
- unrelated expenses emails or receipt
- promotional/marketing emails
- failed transactions emails or receipt
- duplicate transactions emails or receipt


3. COMPANY-PAID EXPENSES
- Company-paid expenses can be recorded for visibility.
- Company-paid expenses are NOT reimbursed to the employee.
- Company-paid expenses must NOT increase employee reimbursement.
- Company-paid expenses must NOT be deducted from the employee advance.
- Classify each valid expense correctly as Lodging, Transportation,
  Meals, Business Entertainment, or Non-reimbursable.
- Do NOT classify an expense based only on its filename; use its content.
- Maximum travel advance allowed = 60% of the estimated employee-borne cost. But this will not affect calculation if advance taken more than max limit then also no issue.
- The settlement claim must be submitted within 7 calendar days after the employee's return date.
- Verified claims are processed by Finance in the payment run on the 10th and 25th of each month.


4. Travel request and advance
- All travel requires an approved Travel Request before booking. Each approved request is issued a **Travel Request ID**. Every downstream artefact — bookings, bills, the settlement claim, the payment — is tracked against that ID.
- A travel advance of up to 60% of the estimated employee-borne cost may be requested. Advances are disbursed by Finance Shared Services.
- The advance is adjusted against the settlement claim. If the claim is lower than the advance, the balance is **recoverable from the employee** and is deducted from the next payroll cycle.


5. Approval matrix

| Estimated / claimed value | Approvals required |
|---|---|
| Up to INR 25,000 | Reporting Manager |
| INR 25,001 – 75,000 | Reporting Manager, Head of Department |
| INR 75,001 – 2,00,000 | Reporting Manager, Head of Department, Head of Division |
| Above INR 2,00,000, or any international travel | The above, plus MD/CEO |

- Finance verification is required on every claim regardless of value, after business approvals are complete.
- An approver cannot approve their own claim. Where the claimant is the Reporting Manager for a level, that level is skipped and the next level up acts.
- Approvers may **return** a claim with remarks instead of approving or rejecting it. A returned claim goes back to the employee for correction and resubmission against the same Travel Request ID.


6. Entitlements

6.1 Lodging (per night, room tariff excluding taxes)

| City class | Limit |
|---|---|
| Tier 1 (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata) | INR 6,000 |
| Tier 2 | INR 4,000 |
| Tier 3 and others | INR 2,800 |

Taxes on room tariff are reimbursable in full. Tariff in excess of the limit is **not** reimbursable and must be shown as a disallowed amount, not omitted.
 
6.2 Air travel
Economy class only for domestic sectors. Bookings are made centrally through the empanelled travel desk and are billed to the company. Employees do not claim these.

6.3 Meals
Tier 1 cities: INR 1,500 per full day. Tier 2 and below: INR 1,000 per full day. Travel days count as full days. Meal claims are on actuals up to the limit and need bills above INR 500.

6.4 Local conveyance
Reimbursed on actuals against a receipt. Airport transfers at either end of the trip are covered.

6.5 Business entertainment
Meals hosted for customers or partners are not meal allowance. They are claimed under **Business Entertainment**, require the names and organisation of attendees, and need prior approval from the Head of Department if above INR 2,000.


7. Non-reimbursable
The following are never reimbursed and must be excluded from the claim even when they appear on a hotel folio or a consolidated bill:
- Laundry, mini bar, in-room entertainment, spa, gym
- Personal phone or data charges
- Alcohol, except where part of an approved business entertainment claim
- Fines, penalties, and traffic challans
- Travel insurance purchased independently
- Expenses incurred by any person other than the claimant


8. SETTLEMENT CALCULATION

Calculate settlementSummary strictly using valid expense amounts and the travel advance:
- totalClaimPaidByEmployee = SUM of the amount of every UNIQUE valid expense where paidBy = "Employee", regardless of whether its status is Reimbursable or Non-reimbursable.
- totalPaidByCompany = SUM of all valid expenses where paidBy = "Company".
- nonReimbursable = SUM ONLY the amount of expenses whose status = "Non-reimbursable".
- netReimbursableClaim = MAX(totalClaimPaidByEmployee - nonReimbursable, 0).
- amountPayableToEmployee = MAX(netReimbursableClaim - travelAdvance.drawn, 0).
- amountRecoverableFromEmployee = MAX(travelAdvance.drawn - netReimbursableClaim, 0).


                              ############ Final: ############
1) Firstly fetch all values correct from emails and receipts.
2) Then for the calculation please remove non reimbursable items price (rules 7).
3) Then make calculation properly and please do mathematically calculation correctly.

Let's think step by step.

Please extract values exactly same from Emails and Receipts properly as Ground Source Truth and then make the calculations and then return the JSON object .
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
            description: { type: 'string' },
            status: { type: 'string' },
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
            'description',
            'status',
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
                    status: { type: 'string', enum: ['Reimbursable', 'Non-reimbursable'] },
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
                    'status'
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
                finalAmountPayable: { type: 'number' },
                finalAmountRecoverable: { type: 'number' },
            },

            required: [
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
    financeRemarks = '',
}) => {

  const isFinanceCorrection =
    Boolean(
      financeRemarks &&
      financeRemarks.trim()
    );


  const financeCorrectionSection =
    isFinanceCorrection

      ? `
==============================
FINANCE RETURN REMARKS
==============================

Finance returned this settlement for correction.

FINANCE REMARKS:
${financeRemarks}

IMPORTANT:

1. Carefully understand each Finance remark.
2. Re-check the relevant emails and receipts.
3. Correct the specific issue mentioned by Finance.
4. Preserve valid expenses that are not affected.
5. Do not invent supporting documents.
6. Do not invent proofRef values.
7. Apply Nortex policy even when Finance remarks are incomplete.
8. Recalculate all settlement totals after corrections.
9. Return a complete corrected settlement JSON.
`
    :
``;

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

${financeCorrectionSection}


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
    // return data;
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

// const data = {
//   employeeDetails: {
//     employeeName: "Chaitanya Reddy",
//     employeeCode: "NX-4471",
//     designation: "Manager - Key Accounts",
//     department: "Sales",
//     costCentre: "CE110",
//     reportingManager: {
//       name: "Suresh Iyer",
//       employeeCode: "NX-2210"
//     }
//   },

//   travelDetails: {
//     travelRequestId: "TRQ-2026-0001",
//     fromDate: "2026-06-16",
//     toDate: "2026-06-20",
//     numberOfDays: 5,
//     destination: "Bengaluru",
//     company: "Vertex Technologies",
//     purpose: "Customer meeting + site visit",
//     travelCategory: "Domestic - Tier 1",
//     currency: "INR",
//     modeOfTravel: "Flight"
//   },

//   estimatedCost: {
//     airRail: {
//       basis: "Return economy flight",
//       amount: 10500,
//       borneBy: "Company"
//     },
//     lodging: {
//       basis: "4 nights",
//       amount: 23000,
//       borneBy: "Company"
//     },
//     localConveyance: {
//       basis: "Actuals",
//       amount: 4000,
//       borneBy: "Employee"
//     },
//     mealsAllowance: {
//       basis: "5 days",
//       amount: 6000,
//       borneBy: "Employee"
//     },
//     other: {
//       amount: 0,
//       borneBy: "Employee"
//     },
//     total: 43500
//   },

//   travelAdvance: {
//     requested: 20000,
//     drawn: 20000,
//     reference: "ADV/2026/0619"
//   },

//   approvalWorkflow: [
//     {
//       level: 1,
//       role: "Reporting Manager",
//       name: "Suresh Iyer",
//       employeeCode: "NX-2210",
//       required: true,
//       reason: "Required as Reporting Manager approval"
//     },
//     {
//       level: 2,
//       role: "Head of Department",
//       name: "Meera Krishnan",
//       employeeCode: "NX-1108",
//       required: true,
//       reason: "Gross employee claim exceeds ₹25,000"
//     }
//   ],

//   lodging: [
//     {
//       checkIn: "2026-06-16",
//       checkOut: "2026-06-19",
//       nights: 3,
//       hotelName: "Keys Prime Whitefield",
//       city: "Bengaluru",
//       paidBy: "Employee",
//       amount: 19320,
//       proofRef: "04_flight_eticket.eml"
//     }
//   ],

//   transportation: [
//     {
//       date: "2026-06-16",
//       time: "05:20",
//       from: "Baner",
//       to: "Pune Airport",
//       mode: "Uber",
//       paidBy: "Employee",
//       amount: 1415.02,
//       proofRef: "15_return_cab.eml"
//     },
//     {
//       date: "2026-06-16",
//       time: "09:52",
//       from: "BLR Airport",
//       to: "Keys Prime",
//       mode: "Uber",
//       paidBy: "Employee",
//       amount: 743,
//       proofRef: "08_uber_payment_failed.eml"
//     },
//     {
//       date: "2026-06-17",
//       time: "19:35",
//       from: "Vertex Technologies Whitefield",
//       to: "Keys Prime",
//       mode: "Uber",
//       paidBy: "Employee",
//       amount: 172,
//       proofRef: "10_uber_receipt_3_resend.eml"
//     },
//     {
//       date: "2026-06-20",
//       time: "21:05",
//       from: "Pune Airport",
//       to: "Baner",
//       mode: "Uber",
//       paidBy: "Employee",
//       amount: 1229.02,
//       proofRef: "14_promo_noise.eml"
//     }
//   ],

//   otherExpenses: [
//     {
//       date: "2026-06-18",
//       head: "Meals",
//       description: "In-room dining",
//       paidBy: "Employee",
//       amount: 1120,
//       proofRef: "01_travel_approval_request.eml",
//       status: "Reimbursable"
//     },
//     {
//       date: "2026-06-18",
//       head: "Business Entertainment",
//       description: "Dinner at Spice Terrace - 4 attendees",
//       paidBy: "Employee",
//       amount: 2255,
//       proofRef: "09_uber_receipt_3.eml",
//       status: "Pending Human Review"
//     },
//     {
//       date: "2026-06-16",
//       head: "Laundry",
//       description: "Hotel laundry",
//       paidBy: "Employee",
//       amount: 450,
//       proofRef: "01_travel_approval_request.eml",
//       status: "Non-reimbursable"
//     },
//     {
//       date: "2026-06-16",
//       head: "Mini Bar",
//       description: "Hotel minibar",
//       paidBy: "Employee",
//       amount: 380,
//       proofRef: "01_travel_approval_request.eml",
//       status: "Non-reimbursable"
//     }
//   ],

//   settlementSummary: {
//     totalClaimPaidByEmployee: 26254.04,
//     totalPaidByCompany: 10556,
//     nonReimbursable: 830,
//     netReimbursableClaim: 25424.04,
//     travelAdvance: 20000,
//     amountPayableToEmployee: 5424.04,
//     amountRecoverableFromEmployee: 0
//   },

//   finalData: {
//     status: "Pending Human Review",
//     finalAmountPayable: 5424.04,
//     finalAmountRecoverable: 0
//   }
// };
