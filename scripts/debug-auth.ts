
import { config } from 'dotenv';
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";

// Load Env
const envPath = path.resolve(process.cwd(), ".env");
config({ path: envPath });

async function checkAuth() {
    console.log("🔐 Checking OpenAI Authentication...");

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        console.error("❌ ERROR: OPENAI_API_KEY is missing from .env");
        return;
    }

    console.log(`🔑 Key found: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
    console.log(`📏 Key length: ${key.length}`);

    // Check for common formatting errors
    if (key.includes(' ')) {
        console.warn("⚠️ WARNING: Key contains spaces!");
    }
    if (key.includes('"') || key.includes("'")) {
        console.warn("⚠️ WARNING: Key contains quotes!");
    }

    // Try a simple call
    try {
        const llm = new ChatOpenAI({
            openAIApiKey: key,
            modelName: "gpt-3.5-turbo", // Use cheap model for check
            maxRetries: 0
        });

        console.log("📡 Sending test request to OpenAI...");
        const response = await llm.invoke("Hello");
        console.log("✅ SUCCESS: Authentication working!");
    } catch (error) {
        console.error("\n❌ AUTHENTICATION FAILED!");
        console.error("The API Key in your .env file is invalid or expired.");
        console.error("Error details:", error.message);
    }
}

checkAuth();
