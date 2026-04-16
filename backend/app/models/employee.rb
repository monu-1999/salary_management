require "date"
require "time"

class Employee < ApplicationRecord
  self.table_name = "employees"
  self.record_timestamps = false

  EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"].freeze
  STATUSES = ["Active", "On Leave", "Resigned"].freeze
  ISO_DATE_REGEX = /\A\d{4}-\d{2}-\d{2}\z/

  before_validation :normalize_fields
  before_create :set_initial_timestamps
  before_save :set_updated_timestamp

  validates :full_name, presence: true, length: { minimum: 2, maximum: 120 }
  validates :email, presence: true, length: { maximum: 120 }, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: true
  validates :job_title, presence: true, length: { minimum: 2, maximum: 80 }
  validates :department, presence: true, length: { minimum: 2, maximum: 80 }
  validates :country, presence: true, length: { minimum: 2, maximum: 80 }
  validates :salary, presence: true, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 5_000_000 }
  validates :currency, presence: true, length: { is: 3 }
  validates :employment_type, presence: true, inclusion: { in: EMPLOYMENT_TYPES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :validate_hire_date

  def as_api_json
    {
      id: id,
      fullName: full_name,
      email: email,
      jobTitle: job_title,
      department: department,
      country: country,
      salary: salary,
      currency: currency,
      employmentType: employment_type,
      status: status,
      hireDate: hire_date,
      createdAt: created_at,
      updatedAt: updated_at
    }
  end

  private

  def normalize_fields
    self.full_name = full_name.to_s.strip
    self.email = email.to_s.strip.downcase
    self.job_title = job_title.to_s.strip
    self.department = department.to_s.strip
    self.country = country.to_s.strip
    self.currency = currency.to_s.strip.upcase
    self.hire_date = hire_date.to_s.strip
  end

  def validate_hire_date
    return errors.add(:hire_date, "must be a valid YYYY-MM-DD date") if hire_date.blank?
    return errors.add(:hire_date, "must be a valid YYYY-MM-DD date") unless ISO_DATE_REGEX.match?(hire_date)

    Date.iso8601(hire_date)
  rescue ArgumentError
    errors.add(:hire_date, "must be a valid YYYY-MM-DD date")
  end

  def set_initial_timestamps
    now = Time.now.utc.iso8601(3)
    self.created_at = now if created_at.blank?
    self.updated_at = now if updated_at.blank?
  end

  def set_updated_timestamp
    self.updated_at = Time.now.utc.iso8601(3)
  end
end
