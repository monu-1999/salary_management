Rails.application.routes.draw do
  namespace :api do
    resources :employees, only: [:index, :show, :create, :update, :destroy]
    get "insights/country", to: "insights#country"
    get "insights/job-title", to: "insights#job_title"
    get "insights/options", to: "insights#options"
  end
end
