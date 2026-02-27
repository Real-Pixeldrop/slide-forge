/**
 * SlideForge MVP - Serveur Express
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { generate } from '../engine/generate.js';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(projectRoot, 'app')));
app.use('/engine', express.static(join(projectRoot, 'engine')));

// Lire la clé API Gemini
const GEMINI_API_KEY = readFileSync('/Users/akligoudjil/.clawdbot/skills/gemini-design/api_key', 'utf-8').trim();

/**
 * Endpoint principal - Génération des slides
 */
app.post('/api/generate', async (req, res) => {
  try {
    console.log('🎯 Génération des slides...');
    const { content, brandKit } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Contenu manquant' });
    }

    // Utiliser le moteur de génération adapté pour HTML
    const slidesHtml = await generate({
      content: content,
      brandKit: brandKit || {},
      apiKey: GEMINI_API_KEY,
      format: 'html' // Nouveau paramètre pour générer du HTML
    });

    console.log('✅ Slides générées avec succès');
    res.json({ slides: slidesHtml });
    
  } catch (error) {
    console.error('❌ Erreur génération:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération', 
      message: error.message 
    });
  }
});

/**
 * Endpoint export PDF
 */
app.post('/api/export', async (req, res) => {
  try {
    console.log('📄 Export PDF...');
    const { slidesHtml, brandKit } = req.body;

    if (!slidesHtml) {
      return res.status(400).json({ error: 'HTML des slides manquant' });
    }

    // Générer le PDF avec Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Créer la page HTML complète avec le CSS
    const fullHtml = generateFullHtmlPage(slidesHtml, brandKit);
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    // Configuration PDF 16:9
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=presentation.pdf');
    res.send(pdf);

    console.log('✅ PDF généré avec succès');
    
  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'export PDF', 
      message: error.message 
    });
  }
});

/**
 * Génère la page HTML complète avec CSS pour l'export
 */
function generateFullHtmlPage(slidesHtml, brandKit) {
  const baseTheme = readFileSync(join(projectRoot, 'engine/themes/base/styles.css'), 'utf-8');
  
  const brandCss = generateBrandCss(brandKit);
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Présentation SlideForge</title>
  <style>
    ${baseTheme}
    ${brandCss}
    
    /* PDF specific styles */
    .slide {
      width: 297mm;
      height: 167mm;
      page-break-after: always;
      box-sizing: border-box;
      position: relative;
    }
    
    .slide:last-child {
      page-break-after: avoid;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: var(--sf-font);
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>
  `;
}

/**
 * Génère les variables CSS du brand kit
 */
function generateBrandCss(brandKit = {}) {
  return `
    :root {
      --brand-primary: ${brandKit.primaryColor || '#1a1a2e'};
      --brand-secondary: ${brandKit.secondaryColor || '#16213e'};
      --brand-accent: ${brandKit.accentColor || '#0f3460'};
      --brand-font: '${brandKit.font || 'Inter'}', sans-serif;
      --brand-font-heading: '${brandKit.fontHeading || brandKit.font || 'Inter'}', sans-serif;
      --brand-text: #333333;
      --brand-text-dark: #1a1a2e;
      --brand-bg: #ffffff;
      --brand-bg-dark: #0a0a1a;
    }
  `;
}

// Route principale - servir l'app
app.get('/', (req, res) => {
  res.sendFile(join(projectRoot, 'app/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SlideForge MVP lancé sur http://localhost:${PORT}`);
});