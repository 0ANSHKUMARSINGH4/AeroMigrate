package com.aeromigrate.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AiModelFactory {

    private static final Logger log = LoggerFactory.getLogger(AiModelFactory.class);

    @Value("${aeromigrate.ai.provider:gemini}")
    private String provider;

    @Value("${aeromigrate.ai.api-key:}")
    private String geminiApiKey;

    @Value("${aeromigrate.ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${aeromigrate.ai.model-name:gemini-1.5-flash}")
    private String modelName;

    /**
     * Creates a ChatLanguageModel instance on-demand.
     */
    public ChatLanguageModel createModel() {
        if ("openai".equalsIgnoreCase(provider)) {
            log.info("Creating OpenAI Chat Model with model: {}", modelName);
            String apiKey = (openaiApiKey == null || openaiApiKey.trim().isEmpty()) 
                    ? System.getenv("OPENAI_API_KEY") 
                    : openaiApiKey;
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalStateException("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable or configure it in application.properties.");
            }
            return OpenAiChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName != null && !modelName.isEmpty() ? modelName : "gpt-4o")
                    .temperature(0.0)
                    .build();
        } else {
            log.info("Creating Google Gemini Chat Model with model: {}", modelName);
            String apiKey = (geminiApiKey == null || geminiApiKey.trim().isEmpty()) 
                    ? System.getenv("GEMINI_API_KEY") 
                    : geminiApiKey;
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalStateException("Gemini API key is missing. Please set the GEMINI_API_KEY environment variable or configure it in application.properties.");
            }
            return GoogleAiGeminiChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName != null && !modelName.isEmpty() ? modelName : "gemini-1.5-flash")
                    .temperature(0.0)
                    .build();
        }
    }
}
