import {GoogleGenerativeAI} from "@google/generative-ai";
import { cfg } from './config.js';

const genAI= new GoogleGenerativeAI(cfg.geminiApiKey);
const model =  genAI.getGenerativeModel({model: 'gemini-1.5-flash'});

export async function generatePost(topic){
    const prompt = `
        You are a Substack writer. Write a concise, well-structured post on the topic:
        "${topic}"

        Guidelines:
        - Title: Catchy and clear (<= 80 chars). Put it on the first line prefixed with "TITLE: ".
        - Subtitle: one sentence. Put on the second line prefixed with "SUBTITLE: ".
        - Body: 600-900 words. Use short paragraphs, subheadings (##), bullet points where useful.
        - Tone: informative, friendly, Indian audience-friendly examples when relevant.
        - Add a short CTA at the end for comments/subscriptions.
        Do NOT include code fences or markdown backticks.`;

        const res = await model.generateContent(prompt);
        const text = res.response.text();

        // Extract title and subtitle from the response
        const titleMatch = text.match(/^TITLE:\s*(.+)$/m);
        const subtitleMatch = text.match(/^SUBTITLE:\s*(.+)$/m);

        const title = titleMatch ? titleMatch[1].trim() : topic;
        const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

        //body is everything after the first two lines
        const cleaned = text
            .replace(/^TITLE:.*$/m, '')
            .replace(/^SUBTITLE:.*$/m, '')
            .trim();

        return { title, subtitle, body: cleaned };
}