package com.aeromigrate.dto;

public class ColumnInfo {
    private String name;
    private String type;
    private String columnType;
    private boolean nullable;
    private boolean primaryKey;
    private String defaultValue;
    private String extra;

    public ColumnInfo() {}

    public ColumnInfo(String name, String type, String columnType, boolean nullable, boolean primaryKey, String defaultValue, String extra) {
        this.name = name;
        this.type = type;
        this.columnType = columnType;
        this.nullable = nullable;
        this.primaryKey = primaryKey;
        this.defaultValue = defaultValue;
        this.extra = extra;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getColumnType() {
        return columnType;
    }

    public void setColumnType(String columnType) {
        this.columnType = columnType;
    }

    public boolean isNullable() {
        return nullable;
    }

    public void setNullable(boolean nullable) {
        this.nullable = nullable;
    }

    public boolean isPrimaryKey() {
        return primaryKey;
    }

    public void setPrimaryKey(boolean primaryKey) {
        this.primaryKey = primaryKey;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getExtra() {
        return extra;
    }

    public void setExtra(String extra) {
        this.extra = extra;
    }
}
