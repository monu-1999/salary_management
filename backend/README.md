# Rails Backend

Rails API service for salary management.

## Run Locally
```bash
bundle install
bundle exec rails s
```

Default port is `3001` (configured in `config/puma.rb`).

## Database
- Uses shared SQLite database file: `../sqlite/salary.db`
- Mapping is configured in `config/database.yml`

## Primary Endpoints
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/:id`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/insights/country`
- `GET /api/insights/job-title`
- `GET /api/insights/options`
