import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { createWorker } from 'tesseract.js';
import pdf from 'pdf-poppler';
import libre from 'libreoffice-convert';

export async function convertPdfToJpg(
    pdfPath: string, 
    outputDir: string,
    scale: number = 2.5
): Promise<string[]> {
    const imagePaths: string[] = [];

    const pdfDir = path.dirname(pdfPath);
    const tempPdfPath = path.join(pdfDir, "temp_input.pdf");

    try {
        console.log(`[PDF->IMG] Start converting PDF to images: ${pdfPath}`);
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`File not found: ${pdfPath}`);
        }

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.copyFileSync(pdfPath, tempPdfPath);
        console.log(`[PDF->IMG] Created temporary PDF copy: ${tempPdfPath}`);


        const basePixelWidth = 2500;
        const pixelWidth = Math.round(basePixelWidth * scale);
        const minPixelWidth = 3000;
        const finalPixelWidth = Math.max(pixelWidth, minPixelWidth);
        
        
        const options: pdf.PopplerOptions = {
            format: 'png',
            out_dir: outputDir,
            out_prefix: 'page',
            page: null,
            scale: finalPixelWidth
        };

        await pdf.convert(tempPdfPath, options);
        console.log(`[PDF->IMG] Conversion finished. Output directory: ${outputDir}`);
        
        const files = fs.readdirSync(outputDir);
        const imageFiles = files
            .filter(file => file.startsWith('page') && file.endsWith('.png'))
            .sort()
            .map(file => path.join(outputDir, file));
        
        imagePaths.push(...imageFiles);
        console.log(`[PDF->IMG] Images found: ${imageFiles.length}`);
        
        return imagePaths;
        
    } catch (error) {
        throw new Error("Failed to convert PDF to images: " + String(error));
    } finally {
        try {
            if (fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath);
                console.log(`[PDF->IMG] Temporary PDF copy deleted: ${tempPdfPath}`);
            }
        } catch {
        }
    }
}

export async function extractTextFromImage(
    imagePaths: string[],
    languages: string = 'ukr+eng'
): Promise<string> {
    const worker = await createWorker(languages);
    let allText = '';
    
    try {     
        console.log(`[OCR] Start OCR. Pages: ${imagePaths.length}, languages: ${languages}`);
        for (let i = 0; i < imagePaths.length; i++) {
            const imagePath = imagePaths[i];
            const pageNum = i + 1;
            if (!fs.existsSync(imagePath)) {
                continue;
            }
            console.log(`[OCR] Processing page ${pageNum}: ${imagePath}`);
            const { data: { text } } = await worker.recognize(imagePath);
            console.log(`[OCR] Done: page ${pageNum}, text length: ${text.length}`);
            allText += text;
        }
        console.log(`[OCR] OCR finished. Total text length: ${allText.length}`);
        return allText.trim();
    } catch (error) {
        throw new Error("Failed to extract text from images: " + String(error));
    } finally {
        await worker.terminate();   
    }
}

export async function convertDocxToPdf(
    docxPath: string,
    outputDir: string
): Promise<string> {
    if (!fs.existsSync(docxPath)) {
        throw new Error(`File not found: ${docxPath}`);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const docxBuffer = await fsPromises.readFile(docxPath);

        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            libre.convert(docxBuffer, ".pdf", undefined, (err, done) => {
                if (err) {
                    return reject(err);
                }
                resolve(done);
            });
        });

        const fileName = path.basename(docxPath, ".docx") + ".pdf";
        const pdfOutputPath = path.join(outputDir, fileName);

        await fsPromises.writeFile(pdfOutputPath, pdfBuffer);

        return path.resolve(pdfOutputPath);
    } catch (error) {
        throw new Error("Failed to convert DOCX to PDF: " + String(error));
    }
}

export async function cleanupDirs(dirs: string[]): Promise<void> {
    for (const dir of dirs) {
        const absDir = path.resolve(dir);
        if (!fs.existsSync(absDir)) {
            continue;
        }
        try {
            const entries = await fsPromises.readdir(absDir);
            for (const name of entries) {
                const fullPath = path.join(absDir, name);
                try {
                    const stat = await fsPromises.stat(fullPath);
                    if (stat.isDirectory()) {
                        await cleanupDirs([fullPath]);
                    } else {
                        await fsPromises.unlink(fullPath);
                    }
                } catch {
                }
            }

            await fsPromises.rmdir(absDir);
            console.log(`[CLEANUP] Deleted temporary directory: ${absDir}`);
        } catch (error) {
            console.log(`[CLEANUP] Failed to delete directory ${absDir}: ${String(error)}`);
        }
    }
}
