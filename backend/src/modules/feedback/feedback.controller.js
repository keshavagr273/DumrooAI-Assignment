import feedbackService from './feedback.service.js';

export async function requestUploadUrl(req, res, next) {
  try {
    const { originalFilename, mimeType, fileSize } = req.body;
    const result = await feedbackService.requestUploadUrl(req.user, {
      originalFilename,
      mimeType,
      fileSize,
    });

    return res.status(200).json({
      success: true,
      message: 'Signed upload URL generated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const idempotencyKey = req.idempotencyKey;
    const result = await feedbackService.submitFeedback(req.user, req.body, idempotencyKey);

    const statusCode = result.isDuplicate ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      message: result.isDuplicate
        ? 'Feedback already submitted (idempotent result)'
        : 'Feedback submitted successfully',
      data: result.feedback,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyReports(req, res, next) {
  try {
    const reports = await feedbackService.getMyReports(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeedbackById(req, res, next) {
  try {
    const { id } = req.params;
    const report = await feedbackService.getFeedbackById(req.user, id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Feedback report not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await feedbackService.updateStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Feedback status updated to '${status}'`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function retryNotification(req, res, next) {
  try {
    const { id } = req.params;
    const job = await feedbackService.retryNotification(id);

    return res.status(200).json({
      success: true,
      message: 'Notification job re-queued for processing',
      data: {
        jobId: job._id,
        status: job.status,
        nextRetryAt: job.nextRetryAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
