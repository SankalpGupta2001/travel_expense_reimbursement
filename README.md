# Travel Expense Reimbursement

# My understanding of the problem
The main goal is to automate the travel expense settlement process. The application should read the Travel Request, employee details, emails, and receipts, identify the expenses related to the employee, apply the company travel policy, calculate the final reimbursement, and generate the Expense Settlement Form.
I also understood that not every expense should be reimbursed. For example, company-paid flights should only be recorded for reference, while expenses such as laundry and minibar should be marked as non-reimbursable. Some cases, such as business entertainment without the required approval or unclear document information, should be sent for human review.

# Assumptions
1) In data folder all documents are there. In production we can fetch all emails and receipt by apis.
2) Duplicate transactions should be counted only once.
3) Expenses belonging to another employee should not be included in the claim.
4) Company-paid expenses are not added to the employee reimbursement.
5) The travel advance is deducted from the final eligible claim.
6) If the documents are conflicting or a policy decision cannot be made safely, I mark the claim as Pending Human Review instead of guessing.
7) Local storage is used for the demo instead of a database.

# What I built

I built the application using Node.js, Express.js, React, and Gemini AI. The backend extracts data from emails, receipts and the Travel Request, sends the information to Gemini, and gets the result in a fixed JSON structure. The application then shows the employee details, travel details, expenses, approval workflow and settlement amount. I also added the policy checks for lodging, meals, business entertainment, non-reimbursable expenses, duplicate expenses, employee/company-paid expenses and travel advance. Finally, the application generates the Expense Settlement Form using the provided Excel template.

# What I deliberately left out

I did not add a database, user login/role management, real Finance payment integration, email sending, or integration with an actual HR/ERP system, More hidden edge cases in the Problem. These were kept out because the focus of the assignment was the expense processing and settlement workflow But the process which i made is correct until whatever i made.

# Where it can break

1) The biggest limitation is document quality. If a receipt is missing, unreadable, duplicated in an unclear way, or contains conflicting amounts, the AI may not have enough information to make a safe decision. In such cases, the application marks the claim for Pending Human Review. For production use, I would add stronger validation around AI output, database storage, audit logs, authentication/authorization, and deterministic policy calculations outside the LLM.

2) It can break if some deep changes done in emails or receipts as I used prompt for now so may can break for some cases but for that we can improve prompt that may take some more time in Prompting.

# Instructions
1) Open root of the project Travel Expense Agent.
2) In root folder run the npm install to install all dependencies.
3) The create .env file and put these values.
```
AI_TRAVEL_EXPENSE_PORT=5000
GEMINI_API_KEY=gemini api key
GEMINI_MODEL=gemini-2.5-flash
```
4) Then run npm run dev to run the backend. In http://localhost:5000 backend will run.
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
https://drive.google.com/file/d/1SvsbNqvnfDe9TMQEVP1xcaHDil0YVopg/view?usp=sharing


