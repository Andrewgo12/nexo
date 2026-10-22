import { submitTripReview, submitTripReport } from '../services/authApi';

export default function useReputationActions(state) {
  const { reportForm, reviewForm, setReportForm, setReputationAction, setReputationError, setReputationRefresh, setReviewForm, setToast } = state;

  const submitReputationReview = async (event) => {
      event.preventDefault();
      setReputationAction('review');
      setReputationError('');
      try {
        await submitTripReview(Number(reviewForm.trip_id), {
          reviewee_profile_id: Number(reviewForm.reviewee_profile_id),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        });
        setReviewForm((current) => ({ ...current, comment: '' }));
        setReputationRefresh((value) => value + 1);
        setToast('Valoración verificada registrada.');
      } catch (error) {
        setReputationError(error.message || 'No fue posible enviar la valoración.');
      } finally {
        setReputationAction('');
      }
    }

  const submitReputationReport = async (event) => {
      event.preventDefault();
      setReputationAction('report');
      setReputationError('');
      try {
        await submitTripReport(Number(reportForm.trip_id), {
          reported_profile_id: Number(reportForm.reported_profile_id),
          category: reportForm.category,
          description: reportForm.description,
        });
        setReportForm((current) => ({ ...current, description: '' }));
        setReputationRefresh((value) => value + 1);
        setToast('Reporte enviado de forma privada para revisión.');
      } catch (error) {
        setReputationError(error.message || 'No fue posible enviar el reporte.');
      } finally {
        setReputationAction('');
      }
    }

  return {
    submitReputationReview,
    submitReputationReport,
  };

}
