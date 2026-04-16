ENV["RAILS_ENV"] ||= "test"
require File.expand_path("../config/environment", __dir__)
abort("The Rails environment is running in production mode!") if Rails.env.production?

require "rspec/rails"

begin
  ActiveRecord::Schema.define do
    create_table :employees, force: true do |table|
      table.string :full_name, null: false
      table.string :email, null: false
      table.string :job_title, null: false
      table.string :department, null: false
      table.string :country, null: false
      table.integer :salary, null: false
      table.string :currency, null: false
      table.string :employment_type, null: false
      table.string :status, null: false
      table.string :hire_date, null: false
      table.string :created_at, null: false
      table.string :updated_at, null: false
    end

    add_index :employees, :email, unique: true
    add_index :employees, :country
    add_index :employees, [:country, :job_title], name: "idx_employees_country_job"
    add_index :employees, :job_title
    add_index :employees, :department
  end
rescue StandardError => error
  warn "[rspec setup] failed to prepare employees schema: #{error.message}"
end

Dir[Rails.root.join("spec/support/**/*.rb")].sort.each { |file| require file }

RSpec.configure do |config|
  config.use_transactional_fixtures = true

  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  config.before do
    Employee.delete_all
  end
end
