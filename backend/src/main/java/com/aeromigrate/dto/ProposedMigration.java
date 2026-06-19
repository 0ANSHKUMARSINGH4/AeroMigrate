package com.aeromigrate.dto;

public class ProposedMigration {
    private String upScript;
    private String downScript;
    private String description;
    private boolean destructive;

    public ProposedMigration() {}

    public ProposedMigration(String upScript, String downScript, String description, boolean destructive) {
        this.upScript = upScript;
        this.downScript = downScript;
        this.description = description;
        this.destructive = destructive;
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

    public boolean isDestructive() {
        return destructive;
    }

    public void setDestructive(boolean destructive) {
        this.destructive = destructive;
    }
}
