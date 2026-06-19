package com.aeromigrate.service;

import com.aeromigrate.dto.ColumnInfo;
import com.aeromigrate.dto.TableInfo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SchemaServiceTest {

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String TEST_TABLE = "test_verification_table";

    @BeforeEach
    @AfterEach
    public void cleanUp() {
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS " + TEST_TABLE);
        } catch (Exception e) {
            // Ignore if doesn't exist
        }
    }

    @Test
    public void testExecuteSqlAndGetSchema() {
        // 1. Initial schema check (test table shouldn't exist)
        Map<String, TableInfo> schemaBefore = schemaService.getSchema();
        assertFalse(schemaBefore.containsKey(TEST_TABLE), "Test table should not exist initially");

        // 2. Execute DDL to create table
        String ddl = String.format(
            "CREATE TABLE %s (" +
            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
            "  title VARCHAR(100) NOT NULL," +
            "  description TEXT," +
            "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ");", TEST_TABLE
        );
        schemaService.executeRawSql(ddl);

        // 3. Query schema and verify table and columns metadata
        Map<String, TableInfo> schemaAfter = schemaService.getSchema();
        assertTrue(schemaAfter.containsKey(TEST_TABLE), "Test table should be created");

        TableInfo tableInfo = schemaAfter.get(TEST_TABLE);
        assertEquals(TEST_TABLE, tableInfo.getTableName());
        assertEquals(4, tableInfo.getColumns().size(), "Should have 4 columns");

        // Verify ID column
        ColumnInfo idCol = tableInfo.getColumns().stream()
                .filter(c -> "id".equals(c.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(idCol);
        assertTrue(idCol.isPrimaryKey());
        assertFalse(idCol.isNullable());
        assertTrue(idCol.getExtra().contains("auto_increment"));

        // Verify Title column
        ColumnInfo titleCol = tableInfo.getColumns().stream()
                .filter(c -> "title".equals(c.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(titleCol);
        assertFalse(titleCol.isPrimaryKey());
        assertFalse(titleCol.isNullable());
        assertEquals("varchar", titleCol.getType());

        // Verify Description column
        ColumnInfo descCol = tableInfo.getColumns().stream()
                .filter(c -> "description".equals(c.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(descCol);
        assertTrue(descCol.isNullable());
        assertEquals("text", descCol.getType());
    }
}
