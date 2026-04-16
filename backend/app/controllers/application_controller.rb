class ApplicationController < ActionController::API
  private

  def render_validation_failed(issues)
    render json: {
      error: "Validation failed",
      issues: issues,
    }, status: :bad_request
  end

  def render_not_found(message)
    render json: { error: message }, status: :not_found
  end
end
