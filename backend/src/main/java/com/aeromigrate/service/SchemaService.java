package com.aeromigrate.service;

import com.aeromigrate.dto.ColumnInfo;
import com.aeromigrate.dto.ForeignKeyInfo;
import com.aeromigrate.dto.TableInfo;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SchemaService {

    private static final Logger log = LoggerFactory.getLogger(SchemaService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Ensures the aeromigrate_history table exists in the database.
     */
    @PostConstruct
    public void init() {
        log.info("Initializing SchemaService - ensuring aeromigrate_history table exists");
        String createHistoryTableSql = """
            CREATE TABLE IF NOT EXISTS aeromigrate_history (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                version VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                up_script TEXT NOT NULL,
                down_script TEXT NOT NULL,
                applied_at TIMESTAMP NOT NULL,
                status VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """;
        try {
            jdbcTemplate.execute(createHistoryTableSql);
            log.info("aeromigrate_history table checked/created successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize aeromigrate_history table", e);
        }
    }

    /**
     * Executes one or more raw SQL commands.
     * Splits multiple statements by ';' and executes them sequentially.
     */
    @Transactional
    public void executeRawSql(String sql) {
        log.info("Executing raw SQL: {}", sql);
        if (sql == null || sql.trim().isEmpty()) {
            return;
        }

        // Split by semicolon, but be careful with nested statements if any (simple split works for standard migrations)
        String[] statements = sql.split(";");
        for (String stmt : statements) {
            String trimmed = stmt.trim();
            if (!trimmed.isEmpty()) {
                log.debug("Executing statement: {}", trimmed);
                jdbcTemplate.execute(trimmed);
            }
        }
    }

    /**
     * Queries INFORMATION_SCHEMA and returns a structured representation of all tables and columns.
     * Excludes system tables and the migration history table itself to avoid cluttering the visualizer.
     */
    public Map<String, TableInfo> getSchema() {
        log.info("Fetching current database schema from INFORMATION_SCHEMA");
        Map<String, TableInfo> schema = new LinkedHashMap<>();

        // 1. Fetch all columns and associate with tables
        String columnsQuery = """
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                DATA_TYPE, 
                COLUMN_TYPE, 
                IS_NULLABLE, 
                COLUMN_KEY, 
                COLUMN_DEFAULT, 
                EXTRA 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'aeromigrate_sandbox' 
              AND TABLE_NAME != 'aeromigrate_history'
            ORDER BY TABLE_NAME, ORDINAL_POSITION;
            """;

        jdbcTemplate.query(columnsQuery, rs -> {
            String tableName = rs.getString("TABLE_NAME");
            String columnName = rs.getString("COLUMN_NAME");
            String dataType = rs.getString("DATA_TYPE");
            String columnType = rs.getString("COLUMN_TYPE");
            boolean nullable = "YES".equalsIgnoreCase(rs.getString("IS_NULLABLE"));
            boolean isPrimary = "PRI".equalsIgnoreCase(rs.getString("COLUMN_KEY"));
            String defaultValue = rs.getString("COLUMN_DEFAULT");
            String extra = rs.getString("EXTRA");

            TableInfo table = schema.computeIfAbsent(tableName, k -> new TableInfo(tableName));

            ColumnInfo col = new ColumnInfo(columnName, dataType, columnType, nullable, isPrimary, defaultValue, extra);

            table.getColumns().add(col);
        });

        // 2. Fetch all foreign keys
        String fkQuery = """
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = 'aeromigrate_sandbox' 
              AND REFERENCED_TABLE_NAME IS NOT NULL
              AND TABLE_NAME != 'aeromigrate_history';
            """;

        jdbcTemplate.query(fkQuery, rs -> {
            String tableName = rs.getString("TABLE_NAME");
            String columnName = rs.getString("COLUMN_NAME");
            String constraintName = rs.getString("CONSTRAINT_NAME");
            String refTable = rs.getString("REFERENCED_TABLE_NAME");
            String refColumn = rs.getString("REFERENCED_COLUMN_NAME");

            TableInfo table = schema.get(tableName);
            if (table != null) {
                ForeignKeyInfo fk = new ForeignKeyInfo(columnName, constraintName, refTable, refColumn);
                table.getForeignKeys().add(fk);
            }
        });

        return schema;
    }
}
