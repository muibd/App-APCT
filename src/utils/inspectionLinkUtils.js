import {
  isMepContext,
  isInvestorLeadOrDeputy,
  isInvestorLeadOnly,
  isSupervisorLeadOrDeputy,
  isSupervisorLeadOnly
} from '../data/mockData.js';

/**
 * Helpers for safely linking inspection requests (Phiếu yêu cầu / IR)
 * and inspection reports (Biên bản nghiệm thu / MI, WA).
 *
 * Strict invariant: NEVER link records by shared generic document codes
 * such as 'IR', 'MI', 'WA', or same-day projectCategoryCode
 * (e.g. '2203/IR/121126-01.01' vs '2203/WA/121126-01.01').
 */

export function normalizeInspectionTaskText(value) {
  return String(value || '')
    .replace(/^(?:nghiệm\s+thu\s+vật\s+liệu\s+đầu\s+vào\s*:\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function inferInspectionType(record) {
  if (!record || typeof record !== 'object') return '';

  const rawType = String(record.inspectionType || '').trim().toUpperCase();
  if (rawType === 'MATERIAL' || rawType === 'WORK') return rawType;

  const template = String(record.reportTemplate || '').trim().toUpperCase();
  if (template === 'FORM_12') return 'MATERIAL';
  if (template === 'CONSTRUCTION_WORK') return 'WORK';

  const docCode = String(
    record.reportDocTypeCode || record.docTypeCode || record.reportNumber || ''
  ).trim().toUpperCase();
  if (docCode === 'MI') return 'MATERIAL';
  if (docCode === 'WA') return 'WORK';

  const refCode = String(
    record.projectCategoryCode || record.referenceDocNumber || ''
  ).toUpperCase();
  if (refCode.includes('/MI/')) return 'MATERIAL';
  if (refCode.includes('/WA/')) return 'WORK';

  return '';
}

export function isLegacyUniqueDocNumber(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return /\d+\s*\/\s*(PYC|BBNT)/i.test(text);
}

export function doesLegacyReportMatchRequestNumber(requestNumber, reportNumber) {
  const reqNum = String(requestNumber || '').trim();
  const repNum = String(reportNumber || '').trim();
  if (!isLegacyUniqueDocNumber(reqNum) || !isLegacyUniqueDocNumber(repNum)) {
    return false;
  }
  return (
    repNum.replace('BBNT-APG', 'PYC').replace('BBNT-VL', 'PYC') === reqNum ||
    repNum.replace('BBNT', 'PYC') === reqNum
  );
}

export function areInspectionRecordsCompatible(req, rep) {
  if (!req || !rep) return false;

  const reqType = inferInspectionType(req);
  const repType = inferInspectionType(rep);
  if (reqType && repType && reqType !== repType) {
    return false;
  }

  const reqMatName = Array.isArray(req.materials) && req.materials.length > 0
    ? req.materials.map(m => m?.name || m?.materialName).filter(Boolean).join(', ')
    : (req.materialDetails?.name || '');
  const repMatName = Array.isArray(rep.materials) && rep.materials.length > 0
    ? rep.materials.map(m => m?.name || m?.materialName).filter(Boolean).join(', ')
    : (rep.materialDetails?.name || '');

  const reqTask = normalizeInspectionTaskText(req.taskContent || reqMatName || req.inspectionObject);
  const repTask = normalizeInspectionTaskText(rep.inspectionObject || repMatName || rep.taskContent);

  if (reqTask && repTask) {
    if (reqTask === repTask) return true;
    if (reqTask.length >= 4 && repTask.length >= 4) {
      if (repTask.includes(reqTask) || reqTask.includes(repTask)) return true;
    }
    return false;
  }

  return true;
}

export function findMatchingReportForRequest(req, reports = [], extraReports = []) {
  if (!req) return null;
  const extras = Array.isArray(extraReports) ? extraReports : (extraReports ? [extraReports] : []);
  const pool = [...extras, ...(Array.isArray(reports) ? reports : [])].filter(Boolean);
  if (pool.length === 0) return null;

  if (req.reportId) {
    const byReportId = pool.find(
      r => r.id === req.reportId && areInspectionRecordsCompatible(req, r)
    );
    if (byReportId) return byReportId;
  }

  if (req.id) {
    const byReqId = pool.find(
      r => r.requestId === req.id && areInspectionRecordsCompatible(req, r)
    );
    if (byReqId) return byReqId;

    const derivedRepId = `rep_${req.id}`;
    const byDerivedId = pool.find(
      r =>
        (r.id === derivedRepId || (r.id === req.id && (!r.requestId || r.requestId === req.id))) &&
        areInspectionRecordsCompatible(req, r)
    );
    if (byDerivedId) return byDerivedId;
  }

  if (isLegacyUniqueDocNumber(req.requestNumber)) {
    const legacyMatch = pool.find(
      r =>
        (!r.requestId || r.requestId === req.id) &&
        doesLegacyReportMatchRequestNumber(req.requestNumber, r.reportNumber) &&
        areInspectionRecordsCompatible(req, r)
    );
    if (legacyMatch) return legacyMatch;
  }

  return null;
}

export function findMatchingRequestForReport(rep, requests = [], preferredReq = null) {
  if (!rep) return null;
  const pool = [
    ...(preferredReq ? [preferredReq] : []),
    ...(Array.isArray(requests) ? requests : [])
  ].filter(Boolean);
  if (pool.length === 0) return null;

  if (rep.requestId) {
    const byRequestId = pool.find(
      r => r.id === rep.requestId && areInspectionRecordsCompatible(r, rep)
    );
    if (byRequestId) return byRequestId;
  }

  if (rep.id) {
    const byReportId = pool.find(
      r => r.reportId === rep.id && areInspectionRecordsCompatible(r, rep)
    );
    if (byReportId) return byReportId;

    if (typeof rep.id === 'string' && rep.id.startsWith('rep_')) {
      const strippedId = rep.id.slice(4);
      const byStrippedId = pool.find(
        r => r.id === strippedId && areInspectionRecordsCompatible(r, rep)
      );
      if (byStrippedId) return byStrippedId;
    }

    const bySameId = pool.find(
      r =>
        r.id === rep.id &&
        (!r.reportId || r.reportId === rep.id) &&
        areInspectionRecordsCompatible(r, rep)
    );
    if (bySameId) return bySameId;
  }

  if (isLegacyUniqueDocNumber(rep.reportNumber)) {
    const legacyMatch = pool.find(
      r =>
        (!r.reportId || r.reportId === rep.id) &&
        doesLegacyReportMatchRequestNumber(r.requestNumber, rep.reportNumber) &&
        areInspectionRecordsCompatible(r, rep)
    );
    if (legacyMatch) return legacyMatch;
  }

  return null;
}

export function getFieldDefaultOfficers(users = []) {
  const list = Array.isArray(users) ? users : [];
  const leadInv = list.find(u => u.role === 'LEAD_INVESTOR') || {
    uid: 'uid_cdt_01',
    fullName: 'Ngô Quý Linh',
    position: 'Trưởng Ban QLDA',
    company: 'Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)'
  };
  const deputyInv =
    list.find(
      u => u.role === 'INVESTOR' && isInvestorLeadOrDeputy(u) && !isInvestorLeadOnly(u)
    ) || {
      uid: 'uid_cdt_02',
      fullName: 'Nguyễn Thành Trung',
      position: 'Phó Ban QLDA',
      company: 'Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)'
    };

  const leadSup = list.find(u => u.role === 'LEAD_SUPERVISOR') || {
    uid: 'uid_tvgs_01',
    fullName: 'Đinh Xuân Thám',
    position: 'Tư vấn giám sát trưởng',
    company: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
  };
  const deputySup =
    list.find(
      u => u.role === 'SUPERVISOR' && isSupervisorLeadOrDeputy(u) && !isSupervisorLeadOnly(u)
    ) || {
      uid: 'uid_tvgs_02',
      fullName: 'Nguyễn Đông Vũ',
      position: 'Phó đoàn TVGS',
      company: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
    };

  return { leadInv, deputyInv, leadSup, deputySup };
}

function isLeadInvName(name) {
  return String(name || '').toLowerCase().includes('linh');
}

function isLeadSupName(name) {
  return String(name || '').toLowerCase().includes('thám');
}

/**
 * Resolve canonical display names for Investor (CĐT) and Supervisor (TVGS)
 * consistently across ReportsListView cards, InspectionReportModal, and report init.
 */
export function resolveInspectionPartyNames({ report = null, request = null, users = [] } = {}) {
  const { deputyInv, deputySup } = getFieldDefaultOfficers(users);
  const reportRecs = Array.isArray(report?.assignedRecipients) ? report.assignedRecipients : [];
  const reqRecs = Array.isArray(request?.assignedRecipients) ? request.assignedRecipients : [];

  const assignedInv =
    reportRecs.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR') ||
    reqRecs.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR') ||
    null;
  const assignedSup =
    reportRecs.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR') ||
    reqRecs.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR') ||
    null;

  const invAttendee = report?.attendees?.investor;
  const supAttendee = report?.attendees?.supervisor;
  const isCompleted = report?.status === 'COMPLETED' || request?.status === 'COMPLETED';
  const isInvSigned = Boolean(invAttendee?.signed || report?.signatures?.investor || isCompleted);
  const isSupSigned = Boolean(
    supAttendee?.signed ||
      report?.signatures?.supervisor ||
      report?.status === 'WAITING_INVESTOR' ||
      request?.status === 'WAITING_INVESTOR' ||
      isCompleted
  );

  const isMep = isMepContext(
    { ...(request || {}), ...(report || {}), relatedRequest: request },
    users
  );

  const rawInvPerson = String(invAttendee?.person || '').trim();
  const rawSupPerson = String(supAttendee?.person || '').trim();
  const assignedInvName = String(assignedInv?.fullName || '').trim();
  const assignedSupName = String(assignedSup?.fullName || '').trim();

  let investorName = deputyInv.fullName || 'Nguyễn Thành Trung';
  if (isInvSigned && rawInvPerson) {
    investorName = rawInvPerson;
  } else if (assignedInvName && !isLeadInvName(assignedInvName)) {
    investorName = assignedInvName;
  } else if (rawInvPerson && !isLeadInvName(rawInvPerson)) {
    investorName = rawInvPerson;
  }

  let supervisorName = isMep ? (deputySup.fullName || 'Nguyễn Đông Vũ') : 'Kiều Đỗ Minh Luân';
  if (isSupSigned && rawSupPerson) {
    supervisorName = rawSupPerson;
  } else if (assignedSupName && !isLeadSupName(assignedSupName)) {
    supervisorName = assignedSupName;
  } else if (rawSupPerson && !isLeadSupName(rawSupPerson)) {
    supervisorName = rawSupPerson;
  }

  return {
    investorName,
    supervisorName,
    assignedInv,
    assignedSup,
    isMep
  };
}
