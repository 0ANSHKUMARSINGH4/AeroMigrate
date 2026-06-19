package com.aeromigrate.dto;

public class MigrationRequest {
    private String command;

    public MigrationRequest() {}

    public MigrationRequest(String command) {
        this.command = command;
    }

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }
}
