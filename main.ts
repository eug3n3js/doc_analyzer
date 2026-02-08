import * as path from "path";
import "dotenv/config";
import { VertexAIService } from "./vertex_ai";
import { DocumentAnalyzer } from "./document_analyzer";
import { ConsoleInterface } from "./console_interface";

async function main(): Promise<void> {
    const projectId: string = process.env.PROJECT_ID ?? "";
    const location: string = process.env.LOCATION ?? "";
    const keyFilePath: string = path.join(__dirname, process.env.KEY_FILE_PATH);

    const vertexService = new VertexAIService(projectId, location, keyFilePath);
    const documentAnalyzer = new DocumentAnalyzer(vertexService);
    const consoleInterface = new ConsoleInterface(documentAnalyzer);

    await consoleInterface.run();
}

main();
