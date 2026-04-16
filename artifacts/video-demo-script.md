# Video Demo Script (Suggested)

1. Start with quick project intro and goals.
2. Run setup:
   - `npm install`
   - `npm run seed`
   - Terminal 1: `cd backend && bundle install && bundle exec rails s`
   - Terminal 2: `npm run dev -- --port 3000`
3. Open app and show tab navigation:
   - Employee List (default)
   - Employee Form
   - Salary Insights
   - Employee Snapshot
4. In Employee List, demonstrate pagination and search/filter.
5. Click **Add Employee**, show automatic switch to Employee Form tab, and create record.
6. Click **Edit** on a row, show prefilled form in Employee Form tab, and update record.
7. Click **View** on a row, show Employee Snapshot tab details.
8. Demonstrate delete flow from Employee List.
9. Open Salary Insights tab:
   - Country metrics (min/max/avg/median/p90)
   - Job title metrics in selected country
   - Top titles and employment type distribution
10. Show direct Rails endpoint in browser/curl:
    - `http://127.0.0.1:3001/api/employees?page=1&pageSize=2`
11. Run tests with `npm test`.
12. Close with architecture and trade-off summary from `artifacts/`.
