class Api::InsightsController < ApplicationController
  def country
    country = params[:country].to_s.strip
    return render_required_param("country") if country.length < 2

    scope = Employee.where(country: country)
    headcount = scope.count
    return render_not_found("No employees found for this country") if headcount.zero?

    salaries = scope.order(salary: :asc).pluck(:salary)

    top_job_titles = scope
      .group(:job_title)
      .pluck(:job_title, Arel.sql("COUNT(*)"), Arel.sql("AVG(salary)"))
      .map do |job_title, count, average_salary|
        {
          jobTitle: job_title,
          headcount: count.to_i,
          averageSalary: average_salary.to_f
        }
      end
      .sort_by { |row| [-row[:headcount], -row[:averageSalary]] }
      .first(5)

    employment_type_distribution = scope
      .group(:employment_type)
      .count
      .map { |employment_type, count| { employmentType: employment_type, count: count } }
      .sort_by { |row| -row[:count] }

    dominant_currency = scope
      .group(:currency)
      .count
      .max_by { |_currency, count| count }
      &.first || "USD"

    render json: {
      country: country,
      currency: dominant_currency,
      headcount: headcount,
      minSalary: salaries.first.to_i,
      maxSalary: salaries.last.to_i,
      averageSalary: scope.average(:salary).to_f,
      medianSalary: percentile(salaries, 0.5),
      p90Salary: percentile(salaries, 0.9),
      totalPayroll: scope.sum(:salary),
      topJobTitles: top_job_titles,
      employmentTypeDistribution: employment_type_distribution
    }
  end

  def job_title
    country = params[:country].to_s.strip
    job_title = params[:jobTitle].to_s.strip

    return render_required_param("country") if country.length < 2
    return render_required_param("jobTitle") if job_title.length < 2

    scope = Employee.where(country: country, job_title: job_title)
    headcount = scope.count

    if headcount.zero?
      return render_not_found("No employees found for this job title in the given country")
    end

    dominant_currency = scope
      .group(:currency)
      .count
      .max_by { |_currency, count| count }
      &.first || "USD"

    render json: {
      country: country,
      jobTitle: job_title,
      currency: dominant_currency,
      headcount: headcount,
      averageSalary: scope.average(:salary).to_f,
      minSalary: scope.minimum(:salary).to_i,
      maxSalary: scope.maximum(:salary).to_i
    }
  end

  def options
    country = params[:country].to_s.strip
    countries = Employee.distinct.order(:country).pluck(:country)

    job_title_scope = country.empty? ? Employee.all : Employee.where(country: country)
    job_titles = job_title_scope.distinct.order(:job_title).pluck(:job_title)

    render json: {
      countries: countries,
      jobTitles: job_titles
    }
  end

  private

  def render_required_param(field)
    render_validation_failed([
      {
        path: [field],
        message: "must be at least 2 characters"
      }
    ])
  end

  def percentile(sorted_values, value)
    return 0 if sorted_values.empty?
    return sorted_values.first.to_f if sorted_values.length == 1

    position = (sorted_values.length - 1) * value
    lower_index = position.floor
    upper_index = position.ceil
    weight = position - lower_index

    if lower_index == upper_index
      sorted_values[lower_index].to_f
    else
      (sorted_values[lower_index] * (1 - weight)) + (sorted_values[upper_index] * weight)
    end
  end
end
