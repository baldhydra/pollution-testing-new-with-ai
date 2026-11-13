import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, isWithinInterval, addDays, format, startOfDay, endOfDay } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VEHICLE_DATA_FILE = path.join(__dirname, '..', 'data', 'vehicle_data.json');

/**
 * Parse a date string in dd-MM-yyyy format to a Date object
 */
function parseStoredDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  try {
    const d = parse(dateStr.trim(), 'dd-MM-yyyy', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Parse a YYYY-MM-DD date string to a Date object
 */
function parseISODate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  try {
    const d = parse(dateStr.trim(), 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Read vehicle data, optionally filtered by user for non-admin
 */
function readVehicleData(username, isAdmin) {
  const data = fs.readJsonSync(VEHICLE_DATA_FILE);
  if (isAdmin) return data;
  return data.filter(v => v.username === username);
}

/**
 * Filter records within a date range based on dateOfEntry
 */
function filterByDateRange(records, startDate, endDate) {
  return records.filter(record => {
    const entryDate = parseStoredDate(record.dateOfEntry);
    if (!entryDate) return false;
    return isWithinInterval(entryDate, {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    });
  });
}

// ============================================================
// TOOL IMPLEMENTATIONS
// ============================================================

/**
 * Tool: count_certificates
 */
export function countCertificates({ start_date, end_date }, user) {
  const startDate = parseISODate(start_date);
  const endDate = parseISODate(end_date);

  if (!startDate || !endDate) {
    return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  if (startDate > endDate) {
    return { success: false, error: 'start_date must be before end_date.' };
  }

  const allRecords = readVehicleData(user.username, user.isAdmin);
  const filtered = filterByDateRange(allRecords, startDate, endDate);

  return {
    success: true,
    data: {
      count: filtered.length,
      start_date: format(startDate, 'dd-MM-yyyy'),
      end_date: format(endDate, 'dd-MM-yyyy')
    }
  };
}

/**
 * Tool: get_financial_statistics
 * Calculates revenue / profit / fee collections
 */
export function getFinancialStatistics({ start_date, end_date }, user) {
  const startDate = parseISODate(start_date);
  const endDate = parseISODate(end_date);

  if (!startDate || !endDate) {
    return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  if (startDate > endDate) {
    return { success: false, error: 'start_date must be before end_date.' };
  }

  const allRecords = readVehicleData(user.username, user.isAdmin);
  const filtered = filterByDateRange(allRecords, startDate, endDate);

  let totalRevenue = 0;
  const byVehicleType = {};
  const byFuelType = {};

  filtered.forEach(record => {
    const amt = parseFloat(record.amount || 0);
    const validAmt = isNaN(amt) ? 0 : amt;
    totalRevenue += validAmt;

    const vtype = record.vehicleType || 'Unknown';
    byVehicleType[vtype] = (byVehicleType[vtype] || 0) + validAmt;

    const fuel = record.fuelType || 'Unknown';
    byFuelType[fuel] = (byFuelType[fuel] || 0) + validAmt;
  });

  const count = filtered.length;
  const averageFee = count > 0 ? Math.round((totalRevenue / count) * 100) / 100 : 0;

  return {
    success: true,
    data: {
      start_date: format(startDate, 'dd-MM-yyyy'),
      end_date: format(endDate, 'dd-MM-yyyy'),
      total_revenue: totalRevenue,
      currency: 'INR (₹)',
      vehicles_tested: count,
      average_fee_per_vehicle: averageFee,
      revenue_by_vehicle_type: Object.entries(byVehicleType).map(([type, amount]) => ({ type, amount })),
      revenue_by_fuel_type: Object.entries(byFuelType).map(([fuel, amount]) => ({ fuel, amount }))
    }
  };
}

/**
 * Tool: get_expiring_certificates
 */
export function getExpiringCertificates({ number_of_days }, user) {
  const days = parseInt(number_of_days, 10);
  if (isNaN(days) || days < 0) {
    return { success: false, error: 'number_of_days must be a non-negative number.' };
  }

  const today = startOfDay(new Date());
  const futureDate = endOfDay(addDays(today, days));

  const allRecords = readVehicleData(user.username, user.isAdmin);
  const expiring = allRecords.filter(record => {
    const expiryDate = parseStoredDate(record.expiryDate);
    if (!expiryDate) return false;
    return isWithinInterval(expiryDate, { start: today, end: futureDate });
  });

  const expired = allRecords.filter(record => {
    const expiryDate = parseStoredDate(record.expiryDate);
    if (!expiryDate) return false;
    return expiryDate < today;
  });

  return {
    success: true,
    data: {
      expiring_within_days: days,
      expiring_count: expiring.length,
      already_expired_count: expired.length,
      expiring_certificates: expiring.map(r => ({
        vehicleNumber: r.vehicleNumber,
        vehicleType: r.vehicleType,
        fuelType: r.fuelType,
        expiryDate: r.expiryDate,
        dateOfEntry: r.dateOfEntry,
        mobile: r.mobile
      })),
      expired_certificates: expired.map(r => ({
        vehicleNumber: r.vehicleNumber,
        vehicleType: r.vehicleType,
        fuelType: r.fuelType,
        expiryDate: r.expiryDate,
        dateOfEntry: r.dateOfEntry,
        mobile: r.mobile
      }))
    }
  };
}

/**
 * Tool: search_vehicle
 */
export function searchVehicle({ registration_number }, user) {
  if (!registration_number || registration_number.trim().length === 0) {
    return { success: false, error: 'registration_number is required.' };
  }

  const searchTerm = registration_number.trim().toLowerCase();
  const allRecords = readVehicleData(user.username, user.isAdmin);
  const matches = allRecords.filter(r =>
    r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(searchTerm)
  );

  return {
    success: true,
    data: {
      search_term: registration_number,
      result_count: matches.length,
      vehicles: matches.map(r => ({
        vehicleNumber: r.vehicleNumber,
        vehicleType: r.vehicleType,
        fuelType: r.fuelType,
        amount: r.amount,
        dateOfEntry: r.dateOfEntry,
        validity: r.validity,
        expiryDate: r.expiryDate,
        mobile: r.mobile
      }))
    }
  };
}

/**
 * Tool: get_vehicle_details
 */
export function getVehicleDetails({ registration_number }, user) {
  if (!registration_number || registration_number.trim().length === 0) {
    return { success: false, error: 'registration_number is required.' };
  }

  const searchTerm = registration_number.trim().toLowerCase();
  const allRecords = readVehicleData(user.username, user.isAdmin);
  const matches = allRecords.filter(r =>
    r.vehicleNumber && r.vehicleNumber.toLowerCase() === searchTerm
  );

  if (matches.length === 0) {
    return {
      success: true,
      data: {
        registration_number,
        found: false,
        message: `No vehicle found with registration number "${registration_number}".`
      }
    };
  }

  const today = new Date();
  const certificates = matches.map(r => {
    const expiryDate = parseStoredDate(r.expiryDate);
    return {
      vehicleNumber: r.vehicleNumber,
      vehicleType: r.vehicleType,
      fuelType: r.fuelType,
      amount: r.amount,
      dateOfEntry: r.dateOfEntry,
      validity: r.validity,
      expiryDate: r.expiryDate,
      mobile: r.mobile,
      status: expiryDate && expiryDate < today ? 'Expired' : 'Active'
    };
  });

  return {
    success: true,
    data: {
      registration_number,
      found: true,
      total_certificates: certificates.length,
      certificates
    }
  };
}

/**
 * Tool: get_certificate_statistics
 */
export function getCertificateStatistics({ start_date, end_date, grouping }, user) {
  const startDate = parseISODate(start_date);
  const endDate = parseISODate(end_date);

  if (!startDate || !endDate) {
    return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  if (!['daily', 'monthly', 'yearly'].includes(grouping)) {
    return { success: false, error: 'Grouping must be "daily", "monthly", or "yearly".' };
  }

  const allRecords = readVehicleData(user.username, user.isAdmin);
  const filtered = filterByDateRange(allRecords, startDate, endDate);

  const groups = {};
  filtered.forEach(record => {
    const entryDate = parseStoredDate(record.dateOfEntry);
    if (!entryDate) return;

    let key;
    switch (grouping) {
      case 'daily':
        key = format(entryDate, 'yyyy-MM-dd');
        break;
      case 'monthly':
        key = format(entryDate, 'yyyy-MM');
        break;
      case 'yearly':
        key = format(entryDate, 'yyyy');
        break;
    }
    groups[key] = (groups[key] || 0) + 1;
  });

  const sortedGroups = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));

  const totalCount = filtered.length;
  const periodCount = sortedGroups.length;
  const avgPerPeriod = periodCount > 0 ? Math.round((totalCount / periodCount) * 100) / 100 : 0;

  return {
    success: true,
    data: {
      start_date: format(startDate, 'dd-MM-yyyy'),
      end_date: format(endDate, 'dd-MM-yyyy'),
      grouping,
      total_certificates: totalCount,
      number_of_periods: periodCount,
      average_per_period: avgPerPeriod,
      statistics: sortedGroups
    }
  };
}

/**
 * Tool: get_vehicle_breakdown
 */
export function getVehicleBreakdown({ group_by, start_date, end_date }, user) {
  if (!['fuelType', 'vehicleType'].includes(group_by)) {
    return { success: false, error: 'group_by must be "fuelType" or "vehicleType".' };
  }

  const allRecords = readVehicleData(user.username, user.isAdmin);

  let records = allRecords;
  if (start_date && end_date) {
    const startDate = parseISODate(start_date);
    const endDate = parseISODate(end_date);
    if (startDate && endDate) {
      records = filterByDateRange(records, startDate, endDate);
    }
  }

  const groups = {};
  records.forEach(record => {
    const key = record[group_by] || 'Unknown';
    groups[key] = (groups[key] || 0) + 1;
  });

  const breakdown = Object.entries(groups)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => ({ category, count }));

  return {
    success: true,
    data: {
      group_by,
      total_records: records.length,
      categories: breakdown.length,
      breakdown
    }
  };
}

/**
 * Execute tool dispatcher
 */
export function executeTool(toolName, args, user) {
  const tools = {
    count_certificates: countCertificates,
    get_financial_statistics: getFinancialStatistics,
    get_expiring_certificates: getExpiringCertificates,
    search_vehicle: searchVehicle,
    get_vehicle_details: getVehicleDetails,
    get_certificate_statistics: getCertificateStatistics,
    get_vehicle_breakdown: getVehicleBreakdown
  };

  const toolFn = tools[toolName];
  if (!toolFn) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    return toolFn(args, user);
  } catch (error) {
    console.error(`Tool execution error [${toolName}]:`, error);
    return { success: false, error: `Tool execution failed: ${error.message}` };
  }
}
