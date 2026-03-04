package service

import (
	"fmt"
	"io"
	"log/slog"
	"strings"

	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// OntologyService exports stakeholder data as RDF/Turtle aligned with the compliance ontology.
type OntologyService struct {
	db     *sqlite.DB
	logger *slog.Logger
}

// NewOntologyService creates a new OntologyService.
func NewOntologyService(db *sqlite.DB, logger *slog.Logger) *OntologyService {
	return &OntologyService{db: db, logger: logger}
}

// ExportTurtle writes the stakeholder data as RDF/Turtle to the given writer.
// It maps:
//   - Stakeholders -> co-bus:Personnel
//   - Projects -> co-bus:ComplianceProgram
//   - Workstreams -> co-bus:Activity
func (s *OntologyService) ExportTurtle(w io.Writer, projectID string) error {
	var sb strings.Builder

	// Prefixes
	sb.WriteString(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix co: <https://compliance-ontology.org/core#> .
@prefix co-bus: <https://compliance-ontology.org/business#> .
@prefix sh-tool: <https://stakeholder-tool.local/data#> .

`)

	// Export projects as co-bus:ComplianceProgram
	projectRows, err := s.db.Conn().Query(`SELECT id, name, description, status FROM projects`)
	if err != nil {
		return fmt.Errorf("querying projects: %w", err)
	}
	defer projectRows.Close()

	for projectRows.Next() {
		var id, name, desc, status string
		if err := projectRows.Scan(&id, &name, &desc, &status); err != nil {
			continue
		}
		if projectID != "" && id != projectID {
			continue
		}
		sb.WriteString(fmt.Sprintf(`sh-tool:project-%s a co-bus:ComplianceProgram ;
    rdfs:label %s ;
    co:description %s ;
    co:status %s .

`, escapeTurtleID(id), quoteTurtle(name), quoteTurtle(desc), quoteTurtle(status)))

		// Export workstreams for this project as co-bus:Activity
		wsRows, err := s.db.Conn().Query(
			`SELECT id, name, description FROM workstreams WHERE project_id = ?`, id)
		if err == nil {
			for wsRows.Next() {
				var wsID, wsName, wsDesc string
				if wsRows.Scan(&wsID, &wsName, &wsDesc) == nil {
					sb.WriteString(fmt.Sprintf(`sh-tool:workstream-%s a co-bus:Activity ;
    rdfs:label %s ;
    co:description %s ;
    co:partOf sh-tool:project-%s .

`, escapeTurtleID(wsID), quoteTurtle(wsName), quoteTurtle(wsDesc), escapeTurtleID(id)))
				}
			}
			wsRows.Close()
		}
	}

	// Export stakeholders as co-bus:Personnel
	filter := ""
	var args []interface{}
	if projectID != "" {
		filter = ` JOIN project_stakeholders ps ON s.id = ps.stakeholder_id WHERE ps.project_id = ?`
		args = append(args, projectID)
	}
	shRows, err := s.db.Conn().Query(
		`SELECT s.id, s.name, s.job_title, s.department, s.email, s.influence_level, s.support_level
		 FROM stakeholders s`+filter+` ORDER BY s.name`, args...)
	if err != nil {
		return fmt.Errorf("querying stakeholders: %w", err)
	}
	defer shRows.Close()

	for shRows.Next() {
		var id, name, title, dept, email, influence, support string
		if err := shRows.Scan(&id, &name, &title, &dept, &email, &influence, &support); err != nil {
			continue
		}
		sb.WriteString(fmt.Sprintf(`sh-tool:stakeholder-%s a co-bus:Personnel ;
    rdfs:label %s ;
    co-bus:jobTitle %s ;
    co-bus:department %s ;
    co-bus:email %s ;
    sh-tool:influenceLevel %s ;
    sh-tool:supportLevel %s .

`, escapeTurtleID(id), quoteTurtle(name), quoteTurtle(title),
			quoteTurtle(dept), quoteTurtle(email),
			quoteTurtle(influence), quoteTurtle(support)))
	}

	// Export relationships
	relRows, err := s.db.Conn().Query(
		`SELECT id, from_stakeholder_id, to_stakeholder_id, type, strength FROM relationships`)
	if err == nil {
		defer relRows.Close()
		for relRows.Next() {
			var id, from, to, relType, strength string
			if relRows.Scan(&id, &from, &to, &relType, &strength) == nil {
				predicate := mapRelationshipPredicate(relType)
				sb.WriteString(fmt.Sprintf(`sh-tool:stakeholder-%s %s sh-tool:stakeholder-%s .
`,
					escapeTurtleID(from), predicate, escapeTurtleID(to)))
			}
		}
		sb.WriteString("\n")
	}

	_, err = io.WriteString(w, sb.String())
	return err
}

func quoteTurtle(s string) string {
	// Escape special characters in Turtle string literals
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "\n", "\\n")
	return "\"" + s + "\""
}

func escapeTurtleID(id string) string {
	return strings.ReplaceAll(id, "-", "")
}

func mapRelationshipPredicate(relType string) string {
	switch relType {
	case "reports_to":
		return "co-bus:reportsTo"
	case "influences":
		return "sh-tool:influences"
	case "allied_with":
		return "sh-tool:alliedWith"
	case "conflicts_with":
		return "sh-tool:conflictsWith"
	default:
		return "sh-tool:relatedTo"
	}
}
