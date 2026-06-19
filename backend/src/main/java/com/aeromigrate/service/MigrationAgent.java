package com.aeromigrate.service;

import com.aeromigrate.config.AiModelFactory;
import com.aeromigrate.dto.ColumnInfo;
import com.aeromigrate.dto.EntityFile;
import com.aeromigrate.dto.ForeignKeyInfo;
import com.aeromigrate.dto.MigrationResult;
import com.aeromigrate.dto.ProposedMigration;
import com.aeromigrate.dto.TableInfo;
import com.aeromigrate.entity.MigrationHistory;
import com.aeromigrate.repository.MigrationHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MigrationAgent {

    private static final Logger log = LoggerFactory.getLogger(MigrationAgent.class);

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private AiModelFactory aiModelFactory;

    @Autowired
    private MigrationHistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Step 1: Generates a migration proposal based on user input and current schema.
     * Does not execute the migration.
     */
    public ProposedMigration proposeMigration(String userCommand) {
        log.info("Generating migration proposal for command: '{}'", userCommand);
        
        ChatLanguageModel chatModel = aiModelFactory.createModel();
        
        // 1. Fetch current schema state
        Map<String, TableInfo> currentSchema = schemaService.getSchema();
        String schemaJson;
        try {
            schemaJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(currentSchema);
        } catch (Exception e) {
            schemaJson = "{}";
            log.error("Failed to serialize schema", e);
        }

        // 2. Build LangChain4j AiService for structured output
        MigrationProposalService proposalService = AiServices.builder(MigrationProposalService.class)
                .chatLanguageModel(chatModel)
                .build();

        // 3. Generate proposal
        ProposedMigration proposal = proposalService.generateProposal(schemaJson, userCommand);
        
        // 4. Run normalized safety checking on upScript
        boolean isDestructive = checkDestructive(proposal.getUpScript());
        proposal.setDestructive(isDestructive);

        log.info("Migration proposal generated. Destructive flag: {}", isDestructive);
        return proposal;
    }

    /**
     * Helper to normalize upScript and verify safety requirements.
     */
    public boolean checkDestructive(String upScript) {
        if (upScript == null || upScript.trim().isEmpty()) {
            return false;
        }
        // Normalize script: convert to uppercase and replace all multiple whitespaces with a single space
        String normalized = upScript.toUpperCase().replaceAll("\\s+", " ");
        
        // Perform keyword checks
        return normalized.contains("DROP TABLE") 
            || normalized.contains("DROP COLUMN") 
            || normalized.contains("TRUNCATE");
    }

    /**
     * Step 2: Executes the approved SQL, logs execution history, and generates JPA entities.
     * Note: Explicitly non-@Transactional to ensure MySQL DDL implicit commits complete 
     * before we insert history records.
     */
    public MigrationResult executeMigration(String upScript, String downScript, String description) {
        List<String> timeline = new ArrayList<>();
        timeline.add("⚡ Initiating execution of approved migration DDL...");

        // 1. Run DDL first (implicit commit)
        try {
            schemaService.executeRawSql(upScript);
            timeline.add("✅ SQL migration DDL executed successfully!");
        } catch (Exception e) {
            log.error("Failed to execute DDL", e);
            timeline.add("❌ DDL execution failed: " + e.getMessage());
            return new MigrationResult(false, upScript, schemaService.getSchema(), new ArrayList<>(), timeline, e.getMessage());
        }

        // 2. Save history record ONLY after DDL succeeds
        String version = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        MigrationHistory history = new MigrationHistory(
                version,
                description,
                upScript,
                downScript,
                LocalDateTime.now(),
                "APPLIED"
        );
        try {
            historyRepository.save(history);
            timeline.add("📝 Logged applied migration to history table (Version: " + version + ").");
        } catch (Exception e) {
            log.error("Failed to save migration history", e);
            timeline.add("⚠️ Failed to write to history tracking table: " + e.getMessage());
        }

        // 3. Query updated schema
        timeline.add("🔍 Fetching newly updated schema state...");
        Map<String, TableInfo> updatedSchema = schemaService.getSchema();
        String updatedSchemaJson;
        try {
            updatedSchemaJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(updatedSchema);
        } catch (Exception e) {
            updatedSchemaJson = "{}";
        }

        // 4. Generate JPA Entities
        timeline.add("☕ Generating updated Java @Entity (JPA) classes...");
        ChatLanguageModel chatModel = aiModelFactory.createModel();
        List<EntityFile> entities = generateOrmEntities(chatModel, updatedSchemaJson);
        timeline.add(String.format("✅ Successfully generated %d Java Entity classes.", entities.size()));

        return new MigrationResult(true, upScript, updatedSchema, entities, timeline, null);
    }

    /**
     * Performs a rollback of a specific migration.
     */
    public MigrationResult rollback(Long historyId) {
        List<String> timeline = new ArrayList<>();
        timeline.add(String.format("🔄 Initiating rollback request for history ID: %d...", historyId));

        // 1. Fetch history entry
        MigrationHistory history = historyRepository.findById(historyId).orElse(null);
        if (history == null) {
            timeline.add("❌ Migration history record not found.");
            return new MigrationResult(false, null, schemaService.getSchema(), new ArrayList<>(), timeline, "Migration history record not found");
        }

        if ("ROLLED_BACK".equalsIgnoreCase(history.getStatus())) {
            timeline.add("⚠️ This migration has already been rolled back.");
            return new MigrationResult(false, null, schemaService.getSchema(), new ArrayList<>(), timeline, "Migration already rolled back");
        }

        // 2. Execute down script (implicit commit)
        try {
            schemaService.executeRawSql(history.getDownScript());
            timeline.add("✅ Rollback DDL executed successfully!");
        } catch (Exception e) {
            log.error("Rollback execution failed", e);
            timeline.add("❌ Rollback execution failed: " + e.getMessage());
            return new MigrationResult(false, null, schemaService.getSchema(), new ArrayList<>(), timeline, e.getMessage());
        }

        // 3. Update status to ROLLED_BACK ONLY after DDL succeeds
        history.setStatus("ROLLED_BACK");
        historyRepository.save(history);
        timeline.add("📝 Updated migration history record status to ROLLED_BACK.");

        // 4. Fetch updated schema
        timeline.add("🔍 Fetching updated database schema state...");
        Map<String, TableInfo> updatedSchema = schemaService.getSchema();
        String updatedSchemaJson;
        try {
            updatedSchemaJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(updatedSchema);
        } catch (Exception e) {
            updatedSchemaJson = "{}";
        }

        // 5. Regenerate JPA Entities
        timeline.add("☕ Regenerating Java @Entity classes for rolled back schema...");
        ChatLanguageModel chatModel = aiModelFactory.createModel();
        List<EntityFile> entities = generateOrmEntities(chatModel, updatedSchemaJson);
        timeline.add(String.format("✅ Successfully regenerated %d Java Entity classes.", entities.size()));

        return new MigrationResult(true, history.getDownScript(), updatedSchema, entities, timeline, null);
    }

    /**
     * Calls the LLM to generate JPA entities based on the updated schema.
     */
    private List<EntityFile> generateOrmEntities(ChatLanguageModel chatModel, String schemaJson) {
        List<EntityFile> entityFiles = new ArrayList<>();

        String prompt = String.format(
            "You are a Staff-Level Java Architect. Generate modern Spring Boot 3.x JPA `@Entity` classes representing the following database schema.\n\n" +
            "Schema JSON:\n%s\n\n" +
            "Rules:\n" +
            "1. Use standard JPA annotations (@Entity, @Table, @Id, @GeneratedValue(strategy = GenerationType.IDENTITY), @Column, @ManyToOne, @JoinColumn, @OneToMany, etc.).\n" +
            "2. Generate standard Java files with appropriate imports, class definition, fields, constructors, and standard getters/setters. Do NOT use Lombok.\n" +
            "3. Format relationship fields correctly (e.g., if there's a foreign key in table A pointing to table B, make table A have a @ManyToOne pointing to B's Entity).\n" +
            "4. Respond with all entity files in a single output, separating each class block with this EXACT header marker:\n" +
            "--- FILE: ClassName.java ---\n" +
            " followed by the Java code for that class.\n" +
            "Do not output any introductory or summary text. Just the headers and the class code.",
            schemaJson
        );

        try {
            Response<AiMessage> response = chatModel.generate(UserMessage.from(prompt));
            String responseText = response.content().text();
            
            // Parse classes by file header markers
            String[] blocks = responseText.split("--- FILE: ");
            for (String block : blocks) {
                String trimmedBlock = block.trim();
                if (trimmedBlock.isEmpty()) {
                    continue;
                }

                int endHeaderIndex = trimmedBlock.indexOf(" ---");
                if (endHeaderIndex == -1) {
                    endHeaderIndex = trimmedBlock.indexOf("\n");
                }

                if (endHeaderIndex != -1) {
                    String fileName = trimmedBlock.substring(0, endHeaderIndex).trim();
                    String codeContent = trimmedBlock.substring(endHeaderIndex + 4).trim();
                    
                    if (codeContent.startsWith("```java")) {
                        codeContent = codeContent.substring(7);
                    } else if (codeContent.startsWith("```")) {
                        codeContent = codeContent.substring(3);
                    }
                    if (codeContent.endsWith("```")) {
                        codeContent = codeContent.substring(0, codeContent.length() - 3);
                    }
                    codeContent = codeContent.trim();

                    String className = fileName.replace(".java", "");
                    entityFiles.add(new EntityFile(className, codeContent));
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate ORM entities", e);
            entityFiles.add(new EntityFile("Error", "// Failed to generate entities: " + e.getMessage()));
        }

        return entityFiles;
    }
}
