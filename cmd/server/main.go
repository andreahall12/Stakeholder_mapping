// Package main is the entry point for the stakeholder-tool web server.
// It initializes the database, configures middleware, and serves the web UI and REST API.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/handler/api"
	"github.com/andreahall12/stakeholder-tool/internal/handler/web"
	"github.com/andreahall12/stakeholder-tool/internal/middleware"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

func main() {
	// Configure structured logging
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Open database
	db, err := sqlite.New(cfg.DBPath, logger)
	if err != nil {
		logger.Error("failed to open database", "error", err)
		os.Exit(1)
	}

	// Build router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestLogger(logger))
	r.Use(chimw.Recoverer)
	r.Use(middleware.SecurityHeaders)
	r.Use(chimw.Compress(5))

	// Web UI routes
	webHandler := web.NewHandler(db, cfg, logger)
	webHandler.Register(r)

	// REST API routes (versioned)
	r.Route("/api/v1", func(r chi.Router) {
		// Optional API key authentication
		r.Use(middleware.APIKeyAuth(cfg.APIKey, logger))
		r.Use(chimw.SetHeader("Content-Type", "application/json"))

		apiHandler := api.NewHandler(db, cfg, logger)
		apiHandler.Register(r)
	})

	// Start server
	srv := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("server starting", "addr", cfg.Addr())
		fmt.Printf("\n  Stakeholder Tool running at http://%s\n\n", cfg.Addr())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	logger.Info("shutdown signal received")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}

	if err := db.Close(); err != nil {
		logger.Error("database close error", "error", err)
	}

	logger.Info("server stopped gracefully")
}
