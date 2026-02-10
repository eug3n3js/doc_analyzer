import * as path from "path";
import "dotenv/config";
import { VertexAIService } from "./vertex_ai";
import { DocumentAnalyzer } from "./document_analyzer";
import { ConsoleInterface } from "./console_interface";
import { DocumentSorter } from "./document_sorter";

async function main(): Promise<void> {
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION;
    const keyFilePathEnv = process.env.KEY_FILE_PATH;

    if (!projectId || !location || !keyFilePathEnv) {
        console.error("Environment variables PROJECT_ID, LOCATION, and KEY_FILE_PATH must be set in .env");
        process.exit(1);
    }

    const keyFilePath = path.isAbsolute(keyFilePathEnv)
        ? keyFilePathEnv
        : path.join(__dirname, keyFilePathEnv);

    const vertexService = new VertexAIService(projectId, location, keyFilePath);
    const documentSorter = new DocumentSorter();
    const documentAnalyzer = new DocumentAnalyzer(vertexService, documentSorter);
    const consoleInterface = new ConsoleInterface(documentAnalyzer, documentSorter);
    
    try {
        await consoleInterface.run();
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

main();
