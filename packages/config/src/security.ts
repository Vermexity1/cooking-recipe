export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const defaultContainerPolicy = {
  memoryMb: 1024,
  cpuShares: 512,
  pidsLimit: 256,
  readOnlyRootFilesystem: true,
  allowPrivilegeEscalation: false,
  seccompProfile: "RuntimeDefault",
  networkEgress: "standard",
};

export const sessionTimeouts = {
  temporaryMinutes: 45,
  persistentIdleMinutes: 120,
  cleanupGraceSeconds: 20,
};
