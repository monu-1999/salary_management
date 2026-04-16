require "rails_helper"

describe "API Insights", type: :request do
  before do
    Employee.create!(
      employee_record_attributes(
        email: "us-se1@example.com",
        fullName: "US One",
        country: "United States",
        jobTitle: "Software Engineer",
        salary: 100_000,
        currency: "USD",
        employmentType: "Full-time"
      )
    )
    Employee.create!(
      employee_record_attributes(
        email: "us-se2@example.com",
        fullName: "US Two",
        country: "United States",
        jobTitle: "Software Engineer",
        salary: 140_000,
        currency: "USD",
        employmentType: "Contract"
      )
    )
    Employee.create!(
      employee_record_attributes(
        email: "in-pm@example.com",
        fullName: "IN PM",
        country: "India",
        jobTitle: "Product Manager",
        salary: 90_000,
        currency: "INR",
        employmentType: "Full-time"
      )
    )
  end

  describe "GET /api/insights/country" do
    it "returns aggregate salary metrics" do
      get "/api/insights/country", params: { country: "United States" }

      expect(response).to have_http_status(:ok)
      payload = json_body
      expect(payload.fetch("country")).to eq("United States")
      expect(payload.fetch("headcount")).to eq(2)
      expect(payload.fetch("minSalary")).to eq(100_000)
      expect(payload.fetch("maxSalary")).to eq(140_000)
      expect(payload.fetch("averageSalary")).to eq(120_000.0)
      expect(payload.fetch("topJobTitles").first.fetch("jobTitle")).to eq("Software Engineer")
    end

    it "returns validation error for short country param" do
      get "/api/insights/country", params: { country: "U" }

      expect(response).to have_http_status(:bad_request)
      expect(json_body.fetch("error")).to eq("Validation failed")
    end
  end

  describe "GET /api/insights/job-title" do
    it "returns job title metrics for country" do
      get "/api/insights/job-title", params: { country: "United States", jobTitle: "Software Engineer" }

      expect(response).to have_http_status(:ok)
      payload = json_body
      expect(payload.fetch("headcount")).to eq(2)
      expect(payload.fetch("averageSalary")).to eq(120_000.0)
      expect(payload.fetch("minSalary")).to eq(100_000)
      expect(payload.fetch("maxSalary")).to eq(140_000)
    end
  end

  describe "GET /api/insights/options" do
    it "returns countries and country-filtered job titles" do
      get "/api/insights/options", params: { country: "India" }

      expect(response).to have_http_status(:ok)
      payload = json_body
      expect(payload.fetch("countries")).to include("India", "United States")
      expect(payload.fetch("jobTitles")).to eq(["Product Manager"])
    end
  end
end
