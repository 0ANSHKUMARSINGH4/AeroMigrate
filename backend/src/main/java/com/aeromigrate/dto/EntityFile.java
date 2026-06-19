package com.aeromigrate.dto;

public class EntityFile {
    private String className;
    private String code;

    public EntityFile() {}

    public EntityFile(String className, String code) {
        this.className = className;
        this.code = code;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
