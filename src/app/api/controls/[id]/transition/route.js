// ============================================================
// AuditForge — Control Status Transition API
// app/api/controls/[id]/transition/route.js
// Handles review status and lifecycle transitions
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateReviewTransition,
  validateLifecycleTransition,
  validateControlReadiness,
  createAuditEntry,
  createStatusLogEntry,
} from "@/lib/middleware/validation";

// POST /api/controls/[id]/transition
// Body: { type: "REVIEW" | "LIFECYCLE", toStatus: "PREPARED", userId, comment? }
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, toStatus, userId, comment, supersededById } = body;

    if (!type || !toStatus || !userId) {
      return NextResponse.json({
        error: "Required: type (REVIEW|LIFECYCLE), toStatus, userId",
      }, { status: 400 });
    }

    const control = await prisma.control.findUnique({
      where: { id },
      include: {
        statusLogs: {
          orderBy: { changedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    if (type === "REVIEW") {
      const fromStatus = control.reviewStatus;

      // Get previous actors for segregation of duties
      const prepareLog = control.statusLogs.find(
        (l) => l.statusType === "REVIEW" && l.toStatus === "PREPARED"
      );
      const reviewLog = control.statusLogs.find(
        (l) => l.statusType === "REVIEW" && l.toStatus === "REVIEWED"
      );

      const previousActors = {
        preparer: prepareLog?.changedBy,
        reviewer: reviewLog?.changedBy,
      };

      // Validate transition
      const result = validateReviewTransition(fromStatus, toStatus, userId, previousActors);

      // If reopening (REVIEWED → DRAFT), comment is required
      if (result.requiresComment && !comment) {
        return NextResponse.json({
          error: "Comment is required when reopening a reviewed control",
        }, { status: 422 });
      }

      // If promoting to PREPARED, validate readiness
      if (toStatus === "PREPARED") {
        const readiness = await validateControlReadiness(prisma, id);
        if (readiness.blockers.length > 0) {
          return NextResponse.json({
            error: "Control is not ready for promotion",
            blockers: readiness.blockers,
            warnings: readiness.warnings,
          }, { status: 422 });
        }
        // Warnings are non-blocking but returned for UI display
        if (readiness.warnings.length > 0) {
          // Still proceed, but include warnings in response
        }
      }

      // Execute transition
      const updated = await prisma.control.update({
        where: { id },
        data: {
          reviewStatus: toStatus,
          // If approved, also set lifecycle to ACTIVE if still DRAFT
          ...(toStatus === "APPROVED" && control.lifecycle === "DRAFT"
            ? { lifecycle: "ACTIVE" }
            : {}),
        },
      });

      // Log the transition
      await createStatusLogEntry(prisma, {
        controlId: id,
        fromStatus,
        toStatus,
        statusType: "REVIEW",
        changedBy: userId,
        comment,
      });

      await createAuditEntry(prisma, {
        entityType: "Control",
        entityId: id,
        action: "STATUS_CHANGE",
        field: "reviewStatus",
        previousValue: fromStatus,
        newValue: toStatus,
        userId,
        rationale: comment || `Status transition: ${fromStatus} → ${toStatus}`,
      });

      return NextResponse.json({
        control: updated,
        transition: { type: "REVIEW", from: fromStatus, to: toStatus },
      });

    } else if (type === "LIFECYCLE") {
      const fromStatus = control.lifecycle;

      validateLifecycleTransition(fromStatus, toStatus, { supersededById });

      const updated = await prisma.control.update({
        where: { id },
        data: {
          lifecycle: toStatus,
          ...(supersededById ? { supersededById } : {}),
        },
      });

      await createStatusLogEntry(prisma, {
        controlId: id,
        fromStatus,
        toStatus,
        statusType: "LIFECYCLE",
        changedBy: userId,
        comment,
      });

      await createAuditEntry(prisma, {
        entityType: "Control",
        entityId: id,
        action: "STATUS_CHANGE",
        field: "lifecycle",
        previousValue: fromStatus,
        newValue: toStatus,
        userId,
        rationale: comment || `Lifecycle transition: ${fromStatus} → ${toStatus}`,
      });

      return NextResponse.json({
        control: updated,
        transition: { type: "LIFECYCLE", from: fromStatus, to: toStatus },
      });

    } else {
      return NextResponse.json({ error: "type must be REVIEW or LIFECYCLE" }, { status: 400 });
    }

  } catch (error) {
    if (error.name === "TransitionError") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Transition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
