package api_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/handler/api"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

func setupRouter(t *testing.T) chi.Router {
	t.Helper()

	origDir, _ := os.Getwd()
	os.Chdir(findProjectRoot(t))
	t.Cleanup(func() { os.Chdir(origDir) })

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	db, err := sqlite.NewInMemory(logger)
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	cfg := &config.Config{
		Host:        "127.0.0.1",
		Port:        0,
		DBPath:      ":memory:",
		OllamaURL:   "http://localhost:11434",
		OllamaModel: "llama3.2",
	}

	r := chi.NewRouter()
	handler := api.NewHandler(db, cfg, logger)
	handler.Register(r)
	return r
}

func findProjectRoot(t *testing.T) string {
	t.Helper()
	dir, _ := os.Getwd()
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(dir + "/go.mod"); err == nil {
			return dir
		}
		dir = dir + "/.."
	}
	t.Fatal("could not find project root")
	return ""
}

func TestHealthCheck(t *testing.T) {
	r := setupRouter(t)

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	json.NewDecoder(w.Body).Decode(&body)
	if body["status"] != "ok" {
		t.Fatalf("expected status 'ok', got '%s'", body["status"])
	}
}

func TestProjectCRUDAPI(t *testing.T) {
	r := setupRouter(t)

	// Create project
	payload := `{"name":"API Test Project","description":"Testing","status":"active"}`
	req := httptest.NewRequest("POST", "/projects", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var project map[string]interface{}
	json.NewDecoder(w.Body).Decode(&project)
	id, ok := project["id"].(string)
	if !ok || id == "" {
		t.Fatal("expected project ID in response")
	}

	// List projects
	req2 := httptest.NewRequest("GET", "/projects", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", w2.Code)
	}

	// Get project
	req3 := httptest.NewRequest("GET", "/projects/"+id, nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("expected 200 for get, got %d", w3.Code)
	}

	// Update project
	updatePayload := `{"name":"Updated Project","description":"Updated","status":"archived"}`
	req4 := httptest.NewRequest("PUT", "/projects/"+id, bytes.NewBufferString(updatePayload))
	req4.Header.Set("Content-Type", "application/json")
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d: %s", w4.Code, w4.Body.String())
	}

	// Delete project
	req5 := httptest.NewRequest("DELETE", "/projects/"+id, nil)
	w5 := httptest.NewRecorder()
	r.ServeHTTP(w5, req5)
	if w5.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w5.Code)
	}
}

func TestStakeholderCRUDAPI(t *testing.T) {
	r := setupRouter(t)

	// Create stakeholder
	payload := `{"name":"API Stakeholder","job_title":"Director","influence_level":"high","support_level":"champion"}`
	req := httptest.NewRequest("POST", "/stakeholders", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var sh map[string]interface{}
	json.NewDecoder(w.Body).Decode(&sh)
	id := sh["id"].(string)

	// Get stakeholder
	req2 := httptest.NewRequest("GET", "/stakeholders/"+id, nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w2.Code)
	}

	// List with search
	req3 := httptest.NewRequest("GET", "/stakeholders?search=API", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	var list []map[string]interface{}
	json.NewDecoder(w3.Body).Decode(&list)
	if len(list) != 1 {
		t.Fatalf("expected 1 search result, got %d", len(list))
	}

	// Delete
	req4 := httptest.NewRequest("DELETE", "/stakeholders/"+id, nil)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w4.Code)
	}
}

func TestNotFoundReturns404(t *testing.T) {
	r := setupRouter(t)

	req := httptest.NewRequest("GET", "/projects/nonexistent-uuid", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}

	req2 := httptest.NewRequest("GET", "/stakeholders/nonexistent-uuid", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w2.Code)
	}
}

func TestExportCSVEndpoint(t *testing.T) {
	r := setupRouter(t)

	req := httptest.NewRequest("GET", "/export/stakeholders.csv", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "text/csv" {
		t.Fatalf("expected text/csv content type, got '%s'", ct)
	}
}

func TestWorkstreamCRUDAPI(t *testing.T) {
	r := setupRouter(t)

	// Create a project first
	projPayload := `{"name":"WS Project","status":"active"}`
	req := httptest.NewRequest("POST", "/projects", bytes.NewBufferString(projPayload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var proj map[string]interface{}
	json.NewDecoder(w.Body).Decode(&proj)
	projID := proj["id"].(string)

	// Create workstream
	wsPayload := `{"name":"Planning Phase","description":"Initial planning"}`
	req2 := httptest.NewRequest("POST", "/projects/"+projID+"/workstreams", bytes.NewBufferString(wsPayload))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w2.Code, w2.Body.String())
	}

	// List workstreams
	req3 := httptest.NewRequest("GET", "/projects/"+projID+"/workstreams", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	var wsList []map[string]interface{}
	json.NewDecoder(w3.Body).Decode(&wsList)
	if len(wsList) != 1 {
		t.Fatalf("expected 1 workstream, got %d", len(wsList))
	}
}

func TestTagCRUDAPI(t *testing.T) {
	r := setupRouter(t)

	// Create tag
	payload := `{"name":"Critical","color":"#ff0000"}`
	req := httptest.NewRequest("POST", "/tags", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	// List tags
	req2 := httptest.NewRequest("GET", "/tags", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	var tags []map[string]interface{}
	json.NewDecoder(w2.Body).Decode(&tags)
	if len(tags) != 1 {
		t.Fatalf("expected 1 tag, got %d", len(tags))
	}
}
