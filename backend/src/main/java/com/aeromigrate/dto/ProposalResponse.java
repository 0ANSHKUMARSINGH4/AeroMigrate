package com.aeromigrate.dto;

import java.util.ArrayList;
import java.util.List;

public class ProposalResponse {
    private boolean success;
    private ProposedMigration proposal;
    private List<String> timeline = new ArrayList<>();
    private String errorMessage;

    public ProposalResponse() {}

    public ProposalResponse(boolean success, ProposedMigration proposal, List<String> timeline, String errorMessage) {
        this.success = success;
        this.proposal = proposal;
        this.timeline = timeline != null ? timeline : new ArrayList<>();
        this.errorMessage = errorMessage;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public ProposedMigration getProposal() {
        return proposal;
    }

    public void setProposal(ProposedMigration proposal) {
        this.proposal = proposal;
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
