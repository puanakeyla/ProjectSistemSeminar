import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Setup Pusher
window.Pusher = Pusher;

// Laravel Echo configuration
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local-key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    encrypted: true,

    // Use Redis in development, Pusher in production
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],

    // Sanctum auth
    auth: {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
    },
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/broadcasting/auth`,
});

export default echo;
