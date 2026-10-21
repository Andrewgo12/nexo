export function getCurrentDeviceLocation(geolocation = globalThis.navigator?.geolocation) {
  if (!geolocation?.getCurrentPosition) {
    return Promise.reject(new Error('Este navegador no ofrece geolocalización.'));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          !Number.isFinite(coords.latitude) ||
          !Number.isFinite(coords.longitude) ||
          coords.latitude < -90 ||
          coords.latitude > 90 ||
          coords.longitude < -180 ||
          coords.longitude > 180
        ) {
          reject(new Error('El navegador devolvió coordenadas de ubicación inválidas.'));
          return;
        }
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
        });
      },
      (error) => {
        const message = error.code === 1
          ? 'Permite el acceso a tu ubicación para usar el GPS.'
          : error.code === 2
            ? 'No se pudo determinar tu ubicación actual.'
            : error.code === 3
              ? 'La solicitud de ubicación tardó demasiado.'
              : 'No fue posible obtener tu ubicación.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}
