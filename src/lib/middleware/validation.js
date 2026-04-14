// ============================================================
// AuditForge — Validation Middleware
// Item 7: Business rules enforced on every write
// Item 4: Audit trail — EDIT requires rationale
// Item 3: Review status transition state machine
// ============================================================

const { PrismaClient } = require("@prisma/client");

// ── Review Status State Machine ────────────────────────────
const REVIEW_TRANSITIONS = {
  DRAFT: ["PREPARED"],
  PREPARED: ["REVIEWED"],
  REVIEWED: ["APPROVED", "DRAFT", "RETURN_FOR_COMMENTS"], // DRAFT = reopen; RFC = return with notes
  RETURN_FOR_COMMENTS: ["PREPARED"], // preparer addresses comments and resubmits
  APPROVED: [], // immutable — superuser override creates audit entry
};

const LIFECYCLE_TRANSITIONS = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["SUPERSEDED", "RETIRED"],
  SUPERSEDED: ["RETIRED"],
  RETIRED: [], // terminal
};

// ── Email Regex ────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Validation Error Class ─────────────────────────────────
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.statusCode = 422;
  }
}

class TransitionError extends Error {
  constructor(from, to, reason) {
    super(`Cannot transition from ${from} to ${to}: ${reason}`);
    this.name = "TransitionError";
    this.from = from;
    this.to = to;
    this.statusCode = 409;
  }
}

// ── Validation Functions ───────────────────────────────────

/**
 * Validates a review status transition.
 * Enforces the state machine and segregation of duties.
 */
function validateReviewTransition(fromStatus, toStatus, changedBy, previousActors = {}) {
  const allowed = REVIEW_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    throw new TransitionError(fromStatus, toStatus, `Allowed transitions from ${fromStatus}: ${allowed?.join(", ") || "none"}`);
  }

  // Segregation of duties
  if (toStatus === "REVIEWED" && previousActors.preparer === changedBy) {
    throw new TransitionError(fromStatus, toStatus, "Reviewer must be different from preparer");
  }
  if (toStatus === "APPROVED" && previousActors.reviewer === changedBy) {
    throw new TransitionError(fromStatus, toStatus, "Approver must be different from reviewer");
  }

  // Reopen requires comment (enforced at call site, validated here)
  if (fromStatus === "REVIEWED" && toStatus === "DRAFT") {
    return { requiresComment: true };
  }

  return { requiresComment: false };
}

/**
 * Validates a lifecycle transition.
 */
function validateLifecycleTransition(fromStatus, toStatus, controlData = {}) {
  const allowed = LIFECYCLE_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    throw new TransitionError(fromStatus, toStatus, `Allowed transitions from ${fromStatus}: ${allowed?.join(", ") || "none"}`);
  }

  // SUPERSEDED requires supersededById
  if (toStatus === "SUPERSEDED" && !controlData.supersededById) {
    throw new ValidationError("supersededById", "Superseded controls must reference the replacement control");
  }

  return true;
}

/**
 * Validates control data before create/update.
 * Returns array of validation errors (empty = valid).
 */
function validateControl(data, mode = "create") {
  const errors = [];

  if (!data.controlId || data.controlId.trim() === "") {
    errors.push({ field: "controlId", message: "Control ID is required" });
  } else if (!/^CTRL-[A-Z]{2,6}-\d{3,4}$/.test(data.controlId)) {
    errors.push({ field: "controlId", message: "Control ID must match pattern: CTRL-{AREA}-{SEQ} (e.g., CTRL-AP-001)" });
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.push({ field: "description", message: "Control description must be at least 20 characters" });
  }

  if (!data.processId) {
    errors.push({ field: "processId", message: "Process is required" });
  }

  if (mode === "edit" && !data.changeReason) {
    errors.push({ field: "changeReason", message: "Change reason is required for edits (audit trail)" });
  }

  return errors;
}

/**
 * Validates risk data.
 */
function validateRisk(data) {
  const errors = [];

  if (!data.riskId || data.riskId.trim() === "") {
    errors.push({ field: "riskId", message: "Risk ID is required" });
  } else if (!/^RSK-[A-Z]{2,6}-\d{3,4}$/.test(data.riskId)) {
    errors.push({ field: "riskId", message: "Risk ID must match pattern: RSK-{AREA}-{SEQ} (e.g., RSK-GOV-001)" });
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push({ field: "description", message: "Risk description must be at least 10 characters" });
  }

  if (!data.category) {
    errors.push({ field: "category", message: "Risk category is required" });
  }

  return errors;
}

/**
 * Validates process data.
 */
function validateProcess(data) {
  const errors = [];

  if (!data.processId || data.processId.trim() === "") {
    errors.push({ field: "processId", message: "Process ID is required" });
  } else if (!/^PROC-[A-Z]{2,6}-\d{3,4}$/.test(data.processId)) {
    errors.push({ field: "processId", message: "Process ID must match pattern: PROC-{AREA}-{SEQ}" });
  }

  if (!data.processArea || data.processArea.trim() === "") {
    errors.push({ field: "processArea", message: "Process area is required" });
  }

  if (!data.processName || data.processName.trim() === "") {
    errors.push({ field: "processName", message: "Process name is required" });
  }

  return errors;
}

/**
 * Validates owner data.
 */
function validateOwner(data) {
  const errors = [];

  if (!data.ownerName || data.ownerName.trim() === "") {
    errors.push({ field: "ownerName", message: "Owner name is required" });
  }

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  return errors;
}

/**
 * Validates control readiness for status promotion.
 * Called when transitioning DRAFT → PREPARED.
 */
async function validateControlReadiness(prisma, controlId) {
  const warnings = [];
  const blockers = [];

  const control = await prisma.control.findUnique({
    where: { id: controlId },
    include: {
      risks: { where: { validTo: null } },
      assertions: { where: { validTo: null } },
      frameworks: { where: { validTo: null } },
    },
  });

  if (!control) {
    blockers.push({ field: "controlId", message: "Control not found" });
    return { warnings, blockers };
  }

  // Must have at least one risk mapping to promote to PREPARED
  if (control.risks.length === 0) {
    blockers.push({ field: "risks", message: "Control must have at least one risk mapping before promotion" });
  }

  // SOX controls must have assertion mappings
  const hasSoxMapping = control.frameworks?.length > 0; // simplified check
  if (hasSoxMapping && control.assertions.length === 0) {
    blockers.push({ field: "assertions", message: "SOX-mapped controls must have at least one assertion" });
  }

  // Warnings (non-blocking)
  if (!control.objective) {
    warnings.push({ field: "objective", message: "Control objective is not documented" });
  }
  if (!control.ownerId) {
    warnings.push({ field: "ownerId", message: "Control owner is not assigned" });
  }
  if (!control.evidenceDescription) {
    warnings.push({ field: "evidenceDescription", message: "Evidence description is not documented" });
  }

  return { warnings, blockers };
}

// ── Audit Trail Helper ─────────────────────────────────────

/**
 * Creates an audit trail entry.
 * For EDIT actions, rationale is required (enforced here).
 */
async function createAuditEntry(prisma, { entityType, entityId, action, field, previousValue, newValue, userId, rationale }) {
  if (action === "EDIT" && !rationale) {
    throw new ValidationError("rationale", "Rationale is required for all edit actions (Silent Fix Prevention)");
  }

  return prisma.auditTrail.create({
    data: {
      entityType,
      entityId,
      action,
      field: field || null,
      previousValue: previousValue != null ? String(previousValue) : null,
      newValue: newValue != null ? String(newValue) : null,
      userId,
      rationale: rationale || null,
    },
  });
}

/**
 * Creates a status log entry for control transitions.
 */
async function createStatusLogEntry(prisma, { controlId, fromStatus, toStatus, statusType, changedBy, comment }) {
  return prisma.controlStatusLog.create({
    data: {
      controlId,
      fromStatus,
      toStatus,
      statusType,
      changedBy,
      comment: comment || null,
    },
  });
}

/**
 * Computes field-level diffs between old and new data.
 * Returns array of { field, previousValue, newValue } for changed fields.
 */
function computeDiffs(oldData, newData, trackedFields) {
  const diffs = [];
  for (const field of trackedFields) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (String(oldVal ?? "") !== String(newVal ?? "")) {
      diffs.push({ field, previousValue: oldVal, newValue: newVal });
    }
  }
  return diffs;
}

// Tracked fields per entity type
const TRACKED_FIELDS = {
  Control: [
    "description", "objective", "controlType", "controlNature",
    "controlFrequency", "keyControl", "designEffectiveness",
    "operatingEffectiveness", "evidenceDescription", "testProcedure",
    "ownerId", "processId", "scopeId",
  ],
  Risk: [
    "description", "category", "likelihood", "impact",
    "inherentRiskRating", "residualRiskRating", "riskResponse",
  ],
  Process: [
    "processArea", "processName", "subprocessName",
    "processOwner", "description",
  ],
  Owner: ["ownerName", "title", "department", "email"],
};

module.exports = {
  // Validators
  validateControl,
  validateRisk,
  validateProcess,
  validateOwner,
  validateControlReadiness,

  // State machine
  validateReviewTransition,
  validateLifecycleTransition,
  REVIEW_TRANSITIONS,
  LIFECYCLE_TRANSITIONS,

  // Audit trail
  createAuditEntry,
  createStatusLogEntry,
  computeDiffs,
  TRACKED_FIELDS,

  // Error classes
  ValidationError,
  TransitionError,
};
