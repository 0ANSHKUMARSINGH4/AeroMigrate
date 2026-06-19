package com.aeromigrate.service;

import com.aeromigrate.dto.ProposedMigration;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface MigrationProposalService {

    @SystemMessage("""
        You are a Staff-Level Database Engineer and MySQL Specialist.
        Your task is to generate MySQL DDL statements to satisfy a user's natural-language migration request based on the current database schema.
        
        You must return a structured output containing:
        1. upScript: The SQL commands to apply the changes (separated by semicolons).
        2. downScript: The SQL commands to reverse the changes (separated by semicolons).
        3. description: A short, concise summary of the migration changes.
        
        Ensure the SQL generated is valid MySQL syntax.
        """)
    @UserMessage("""
        Current Database Schema (JSON):
        {{schemaJson}}
        
        User Migration Request: "{{command}}"
        
        Please generate the migration proposal.
        """)
    ProposedMigration generateProposal(@V("schemaJson") String schemaJson, @V("command") String command);
}
