package com.aeromigrate.dto;

public class ForeignKeyInfo {
    private String columnName;
    private String constraintName;
    private String referencedTable;
    private String referencedColumn;

    public ForeignKeyInfo() {}

    public ForeignKeyInfo(String columnName, String constraintName, String referencedTable, String referencedColumn) {
        this.columnName = columnName;
        this.constraintName = constraintName;
        this.referencedTable = referencedTable;
        this.referencedColumn = referencedColumn;
    }

    public String getColumnName() {
        return columnName;
    }

    public void setColumnName(String columnName) {
        this.columnName = columnName;
    }

    public String getConstraintName() {
        return constraintName;
    }

    public void setConstraintName(String constraintName) {
        this.constraintName = constraintName;
    }

    public String getReferencedTable() {
        return referencedTable;
    }

    public void setReferencedTable(String referencedTable) {
        this.referencedTable = referencedTable;
    }

    public String getReferencedColumn() {
        return referencedColumn;
    }

    public void setReferencedColumn(String referencedColumn) {
        this.referencedColumn = referencedColumn;
    }
}
