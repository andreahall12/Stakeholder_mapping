// Package middleware provides HTTP middleware for security controls.
package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type contextKey string

const nonceKey contextKey = "csp-nonce"

// SecurityHeaders adds hardened HTTP security headers to all responses.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Generate a unique nonce for this request (for inline scripts)
		nonce := generateNonce()
		ctx := context.WithValue(r.Context(), nonceKey, nonce)

		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "0") // Disabled in favor of CSP
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; "+
				"script-src 'self' 'nonce-"+nonce+"'; "+
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "+
				"font-src 'self' https://fonts.gstatic.com; "+
				"img-src 'self' data:; "+
				"connect-src 'self'; "+
				"frame-ancestors 'none'")

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetNonce extracts the CSP nonce from the request context.
func GetNonce(ctx context.Context) string {
	if v, ok := ctx.Value(nonceKey).(string); ok {
		return v
	}
	return ""
}

// APIKeyAuth returns middleware that validates an API key header.
// If apiKey is empty, the middleware is a no-op (authentication disabled).
func APIKeyAuth(apiKey string, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if apiKey == "" {
				next.ServeHTTP(w, r)
				return
			}

			provided := r.Header.Get("X-API-Key")
			if provided == "" {
				// Also check Authorization: Bearer <key>
				auth := r.Header.Get("Authorization")
				if strings.HasPrefix(auth, "Bearer ") {
					provided = strings.TrimPrefix(auth, "Bearer ")
				}
			}

			if provided != apiKey {
				logger.Warn("unauthorized API request", "remote", r.RemoteAddr, "path", r.URL.Path)
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequestLogger logs incoming HTTP requests with timing information.
func RequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			wrapped := &statusWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(wrapped, r)
			logger.Info("http request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", wrapped.status,
				"duration_ms", time.Since(start).Milliseconds(),
				"remote", r.RemoteAddr,
			)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func generateNonce() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "fallback-nonce"
	}
	return base64.RawURLEncoding.EncodeToString(b)
}
