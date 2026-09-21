# Travel Expense Reimbursement

# My understanding of the problem
The main goal is to automate the travel expense settlement process. The application should read the Travel Request, employee details, emails, and receipts, identify the expenses related to the employee, apply the company travel policy, calculate the final reimbursement, and generate the Expense Settlement Form.
I also understood that not every expense should be reimbursed. For example, company-paid flights should only be recorded for reference, while expenses such as laundry and minibar should be marked as non-reimbursable. Some cases, such as business entertainment without the required approval or unclear document information, should be sent for human review.

# Assumptions
1) In data/expensepack folder all documents are there. In production we can fetch all emails and receipt by gmails apis.
2) Duplicate transactions should be counted only once.
3) Expenses belonging to another employee should not be included in the claim.
4) Company-paid expenses are not added to the employee reimbursement.
5) The travel advance is deducted from the final eligible claim.
6) If the documents are conflicting or a policy decision cannot be made safely, I mark the claim as Pending Human Review instead of guessing.
7) Local storage is used for the demo instead of a database.

# What I built


I built the application using **Node.js, Express.js, React, and Gemini AI** to automate the travel expense reimbursement and settlement workflow.

1. Document Processing
* Processed the provided **Travel Request, emails, and receipt documents** from the data folder.
* Extracted relevant information such as employee details, travel dates, destinations, expense amounts, payment methods, and supporting documents.
* Used Gemini AI to understand unstructured email and receipt content.

2. Structured Expense Extraction
* Converted the extracted information into a **fixed JSON structure** so that the backend can process expenses consistently.
* Identified different expense categories such as:
  * Lodging
  * Transportation
  * Meals
  * Business Entertainment
  * Non-reimbursable expenses
* Linked expenses with the appropriate employee and Travel Request.

3. Expense Validation
* Checked whether an expense was **employee-paid or company-paid**.
* Detected duplicate transactions so the same expense is not reimbursed twice.
* Prevented expenses belonging to another employee from being included in the claim.
* Used the supporting receipt/email information to validate the expense.

4. Travel Policy Application
* Applied the provided company travel policy to different expense categories.
* Validated **lodging limits and eligible hotel charges**.
* Applied **meal limits** based on the applicable policy.
* Checked **business entertainment requirements**, including approval and supporting information.
* Identified expenses such as **laundry and minibar** as non-reimbursable.
* Handled cases where the available information is insufficient and requires further review.

5. Settlement Calculation
* Calculated the total employee-paid expenses.
* Separated company-paid expenses from the employee claim.
* Calculated the total non-reimbursable amount.
* Calculated the final **net reimbursable claim**.
* Deducted the **travel advance** from the eligible claim.
* Determined the final amount **payable to the employee or recoverable from the employee**.

6. Approval Workflow
* Displayed the reporting manager and Head of Department approval information.
* Determined when additional approval or verification is required based on the claim and applicable policy.
* Displayed the current settlement status as part of the Finance verification workflow.

7. Settlement Dashboard
The React frontend provides a settlement view containing:
* Employee details
* Travel Request details
* Trip information
* Approval workflow
* Lodging expenses
* Transportation expenses
* Other expenses
* Reimbursement status
* Financial summary
* Travel advance
* Final payout/recovery amount

8. Expense Settlement Form
* Used the provided **Excel settlement template**.
* Automatically populated the settlement information and calculated amounts.
* Generated the final **Expense Settlement Form** in the output folder.

# What I deliberately left out

I did not add a database, user login, real Finance payment integration, email sending, or integration with an actual HR/ERP system, gmails api, More hidden edge cases in the Problem. These were kept out because the focus of the assignment was the expense processing and settlement workflow But the process which i made is correct until whatever i made.

# Where it can break

1. The current application uses the provided documents from the data folder. In a production environment, these documents can be fetched automatically through email, storage, HR, or expense-management APIs.
2. Local JSON/file storage is used for the assignment. For production, this can be replaced with a database to persist employees, Travel Requests, expenses, approvals, advances, and settlements.
3. Authentication, role-based access control, Finance payment integration, and HR/ERP integration can be added as part of a production deployment.
4. The current implementation uses Gemini for understanding and extracting information from unstructured documents. Additional schema validation, monitoring, and audit logging can be added for enterprise-scale deployment.
5. The core expense extraction, policy application, validation, settlement calculation, advance adjustment, and settlement-form generation required for this assignment are implemented in the current application.

# Instructions
1) Open root of the project Travel Expense Agent.
2) In root folder run the npm install to install all dependencies.
3) The create .env file and put these values.
```
AI_TRAVEL_EXPENSE_PORT=5000
GEMINI_API_KEY=gemini api key
GEMINI_MODEL=gemini-2.5-flash
```
4) Then run npm run dev or node index.js to run the backend. In http://localhost:5000 backend will run.
5) Then do the cd frontend
6) Then run npm install to install all dependencies.
7) Then create .env file in frontend folder and put these values.
```
VITE_API_BASE_URL=http://localhost:5000/api
```
8) Then run npm run dev to run frontend. In http://localhost:5173 frontend will run.
9) Now everything will get run we can use frontend as Chataniya Employee because login I have not involved till yet.
10) Output of the form by automatically filling is in output folder as the TRQ-2026-0000_Expense_Settlement.xlsx.


# Video Link
https://drive.google.com/file/d/1365vV3Ae5I5GZZawzA1RTwdBaZl-Bcnu/view?usp=sharing

