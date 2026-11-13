/**
 * Tool definitions for the AI agent.
 * Format follows the OpenAI-compatible function calling schema supported by Ollama.
 */

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'count_certificates',
      description: 'Count the number of pollution certificates issued within a specific date range. Use this when the user asks how many vehicles were tested or how many certificates were issued in a time period, specific month, or between two dates.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (e.g., 2026-08-01).'
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (e.g., 2026-08-31).'
          }
        },
        required: ['start_date', 'end_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_statistics',
      description: 'Calculate financial statistics including total revenue, profit, fee collection, vehicle count, and average fees collected from certificates in a date range (e.g. for a specific year like last year, or a specific month). Use whenever the user asks about profit, revenue, earnings, collections, income, or fees.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (e.g. 2025-01-01 for last year start, or 2026-08-01 for August).'
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (e.g. 2025-12-31 for last year end, or 2026-08-31 for August).'
          }
        },
        required: ['start_date', 'end_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_expiring_certificates',
      description: 'Retrieve pollution certificates that are expiring within a specified number of days from today, or certificates that have already expired. Use when the user asks about expiring or expired certificates.',
      parameters: {
        type: 'object',
        properties: {
          number_of_days: {
            type: 'number',
            description: 'Number of days from today to check for expiring certificates. For example, 30 for certificates expiring in the next 30 days.'
          }
        },
        required: ['number_of_days']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_vehicle',
      description: 'Search for vehicles by registration number (full or partial match). Use when looking up a vehicle or checking if a vehicle exists.',
      parameters: {
        type: 'object',
        properties: {
          registration_number: {
            type: 'string',
            description: 'Full or partial vehicle registration number to search for (case-insensitive).'
          }
        },
        required: ['registration_number']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_vehicle_details',
      description: 'Retrieve complete details and certificate records for a specific vehicle by its exact registration number.',
      parameters: {
        type: 'object',
        properties: {
          registration_number: {
            type: 'string',
            description: 'The exact vehicle registration number.'
          }
        },
        required: ['registration_number']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_certificate_statistics',
      description: 'Generate certificate issuance statistics grouped by time period (daily, monthly, or yearly). Use for questions about trends, monthly distribution, or issuance patterns over time.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format.'
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format.'
          },
          grouping: {
            type: 'string',
            enum: ['daily', 'monthly', 'yearly'],
            description: 'How to group statistics: daily, monthly, or yearly.'
          }
        },
        required: ['start_date', 'end_date', 'grouping']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_vehicle_breakdown',
      description: 'Generate vehicle statistics grouped by fuel type or vehicle type (e.g., Petrol vs Diesel, Car vs Bike vs Truck).',
      parameters: {
        type: 'object',
        properties: {
          group_by: {
            type: 'string',
            enum: ['fuelType', 'vehicleType'],
            description: 'The attribute to group vehicles by: "fuelType" or "vehicleType".'
          },
          start_date: {
            type: 'string',
            description: 'Optional start date filter in YYYY-MM-DD format.'
          },
          end_date: {
            type: 'string',
            description: 'Optional end date filter in YYYY-MM-DD format.'
          }
        },
        required: ['group_by']
      }
    }
  }
];

export const validToolNames = new Set(
  toolDefinitions.map(t => t.function.name)
);
