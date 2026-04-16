require "rails_helper"

describe "API Employees", type: :request do
  describe "GET /api/employees" do
    it "returns paginated employees with filters" do
      Employee.create!(employee_record_attributes(email: "a@example.com", fullName: "Alice", country: "India", jobTitle: "Data Analyst"))
      Employee.create!(employee_record_attributes(email: "b@example.com", fullName: "Bob", country: "India", jobTitle: "Data Analyst"))
      Employee.create!(employee_record_attributes(email: "c@example.com", fullName: "Carla", country: "Germany", jobTitle: "Product Manager"))

      get "/api/employees", params: { country: "India", page: 1, pageSize: 1 }

      expect(response).to have_http_status(:ok)
      payload = json_body
      expect(payload.fetch("data").length).to eq(1)
      expect(payload.dig("pagination", "total")).to eq(2)
      expect(payload.dig("pagination", "totalPages")).to eq(2)
      expect(payload.fetch("data").first.fetch("country")).to eq("India")
    end

    it "returns validation error for invalid page" do
      get "/api/employees", params: { page: 0 }

      expect(response).to have_http_status(:bad_request)
      expect(json_body.fetch("error")).to eq("Validation failed")
      expect(json_body.fetch("issues").first.fetch("path")).to eq(["page"])
    end
  end

  describe "POST /api/employees" do
    it "creates employee and normalizes email/currency" do
      post "/api/employees", params: employee_payload(email: "NEW.USER@Example.com", currency: "usd")

      expect(response).to have_http_status(:created)
      payload = json_body
      expect(payload.fetch("email")).to eq("new.user@example.com")
      expect(payload.fetch("currency")).to eq("USD")
    end

    it "returns conflict for duplicate email" do
      Employee.create!(employee_record_attributes(email: "dup@example.com"))

      post "/api/employees", params: employee_payload(email: "dup@example.com")

      expect(response).to have_http_status(:conflict)
      expect(json_body.fetch("error")).to eq("Email already exists")
    end
  end

  describe "PUT /api/employees/:id" do
    it "updates an employee" do
      employee = Employee.create!(employee_record_attributes(email: "edit@example.com", fullName: "Old Name"))

      put "/api/employees/#{employee.id}", params: employee_payload(fullName: "Updated Name", email: "edit@example.com")

      expect(response).to have_http_status(:ok)
      expect(json_body.fetch("fullName")).to eq("Updated Name")
      expect(employee.reload.full_name).to eq("Updated Name")
    end

    it "returns 400 for invalid id" do
      put "/api/employees/0", params: employee_payload

      expect(response).to have_http_status(:bad_request)
      expect(json_body.fetch("error")).to eq("Invalid employee id")
    end
  end

  describe "DELETE /api/employees/:id" do
    it "deletes an employee" do
      employee = Employee.create!(employee_record_attributes(email: "delete@example.com"))

      delete "/api/employees/#{employee.id}"

      expect(response).to have_http_status(:no_content)
      expect(Employee.find_by(id: employee.id)).to be_nil
    end
  end
end
