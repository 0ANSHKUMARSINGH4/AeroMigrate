package com.aeromigrate.controller;

import com.aeromigrate.dto.ExecutionRequest;
import com.aeromigrate.dto.MigrationRequest;
import com.aeromigrate.dto.MigrationResult;
import com.aeromigrate.dto.ProposalResponse;
import com.aeromigrate.dto.ProposedMigration;
import com.aeromigrate.dto.TableInfo;
import com.aeromigrate.entity.MigrationHistory;
import com.aeromigrate.repository.MigrationHistoryRepository;
import com.aeromigrate.service.MigrationAgent;
import com.aeromigrate.service.SchemaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MigrationController {

    private static final Logger log = LoggerFactory.getLogger(MigrationController.class);

    @Autowired
    private MigrationAgent migrationAgent;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private MigrationHistoryRepository historyRepository;

    /**
     * Step 1: Generates a proposed migration script (up & down) but does NOT execute it.
     */
    @PostMapping("/migrate")
    public ResponseEntity<ProposalResponse> migrate(@RequestBody MigrationRequest request) {
        log.info("Received request to propose migration for command: '{}'", request.getCommand());
        
        List<String> timeline = new ArrayList<>();
        timeline.add("🔍 Inspecting current database schema...");
        
        if (request.getCommand() == null || request.getCommand().trim().isEmpty()) {
            timeline.add("❌ Proposed command is empty.");
            ProposalResponse err = new ProposalResponse(false, null, timeline, "Migration command cannot be empty");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            timeline.add("🤖 Invoking AI Agent to generate up/down SQL DDL proposal...");
            ProposedMigration proposal = migrationAgent.proposeMigration(request.getCommand());
            timeline.add("📋 Migration proposal successfully generated.");
            
            if (proposal.isDestructive()) {
                timeline.add("⚠️ WARNING: Destructive SQL statement detected (e.g. DROP or TRUNCATE). Safety gate activated.");
            } else {
                timeline.add("👉 Safety checks passed. No destructive DDL statements detected.");
            }

            ProposalResponse response = new ProposalResponse(true, proposal, timeline, null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate migration proposal", e);
            timeline.add("❌ AI proposal generation failed: " + e.getMessage());
            ProposalResponse err = new ProposalResponse(false, null, timeline, e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    /**
     * Step 2: Executes the approved migration SQL, logs history, and generates Java ORM entities.
     */
    @PostMapping("/execute")
    public ResponseEntity<MigrationResult> execute(@RequestBody ExecutionRequest request) {
        log.info("Received request to execute approved migration: '{}'", request.getDescription());
        
        if (request.getUpScript() == null || request.getUpScript().trim().isEmpty()) {
            MigrationResult err = new MigrationResult();
            err.setSuccess(false);
            err.setErrorMessage("Up script cannot be empty");
            err.getTimeline().add("❌ Up script is empty. Execution aborted.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            MigrationResult result = migrationAgent.executeMigration(
                    request.getUpScript(),
                    request.getDownScript(),
                    request.getDescription()
            );
            if (result.isSuccess()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (Exception e) {
            log.error("Execution of migration failed critically", e);
            MigrationResult criticalError = new MigrationResult();
            criticalError.setSuccess(false);
            criticalError.setErrorMessage("Critical execution error: " + e.getMessage());
            criticalError.getTimeline().add("❌ Critical execution error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(criticalError);
        }
    }

    /**
     * Step 3: Rollback a specific migration version.
     */
    @PostMapping("/rollback/{versionId}")
    public ResponseEntity<MigrationResult> rollback(@PathVariable Long versionId) {
        log.info("Received request to rollback migration history ID: {}", versionId);
        try {
            MigrationResult result = migrationAgent.rollback(versionId);
            if (result.isSuccess()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (Exception e) {
            log.error("Rollback of migration failed critically", e);
            MigrationResult criticalError = new MigrationResult();
            criticalError.setSuccess(false);
            criticalError.setErrorMessage("Critical rollback error: " + e.getMessage());
            criticalError.getTimeline().add("❌ Critical rollback error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(criticalError);
        }
    }

    /**
     * Returns the list of all applied/rolled back migrations in the history.
     */
    @GetMapping("/history")
    public ResponseEntity<List<MigrationHistory>> getHistory() {
        log.info("Received request to fetch migration history");
        try {
            List<MigrationHistory> history = historyRepository.findAllByOrderByAppliedAtDesc();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Failed to fetch migration history", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Fetches the current database schema representation.
     */
    @GetMapping("/schema")
    public ResponseEntity<Map<String, TableInfo>> getSchema() {
        log.info("Received request to fetch current schema");
        try {
            Map<String, TableInfo> schema = schemaService.getSchema();
            return ResponseEntity.ok(schema);
        } catch (Exception e) {
            log.error("Failed to fetch schema", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
