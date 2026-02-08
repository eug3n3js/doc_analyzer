import { VertexAI } from "@google-cloud/vertexai";
import prompts from "./prompts.json";


export interface Document {
    name: string;
    text: string;
}

export class VertexAIService {

    private vertex_ai: VertexAI;


    constructor(
        project: string, 
        location: string,
        keyFilePath: string
    ) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
        this.vertex_ai = new VertexAI({ project: project, location: location });
    }

    private async __run_request(prompt: string, user_documents: Document[], model_name: string = "gemini-2.5-pro"): Promise<string> {
        const model = this.vertex_ai.preview.getGenerativeModel({ 
            model: model_name,
            systemInstruction: {
                role: "system",
                parts: [{ text: prompt }]
            }
        });
        
        const documentParts = user_documents.map(doc => ({
            text: `[Документ: ${doc.name}]\n${doc.text}`
        }));
        
        const request = {
            contents: [{ role: "user", parts: documentParts }],
        };
        const result = await model.generateContent(request);
        const response = await result.response;
        return response.candidates[0].content.parts[0].text;
    }

    public async first_check(user_documents: Document[]): Promise<string> {
        return this.__run_request(prompts.prompt1, user_documents);
    }

    public async second_check(user_documents: Document[]): Promise<string> {
        return this.__run_request(prompts.prompt2, user_documents);
    }

    public async third_check(user_documents: Document[]): Promise<string> {
        return this.__run_request(prompts.prompt3, user_documents);
    }

    public async fourth_check(user_documents: Document[]): Promise<string> {
        return this.__run_request(prompts.prompt4, user_documents);
    }
}