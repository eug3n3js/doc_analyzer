import * as path from "path";
import { convertDocxToPdf, convertPdfToJpg, extractTextFromImage, cleanupDirs } from "./parse_utils";
import { VertexAIService, Document } from "./vertex_ai";
import { DocumentSorter } from "./document_sorter";


export class DocumentAnalyzer {
    private vertex_service: VertexAIService;
    private sorter: DocumentSorter;
    readonly langs: string = "ukr+eng";
    readonly output_dir: string = "./converted";
    readonly temp_images_dir: string = "./temp_images";

    constructor(vertex_service: VertexAIService, sorter: DocumentSorter) {
        this.vertex_service = vertex_service;
        this.sorter = sorter;
    }

    public async read_document(filePath: string): Promise<Document> {
        console.log(`[Analyzer] Processing file: ${filePath}`);
        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath);

        try {
            if (ext === ".docx") {
                console.log("[Analyzer] Type: DOCX. Converting to PDF first...");
                const pdfPath = await convertDocxToPdf(filePath, this.output_dir);
                console.log(`[Analyzer] DOCX converted to PDF: ${pdfPath}`);
                const images = await convertPdfToJpg(pdfPath, this.temp_images_dir);
                console.log(`[Analyzer] PDF converted to images. Count: ${images.length}`);
                const text = await extractTextFromImage(images, this.langs);
                console.log(`[Analyzer] OCR finished. Text length: ${text.length}`);
                const typeName = this.sorter.categorize(baseName);
                console.log(`[Analyzer] Document type: ${typeName === "Additional" ? baseName : typeName}`);    
                return { name: typeName === "Additional" ? baseName : typeName , text };
            } else {
                console.log("[Analyzer] Type: PDF. Converting to images...");
                const images = await convertPdfToJpg(filePath, this.temp_images_dir);
                console.log(`[Analyzer] PDF converted to images. Count: ${images.length}`);
                const text = await extractTextFromImage(images, this.langs);
                console.log(`[Analyzer] OCR finished. Text length: ${text.length}`);
                const typeName = this.sorter.categorize(baseName);
                console.log(`[Analyzer] Document type: ${typeName === "Additional" ? baseName : typeName}`);
                return { name: typeName === "Additional" ? baseName : typeName , text };  
            }
        } catch (error) {
            throw error;
        } finally {
            await cleanupDirs([this.temp_images_dir, this.output_dir]);
        }
    }

    public async analyze_document(documents: Document[], mode: number): Promise<string> {
        switch (mode) {
            case 1:
                return this.vertex_service.first_check(documents);
            case 2:
                return this.vertex_service.second_check(documents);
            case 3:
                return this.vertex_service.third_check(documents);
            case 4:
                return this.vertex_service.fourth_check(documents);
            
        }
    }
}
