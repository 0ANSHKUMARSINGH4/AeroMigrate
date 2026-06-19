package com.aeromigrate.dto;

public class ExecutionRequest {
    private String upScript;
    private String downScript;
    private String description;

    public ExecutionRequest() {}

    public ExecutionRequest(String upScript, String downScript, String description) {
        this.upScript = upScript;
        this.downScript = downScript;
        this.description = description;
    }

    public String getUpScript() {
        return upScript;
    }

    public void setUpScript(String upScript) {
        this.upScript = upScript;
    }

    public String getDownScript() {
        return downScript;
    }

    public void setDownScript(String downScript) {
        this.downScript = downScript;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
