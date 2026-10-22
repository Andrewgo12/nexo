import { useCallback } from 'react';
import { createWompiMembershipCheckout, requestInsuranceQuote, submitInsurancePolicy, updateAdminInsuranceEnrollment, downloadAdminInsurancePolicy } from '../services/authApi';
import loadWompiWidget from '../services/wompiWidget';

export default function useInsuranceActions(state) {
  const { setInsuranceAction, setInsuranceError, setInsuranceRefresh, setToast } = state;
  const submitInsuranceQuoteRequest = useCallback(async (productKey) => {
      setInsuranceAction(`quote-${productKey}`);
      setInsuranceError('');
      try {
        await requestInsuranceQuote(productKey);
        setInsuranceRefresh((value) => value + 1);
        setToast('Solicitud de cotización enviada. No se ha activado ninguna cobertura.');
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible solicitar la cotización.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceRefresh, setInsuranceError, setToast, setInsuranceAction])

  const openWompiMembershipCheckout = useCallback(async () => {
      setInsuranceAction('membership-checkout');
      setInsuranceError('');
      try {
        const { data: checkout } = await createWompiMembershipCheckout();
        await loadWompiWidget();
        if (typeof window.WidgetCheckout !== 'function') {
          throw new Error('Wompi no cargó el checkout esperado.');
        }
        const widget = new window.WidgetCheckout({
          publicKey: checkout.public_key,
          currency: checkout.currency,
          amountInCents: checkout.amount_in_cents,
          reference: checkout.reference,
          signature: checkout.signature,
          redirectUrl: checkout.redirect_url,
        });
        widget.open(() => {
          setToast('Checkout de pruebas finalizado; el estado solo se actualizará con el webhook validado.');
          setInsuranceRefresh((value) => value + 1);
        });
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible iniciar el checkout sandbox.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceRefresh, setInsuranceError, setToast, setInsuranceAction])

  const submitInsurancePolicyForm = useCallback(async (event, enrollmentId) => {
      event.preventDefault();
      const form = event.currentTarget;
      setInsuranceAction(`policy-${enrollmentId}`);
      setInsuranceError('');
      try {
        await submitInsurancePolicy(enrollmentId, new FormData(form));
        form.reset();
        setInsuranceRefresh((value) => value + 1);
        setToast('Documento recibido; la póliza aún requiere revisión administrativa.');
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible enviar el documento de póliza.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceError, setInsuranceRefresh, setToast, setInsuranceAction])

  const submitAdminInsuranceQuote = useCallback(async (event, enrollmentId) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setInsuranceAction(`admin-${enrollmentId}`);
      setInsuranceError('');
      try {
        await updateAdminInsuranceEnrollment(enrollmentId, {
          status: 'quoted',
          monthly_premium_cop: Number(form.get('monthly_premium_cop')),
          coverage_summary: String(form.get('coverage_summary') || '').trim(),
        });
        setInsuranceRefresh((value) => value + 1);
        setToast('Cotización registrada para revisión del estudiante.');
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible registrar la cotización.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceRefresh, setInsuranceError, setToast, setInsuranceAction])

  const moderateInsuranceEnrollment = useCallback(async (enrollmentId, status) => {
      const reviewNote = status === 'rejected'
        ? window.prompt('Motivo del rechazo (obligatorio):')
        : '';
      if (reviewNote === null) return;
      if (status === 'rejected' && !reviewNote.trim()) {
        setInsuranceError('Escribe el motivo del rechazo para informar al estudiante.');
        return;
      }
      setInsuranceAction(`admin-${enrollmentId}`);
      setInsuranceError('');
      try {
        await updateAdminInsuranceEnrollment(enrollmentId, { status, review_note: reviewNote.trim() });
        setInsuranceRefresh((value) => value + 1);
        setToast(status === 'active' ? 'Póliza validada y activada.' : 'Solicitud de seguro rechazada.');
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible actualizar el estado de la póliza.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceRefresh, setInsuranceError, setToast, setInsuranceAction])

  const downloadInsurancePolicy = useCallback(async (enrollmentId) => {
      setInsuranceAction(`download-${enrollmentId}`);
      setInsuranceError('');
      try {
        const file = await downloadAdminInsurancePolicy(enrollmentId);
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `poliza-${enrollmentId}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } catch (error) {
        setInsuranceError(error.message || 'No fue posible descargar la póliza.');
      } finally {
        setInsuranceAction('');
      }
    }, [setInsuranceError, setInsuranceAction])

  return {
    submitInsuranceQuoteRequest,
    openWompiMembershipCheckout,
    submitInsurancePolicyForm,
    submitAdminInsuranceQuote,
    moderateInsuranceEnrollment,
    downloadInsurancePolicy,
  };

}
