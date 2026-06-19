package com.aeromigrate.dto;

import java.util.ArrayList;
import java.util.List;

public class TableInfo {
    private String tableName;
    private List<ColumnInfo> columns = new ArrayList<>();
    private List<ForeignKeyInfo> foreignKeys = new ArrayList<>();

    public TableInfo() {}

    public TableInfo(String tableName) {
        this.tableName = tableName;
    }

    public TableInfo(String tableName, List<ColumnInfo> columns, List<ForeignKeyInfo> foreignKeys) {
        this.tableName = tableName;
        this.columns = columns != null ? columns : new ArrayList<>();
        this.foreignKeys = foreignKeys != null ? foreignKeys : new ArrayList<>();
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public List<ColumnInfo> getColumns() {
        return columns;
    }

    public void setColumns(List<ColumnInfo> columns) {
        this.columns = columns;
    }

    public List<ForeignKeyInfo> getForeignKeys() {
        return foreignKeys;
    }

    public void setForeignKeys(List<ForeignKeyInfo> foreignKeys) {
        this.foreignKeys = foreignKeys;
    }
}
