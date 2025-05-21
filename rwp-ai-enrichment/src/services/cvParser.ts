/**
 * CV Parser Service
 *
 * This service is responsible for parsing CVs and extracting structured data.
 */

import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { createReadStream } from 'fs'
import { extractResumeData } from '../lib/openai'
import pdf from 'pdf-parse'
import { parse as parseHtml } from 'node-html-parser'

/**
 * Extract text from a PDF file
 * @param filePath The path to the PDF file
 * @returns The extracted text
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdf(dataBuffer)
    return data.text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw error
  }
}

/**
 * Extract text from an HTML file
 * @param filePath The path to the HTML file
 * @returns The extracted text
 */
async function extractTextFromHtml(filePath: string): Promise<string> {
  try {
    const html = fs.readFileSync(filePath, 'utf8')
    const root = parseHtml(html)

    // Remove script and style elements
    root.querySelectorAll('script, style').forEach((el) => el.remove())

    // Get the text content
    return root.text.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.error('Error extracting text from HTML:', error)
    throw error
  }
}

/**
 * Extract text from a text file
 * @param filePath The path to the text file
 * @returns The extracted text
 */
async function extractTextFromTxt(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.error('Error extracting text from text file:', error)
    throw error
  }
}

/**
 * Download a file from a URL
 * @param url The URL of the file
 * @param outputPath The path to save the file to
 * @returns The path to the downloaded file
 */
async function downloadFile(url: string, outputPath: string): Promise<string> {
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    })

    const writer = fs.createWriteStream(outputPath)

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath))
      writer.on('error', reject)
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

/**
 * Extract text from a file
 * @param filePath The path to the file
 * @returns The extracted text
 */
async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    const extension = path.extname(filePath).toLowerCase()

    switch (extension) {
      case '.pdf':
        return extractTextFromPdf(filePath)
      case '.html':
      case '.htm':
        return extractTextFromHtml(filePath)
      case '.txt':
      case '.md':
      case '.rtf':
        return extractTextFromTxt(filePath)
      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  } catch (error) {
    console.error('Error extracting text from file:', error)
    throw error
  }
}

/**
 * Parse a CV from a URL
 * @param url The URL of the CV
 * @returns The parsed CV data
 */
export async function parseCvFromUrl(url: string): Promise<any> {
  try {
    // Create a temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    // Generate a unique filename
    const filename = `cv_${Date.now()}${path.extname(url)}`
    const outputPath = path.join(tempDir, filename)

    // Download the file
    await downloadFile(url, outputPath)

    // Extract text from the file
    const text = await extractTextFromFile(outputPath)

    // Delete the temporary file
    fs.unlinkSync(outputPath)

    // Parse the CV text
    return parseCvText(text)
  } catch (error) {
    console.error('Error parsing CV from URL:', error)
    throw error
  }
}

/**
 * Parse CV text
 * @param text The CV text
 * @returns The parsed CV data
 */
export async function parseCvText(text: string): Promise<any> {
  try {
    // Use OpenAI to extract structured data from the CV
    const resumeData = await extractResumeData(text)

    return resumeData
  } catch (error) {
    console.error('Error parsing CV text:', error)
    throw error
  }
}

export default {
  parseCvFromUrl,
  parseCvText,
  extractTextFromFile,
}
