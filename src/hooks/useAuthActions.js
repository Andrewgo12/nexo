import { changePassword, getCurrentAccount, loginAccount, requestPasswordReset, resendVerification, registerAccount, resetPassword, updateCurrentProfile, uploadProfilePhoto } from '../services/authApi';

export default function useAuthActions(state, helpers = {}) {
  const { authMode, loginForm, passwordForm, privacy, profilePhotoFile, setAuthMode, setIsLoggedIn, setPasswordForm, setProfilePhotoFile, setToast, student, uni } = state;
  const { applyAuthenticatedUser, closeModal, resetParams } = helpers;

  const saveProfile = async () => {
      try {
        const { user, message } = await updateCurrentProfile({
          name: student.name,
          career: student.career,
          semester: student.semester,
          shift: student.shift,
          neighborhood: student.neighborhood,
          transport: student.transport,
          emergency_contact: student.emergency,
          trusted_contact_consent: Boolean(student.trusted_contact_consent),
          trusted_contact_email: student.trusted_contact_consent ? student.trusted_contact_email : null,
          trusted_contact_phone: student.trusted_contact_consent ? student.trusted_contact_phone : null,
          privacy: privacy,
        });
        applyAuthenticatedUser(user);
        setToast(message);
      } catch (error) {
        setToast(error.message);
      }
    }

  const confirmProfile = () => {
      void saveProfile().then(closeModal);
    }

  const handleChangePassword = async () => {
      if (passwordForm.password !== passwordForm.password_confirmation) {
        setToast('Las contraseñas nuevas no coinciden.');
        return;
      }
      try {
        const response = await changePassword(passwordForm);
        setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        setToast(response.message);
      } catch (error) {
        setToast(error.message);
      }
    }

  const handleProfilePhotoUpload = async () => {
      if (!profilePhotoFile) {
        setToast('Selecciona una imagen para subir.');
        return;
      }
      try {
        const { user, message } = await uploadProfilePhoto(profilePhotoFile);
        applyAuthenticatedUser(user);
        setProfilePhotoFile(null);
        setToast(message);
      } catch (error) {
        setToast(error.message);
      }
    }

  const handleAuthSubmit = async () => {
      if (!loginForm.email || !loginForm.password) {
        if (authMode !== 'forgot') {
          setToast('Completa el correo institucional y la contraseña para continuar.');
          return;
        }
      }
      if (authMode === 'forgot') {
        if (!loginForm.email) {
          setToast('Escribe tu correo institucional para enviarte instrucciones.');
          return;
        }
        try {
          const response = await requestPasswordReset(loginForm.email);
          setToast(response.message);
        } catch (error) {
          setToast(error.message);
        }
        return;
      }
      if (authMode === 'register' && !loginForm.name.trim()) {
        setToast('Agrega tu nombre para crear tu perfil universitario.');
        return;
      }
      if (['register', 'reset'].includes(authMode) && loginForm.password !== loginForm.password_confirmation) {
        setToast('Las contraseñas no coinciden.');
        return;
      }

      try {
        if (authMode === 'reset') {
          const response = await resetPassword({
            token: resetParams.get('reset_token'),
            email: loginForm.email,
            password: loginForm.password,
            password_confirmation: loginForm.password_confirmation,
          });
          setToast(response.message);
          setAuthMode('login');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        const response = authMode === 'register'
          ? await registerAccount({
            name: loginForm.name,
            email: loginForm.email,
            password: loginForm.password,
            password_confirmation: loginForm.password_confirmation,
            university: uni.id,
            career: loginForm.career || undefined,
            semester: loginForm.semester || undefined,
            shift: loginForm.shift || undefined,
            neighborhood: loginForm.neighborhood || undefined,
            emergency_contact: loginForm.emergency_contact || undefined,
          })
          : await loginAccount({
            email: loginForm.email,
            password: loginForm.password,
            remember: loginForm.remember,
          });

        applyAuthenticatedUser(response.user);
        setIsLoggedIn(true);
        setToast(response.message);
      } catch (error) {
        setToast(error.message);
      }
    }

  const handlePasswordRecovery = () => {
      setToast('');
      setAuthMode('forgot');
    }

  const refreshEmailVerification = async () => {
      try {
        const { user } = await getCurrentAccount();
        applyAuthenticatedUser(user);
        setToast(user.email_verified_at ? 'Correo verificado. Tu cuenta ya está activa.' : 'El correo aún no aparece como verificado.');
      } catch (error) {
        setToast(error.message);
      }
    }

  const sendVerificationEmail = async () => {
      try {
        const response = await resendVerification();
        setToast(response.message);
      } catch (error) {
        setToast(error.message);
      }
    }

  return {
    saveProfile,
    confirmProfile,
    handleChangePassword,
    handleProfilePhotoUpload,
    handleAuthSubmit,
    handlePasswordRecovery,
    refreshEmailVerification,
    sendVerificationEmail,
  };

}
