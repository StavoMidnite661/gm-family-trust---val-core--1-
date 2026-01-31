/**
 * Toast API Configuration - CAPTURED CREDENTIALS
 * 
 * WARNING: These tokens expire! The JWT (`toast-customer-access`) expires ~30 mins from capture.
 * The refresh token (`toast-customer-refresh`) can be used to get a new access token.
 * 
 * Captured: 2026-01-20T16:11:25
 * Restaurant: Fusion Teriyaki - 6300 White Ln
 */

export const TOAST_CONFIG = {
    // API Endpoints - Updated to use the correct federated gateway
    endpoint: 'https://ws-api.toasttab.com/do-federated-gateway/v1/graphql',
    baseUrl: 'https://www.toasttab.com',
    
    // Apollo GraphQL Client Headers (Required for API calls)
    apolloClientName: 'sites-web-client',
    apolloClientVersion: '2884',
    toastSessionId: '620x04enmBN4xHcyj9ARiSiLvfLbluh7TJI5qCcqHFU',
    
    // Restaurant Information
    restaurantSlug: 'fusion-teriyaki-6300-white-ln',
    restaurantGuid: 'b6155316-c40c-4c44-8032-6cb3b2aa7f44', // Extracted from cookie paths
    
    // Guest Information (from JWT)
    guestGuid: 'd430ea00-af5c-4032-be76-77d563580ef6',
    phoneNumber: '+16612490812',
    
    // Authentication Tokens - Updated 2026-01-21 00:36:47
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InZpejhqZUVpMUY4ODlabkdibTJtZiJ9.eyJodHRwczovL3RvYXN0dGFiLmNvbS9jb25uZWN0aW9uX3R5cGUiOiJzbXMiLCJodHRwczovL3RvYXN0dGFiLmNvbS9ndWVzdF9ndWlkIjoiZDQzMGVhMDAtYWY1Yy00MDMyLWJlNzYtNzdkNTYzNTgwZWY2IiwiaHR0cHM6Ly90b2FzdHRhYi5jb20vYWNjZXNzX3R5cGUiOiJHVUVTVF9XRUJfQUNDRVNTIiwiaHR0cHM6Ly90b2FzdHRhYi5jb20vcHJvZmlsZV9jcmVhdGVkIjp0cnVlLCJodHRwczovL3RvYXN0dGFiLmNvbS9waG9uZV9udW1iZXIiOiIrMTY2MTI0OTA4MTIiLCJpc3MiOiJodHRwczovL3RvYXN0LWd1ZXN0cy50b2FzdHRhYi5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8ZDQzMGVhMDAtYWY1Yy00MDMyLWJlNzYtNzdkNTYzNTgwZWY2IiwiYXVkIjpbImh0dHBzOi8vdG9hc3QtZ3Vlc3RzLWFwaS8iLCJodHRwczovL3RvYXN0LWd1ZXN0cy50b2FzdHRhYi5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzY4OTU1MzkwLCJleHAiOjE3Njg5NTcxOTAsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIiwiZ3R5IjpbInJlZnJlc2hfdG9rZW4iLCJwYXNzd29yZCJdLCJhenAiOiIxS29aY0dVTDdLNFVIMVh4cmZEY1NGWVluU2FMODU3SyJ9.mDBmYMiUIzHP8GJHB5eVFSsePwM5dimOkaTGPNvVre9scl9vXSOpCRno0ttwogz8-1G_E-4WLKw8uUaRV3ajy-ihavLt5A9HzUDLH49Fx7ixNbEqEFLhAB8iyhbcGKiSaeNbtd4iHoHJo_9sL_2LL9gCFc4EuYF9aSJXaY0Z2psrKs-MdAN7C_Hv65VSkVt9MdsMGx1ws8LLmzKpRVV8dPLxiAqYiy5AmjjYKN876hd0k4FH7uQi4t3ZF2ufd0-Ip0fFeVI3zyZFH4MKayvP44P8fucsxmXanBbwgDUIyFqxY6BpCtNGHoSPLDaG6EIP98kp9cqoC0DvcqqryJrULw',
    refreshToken: 'S3egwEwuyD4GzjLQAfzVz1WSsdilCqbg4d_7HUBT1EqFn',
    
    // Cloudflare Cookies (Required for bot protection bypass) - Updated 2026-01-21 00:52:36
    cfBm: '1x.GAoaGvPCJqvHP5NOYH_DCqO_SNblymEswPRZbMW8-1768956501-1.0.1.1-vXio4vOSidTa3sotZG_r2pEAi6aGIqB4gWKHJuWLWq73ib0obrrrDjvP5vIVoCtQdkMTkoJkHpvdV2l6k2_hhlcJEKhN5bFtzLz7aT8fqGA',
    cfClearance: 'FYWJYAxi37q9vzzEXuTl8nFx4t34MHtEZe5dLaXT16k-1768956496-1.2.1.1-V2YL4m.Ff4CHg1Q14efI9we5x8yREEhBTtDZWch7Ex_m8JEqTh.a0gwcISYL1tt.b29umPXTH3xFGYvWexkyk1qduOU5nUmS99gfkMZXMB16y292IjxVvnI082NSLCCiQYXtJjMNN.Ue.3ttSgQhoYUQF3ooVQqbS3ci1WtcUQuGKX9LhEwCrBRMTyJG4LXlW4.A_PQ6hp32A5aboK4vXfVbqBMw2W5KUyJ_H9uH62vLJkYECLH3R.qCUsWDY3QM',
    
    // Session Cookies
    ssid: 'e07c078b-fc8a-4b94-882c-749f253fc4a0',
    experimentId: '319250fb-1b18-4929-80c7-9ad3465c0113',
};

/**
 * Build the full cookie string for requests
 */
export function buildCookieString(): string {
    return [
        `toast-customer-access=${TOAST_CONFIG.accessToken}`,
        `toast-customer-refresh=${TOAST_CONFIG.refreshToken}`,
        `__cf_bm=${TOAST_CONFIG.cfBm}`,
        `cf_clearance=${TOAST_CONFIG.cfClearance}`,
        `__ssid=${TOAST_CONFIG.ssid}`,
        `toast-sites-experiment-id=${TOAST_CONFIG.experimentId}`,
    ].join('; ');
}

/**
 * Build headers for Toast API requests
 */
export function buildHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': `Bearer ${TOAST_CONFIG.accessToken}`,
        'Cookie': buildCookieString(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Origin': 'https://www.toasttab.com',
        'Referer': 'https://www.toasttab.com/',
        // Apollo GraphQL Required Headers
        'apollographql-client-name': TOAST_CONFIG.apolloClientName,
        'apollographql-client-version': TOAST_CONFIG.apolloClientVersion,
        'toast-session-id': TOAST_CONFIG.toastSessionId,
    };
}
