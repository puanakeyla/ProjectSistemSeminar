import { useState, useEffect } from 'react';

/**
 * Custom hook untuk mendapatkan geolocation user
 * dengan fallback dan error handling yang robust
 */
export const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: true,
    });

    const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0,
        ...options,
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                error: 'Geolocation is not supported by your browser',
                loading: false,
            }));
            return;
        }

        const handleSuccess = (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false,
            });
        };

        const handleError = (error) => {
            let errorMessage = 'Unknown error occurred';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. Please try again.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = error.message || 'Failed to get location';
            }

            setLocation({
                latitude: null,
                longitude: null,
                accuracy: null,
                error: errorMessage,
                loading: false,
            });
        };

        // Get current position
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            defaultOptions
        );
    }, []);

    const refetch = () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                let errorMessage = 'Unknown error occurred';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location timeout';
                        break;
                    default:
                        errorMessage = error.message;
                }

                setLocation({
                    latitude: null,
                    longitude: null,
                    accuracy: null,
                    error: errorMessage,
                    loading: false,
                });
            },
            defaultOptions
        );
    };

    return { ...location, refetch };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000; // meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimals
};

const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};
