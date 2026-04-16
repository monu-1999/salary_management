class Api::EmployeesController < ApplicationController
  rescue_from ActiveRecord::RecordNotUnique, with: :render_email_conflict

  def index
    page = parse_positive_integer(params[:page], default: 1, field: "page")
    return if performed?

    page_size = parse_positive_integer(params[:pageSize], default: 20, field: "pageSize")
    return if performed?

    if page_size > 200
      return render_validation_failed([
        {
          path: ["pageSize"],
          message: "must be less than or equal to 200"
        }
      ])
    end

    employees = Employee.all

    search = params[:search].to_s.strip
    unless search.empty?
      search_term = "%#{search.gsub(/\s+/, "%")}%"
      employees = employees.where(
        "(full_name LIKE :term OR email LIKE :term OR department LIKE :term OR job_title LIKE :term)",
        term: search_term
      )
    end

    country = params[:country].to_s.strip
    employees = employees.where(country: country) unless country.empty?

    job_title = params[:jobTitle].to_s.strip
    employees = employees.where(job_title: job_title) unless job_title.empty?

    total = employees.count
    total_pages = total.zero? ? 0 : (total.to_f / page_size).ceil

    paged_employees = employees
      .order(id: :desc)
      .limit(page_size)
      .offset((page - 1) * page_size)

    render json: {
      data: paged_employees.map(&:as_api_json),
      pagination: {
        page: page,
        pageSize: page_size,
        total: total,
        totalPages: total_pages
      }
    }
  end

  def show
    employee_id = parse_employee_id
    return if performed?

    employee = Employee.find_by(id: employee_id)
    return render_not_found("Employee not found") unless employee

    render json: employee.as_api_json
  end

  def create
    employee = Employee.new(employee_params)

    if employee.save
      render json: employee.as_api_json, status: :created
      return
    end

    if employee.errors.of_kind?(:email, :taken)
      render_email_conflict
      return
    end

    render_model_validation_errors(employee)
  end

  def update
    employee_id = parse_employee_id
    return if performed?

    employee = Employee.find_by(id: employee_id)
    return render_not_found("Employee not found") unless employee

    if employee.update(employee_params)
      render json: employee.as_api_json
      return
    end

    if employee.errors.of_kind?(:email, :taken)
      render_email_conflict
      return
    end

    render_model_validation_errors(employee)
  end

  def destroy
    employee_id = parse_employee_id
    return if performed?

    employee = Employee.find_by(id: employee_id)
    return render_not_found("Employee not found") unless employee

    employee.destroy
    head :no_content
  end

  private

  def parse_employee_id
    employee_id = Integer(params[:id], exception: false)
    return employee_id if employee_id && employee_id.positive?

    render json: { error: "Invalid employee id" }, status: :bad_request
    nil
  end

  def parse_positive_integer(value, default:, field:)
    return default if value.blank?

    parsed = Integer(value, exception: false)
    return parsed if parsed && parsed.positive?

    render_validation_failed([
      {
        path: [field],
        message: "must be a positive integer"
      }
    ])
    nil
  end

  def employee_params
    payload = params.permit(
      :fullName,
      :email,
      :jobTitle,
      :department,
      :country,
      :salary,
      :currency,
      :employmentType,
      :status,
      :hireDate
    )

    {
      full_name: payload[:fullName],
      email: payload[:email],
      job_title: payload[:jobTitle],
      department: payload[:department],
      country: payload[:country],
      salary: payload[:salary],
      currency: payload[:currency],
      employment_type: payload[:employmentType],
      status: payload[:status],
      hire_date: payload[:hireDate]
    }
  end

  def render_model_validation_errors(employee)
    issues = employee.errors.map do |error|
      {
        path: [error.attribute.to_s.camelize(:lower)],
        message: error.message
      }
    end

    render_validation_failed(issues)
  end

  def render_email_conflict
    render json: { error: "Email already exists" }, status: :conflict
  end
end
