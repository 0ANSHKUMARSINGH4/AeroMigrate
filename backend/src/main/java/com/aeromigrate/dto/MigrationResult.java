package com.aeromigrate.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MigrationResult {
    private boolean success;
    private String executedSql;
    private Map<String, TableInfo> newSchema;
    private List<EntityFile> javaEntities = new ArrayList<>();
    private List<String> timeline = new ArrayList<>();
    private String errorMessage;

    public MigrationResult() {}

    public MigrationResult(boolean success, String executedSql, Map<String, TableInfo> newSchema, List<EntityFile> javaEntities, List<String> timeline, String errorMessage) {
        this.success = success;
        this.executedSql = executedSql;
        this.newSchema = newSchema;
        this.javaEntities = javaEntities != null ? javaEntities : new ArrayList<>();
        this.timeline = timeline != null ? timeline : new ArrayList<>();
        this.errorMessage = errorMessage;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getExecutedSql() {
        return executedSql;
    }

    public void setExecutedSql(String executedSql) {
        this.executedSql = executedSql;
    }

    public Map<String, TableInfo> getNewSchema() {
        return newSchema;
    }

    public void setNewSchema(Map<String, TableInfo> newSchema) {
        this.newSchema = newSchema;
    }

    public List<EntityFile> getJavaEntities() {
        return javaEntities;
    }

    public void setJavaEntities(List<EntityFile> javaEntities) {
        this.javaEntities = javaEntities;
    }

    public List<String> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<String> timeline) {
        this.timeline = timeline;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
