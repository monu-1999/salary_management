module RequestHelpers
  def json_body
    JSON.parse(response.body)
  end

  def employee_payload(overrides = {})
    {
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      jobTitle: "Software Engineer",
      department: "Engineering",
      country: "United States",
      salary: 120_000,
      currency: "usd",
      employmentType: "Full-time",
      status: "Active",
      hireDate: "2020-01-15"
    }.merge(overrides)
  end

  def employee_record_attributes(overrides = {})
    payload = employee_payload(overrides)

    {
      full_name: payload.fetch(:fullName),
      email: payload.fetch(:email),
      job_title: payload.fetch(:jobTitle),
      department: payload.fetch(:department),
      country: payload.fetch(:country),
      salary: payload.fetch(:salary),
      currency: payload.fetch(:currency),
      employment_type: payload.fetch(:employmentType),
      status: payload.fetch(:status),
      hire_date: payload.fetch(:hireDate)
    }
  end
end

RSpec.configure do |config|
  config.include RequestHelpers, type: :request
end
