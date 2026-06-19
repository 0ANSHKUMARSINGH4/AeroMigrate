package com.aeromigrate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "aeromigrate_history")
public class MigrationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String version;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "up_script", columnDefinition = "TEXT", nullable = false)
    private String upScript;

    @Column(name = "down_script", columnDefinition = "TEXT", nullable = false)
    private String downScript;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(nullable = false)
    private String status; // APPLIED, ROLLED_BACK

    public MigrationHistory() {}

    public MigrationHistory(String version, String description, String upScript, String downScript, LocalDateTime appliedAt, String status) {
        this.version = version;
        this.description = description;
        this.upScript = upScript;
        this.downScript = downScript;
        this.appliedAt = appliedAt;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
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

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
