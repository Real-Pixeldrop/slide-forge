/**
 * SlideForge - Moteur de génération
 * 
 * Prend du contenu brut + brand kit et génère une présentation Slidev
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Charge le prompt template et injecte les variables
 */
function buildPrompt(content, brandKit) {
  const template = readFileSync(
    join(__dirname, 'ai/prompts/structure-content.md'), 
    'utf-8'
  );
  
  return template
    .replace('{CONTENT}', content)
    .replace('{COMPANY_NAME}', brandKit.company || 'Entreprise')
    .replace('{PRIMARY_COLOR}', brandKit.primaryColor || '#1a1a2e')
    .replace('{SECONDARY_COLOR}', brandKit.secondaryColor || '#16213e')
    .replace('{FONT}', brandKit.font || 'Inter')
    .replace('{TONE}', brandKit.tone || 'professionnel');
}

/**
 * Appelle Gemini pour structurer le contenu en slides
 */
async function generateWithGemini(prompt, apiKey) {
  // Pour le MVP, on utilise un template statique pour tester
  // TODO: Remplacer par vraie API Gemini quand on aura la clé
  console.log('Utilisation du template de test (pas de vraie API Gemini pour le moment)');
  
  // Template de slides de test basé sur le prompt
  const testSlides = `
<div class="slide layout-cover">
  <h1>Présentation TechForge</h1>
  <h2>Résultats Q4 & Expansion Européenne</h2>
</div>

<div class="slide slidev-layout">
  <h1>Agenda</h1>
  <ul>
    <li>Résultats de performance</li>
    <li>Croissance client</li>
    <li>Innovation IA</li>
    <li>Objectifs 2024</li>
  </ul>
</div>

<div class="slide layout-stats">
  <h1>Résultats Q4</h1>
  <div class="stats-grid">
    <div class="stat">
      <div class="stat-value">+40%</div>
      <div class="stat-label">Trafic</div>
    </div>
    <div class="stat">
      <div class="stat-value">1500</div>
      <div class="stat-label">Nouveaux clients</div>
    </div>
    <div class="stat">
      <div class="stat-value">+25%</div>
      <div class="stat-label">Conversion</div>
    </div>
  </div>
</div>

<div class="slide layout-two-cols">
  <div>
    <h2>Innovation</h2>
    <ul>
      <li>Interface mobile optimisée</li>
      <li>IA pour recommandations</li>
      <li>UX repensée</li>
    </ul>
  </div>
  <div>
    <h2>Performance</h2>
    <ul>
      <li>Temps de chargement -50%</li>
      <li>Taux de rebond -30%</li>
      <li>Satisfaction client 95%</li>
    </ul>
  </div>
</div>

<div class="slide layout-quote">
  <blockquote>
    "L'innovation n'est pas seulement technique, elle est aussi humaine"
  </blockquote>
</div>

<div class="slide slidev-layout">
  <h1>Objectifs 2024</h1>
  <ul>
    <li>Expansion européenne</li>
    <li>Croissance 200% prévue</li>
    <li>3 nouveaux marchés</li>
    <li>Équipe internationale</li>
  </ul>
</div>

<div class="slide layout-end">
  <h1>Merci</h1>
  <p>Questions & Discussion</p>
  <p>contact@techforge-solutions.com</p>
</div>
  `;
  
  // TODO: Vraie API Gemini
  /*
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      })
    }
  );
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('Gemini n\'a pas retourné de contenu');
  }
  
  // Extraire le HTML entre les balises code si présent
  const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
  return htmlMatch ? htmlMatch[1] : text;
  */
  
  return testSlides.trim();
}

/**
 * Injecte les variables CSS du brand kit
 */
function generateThemeVars(brandKit) {
  return `
<style>
:root {
  --brand-primary: ${brandKit.primaryColor || '#1a1a2e'};
  --brand-secondary: ${brandKit.secondaryColor || '#16213e'};
  --brand-accent: ${brandKit.accentColor || '#0f3460'};
  --brand-font: '${brandKit.font || 'Inter'}', sans-serif;
  --brand-font-heading: '${brandKit.fontHeading || brandKit.font || 'Inter'}', sans-serif;
}
</style>
`;
}

/**
 * Pipeline principal
 */
async function generate(options = {}) {
  const {
    contentPath,
    brandKit = {},
    outputDir = join(__dirname, '..', 'output'),
    apiKey,
    format = 'markdown' // 'markdown' ou 'html'
  } = options;
  
  // 1. Lire le contenu
  const content = contentPath 
    ? readFileSync(contentPath, 'utf-8')
    : options.content || '';
  
  if (!content) {
    throw new Error('Aucun contenu fourni');
  }
  
  // 2. Construire le prompt adapté au format
  const prompt = format === 'html' 
    ? buildHtmlPrompt(content, brandKit)
    : buildPrompt(content, brandKit);
  
  // 3. Générer les slides via Gemini
  console.log('Génération des slides via Gemini...');
  const slidesContent = await generateWithGemini(prompt, apiKey);
  
  if (format === 'html') {
    // Pour le test, slidesContent est déjà du HTML brut, pas besoin de convertir
    // return convertToHtml(slidesContent, brandKit);
    return slidesContent; // HTML brut prêt à utiliser
  }
  
  // 4. Mode markdown (legacy)
  const themeVars = generateThemeVars(brandKit);
  const finalMarkdown = slidesContent + '\n' + themeVars;
  
  // 5. Sauvegarder
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = join(outputDir, 'slides.md');
  writeFileSync(outputPath, finalMarkdown, 'utf-8');
  
  console.log(`Présentation générée : ${outputPath}`);
  return outputPath;
}

/**
 * Prompt adapté pour générer du HTML
 */
function buildHtmlPrompt(content, brandKit) {
  const template = `# Prompt : Créer des slides HTML

Tu es un expert en design de présentations. Tu reçois du contenu brut et tu dois créer des slides HTML professionnelles avec les layouts SlideForge.

## Layouts disponibles et leur HTML :

### Cover (slide de couverture)
\`\`\`html
<div class="slide layout-cover">
  <h1>Titre principal</h1>
  <h2>Sous-titre</h2>
  ${brandKit.logo ? `<img src="${brandKit.logo}" class="logo" alt="Logo">` : ''}
</div>
\`\`\`

### Section (transition)
\`\`\`html
<div class="slide layout-section">
  <h1>Titre de section</h1>
</div>
\`\`\`

### Default (contenu standard)
\`\`\`html
<div class="slide slidev-layout">
  <h1>Titre</h1>
  <p>Contenu...</p>
  <ul>
    <li>Point 1</li>
    <li>Point 2</li>
  </ul>
</div>
\`\`\`

### Two cols (deux colonnes)
\`\`\`html
<div class="slide layout-two-cols">
  <div>
    <h2>Colonne gauche</h2>
    <p>Contenu...</p>
  </div>
  <div>
    <h2>Colonne droite</h2>
    <p>Contenu...</p>
  </div>
</div>
\`\`\`

### Stats (chiffres clés)
\`\`\`html
<div class="slide layout-stats">
  <h1>Chiffres clés</h1>
  <div class="stats-grid">
    <div class="stat">
      <div class="stat-value">42%</div>
      <div class="stat-label">Croissance</div>
    </div>
    <div class="stat">
      <div class="stat-value">1200</div>
      <div class="stat-label">Clients</div>
    </div>
  </div>
</div>
\`\`\`

### Quote
\`\`\`html
<div class="slide layout-quote">
  <blockquote>
    "Citation inspirante qui marque les esprits"
  </blockquote>
</div>
\`\`\`

### Image right
\`\`\`html
<div class="slide layout-image-right">
  <div class="content">
    <h1>Titre</h1>
    <p>Description...</p>
  </div>
  <div class="image" style="background-image: url('placeholder-business.jpg')"></div>
</div>
\`\`\`

### End (slide de fin)
\`\`\`html
<div class="slide layout-end">
  <h1>Merci</h1>
  <p>contact@${brandKit.company || 'entreprise'}.com</p>
</div>
\`\`\`

## Règles :
- Slide 1 : TOUJOURS cover
- MAX 6 lignes par slide
- UNE idée par slide
- Utiliser des layouts variés
- Dernière slide : end

## Contenu : {CONTENT}
## Entreprise : ${brandKit.company || 'Entreprise'}
## Ton : ${brandKit.tone || 'professionnel'}

Génère le HTML complet des slides (juste les divs de slides, pas la page complète). Commence directement par le HTML, sans explication.`;
  
  return template.replace('{CONTENT}', content);
}

/**
 * Convertit la réponse Gemini en HTML propre
 */
function convertToHtml(slidesContent, brandKit) {
  // Extraire le HTML entre les balises si présent
  const htmlMatch = slidesContent.match(/```html\n([\s\S]*?)```/);
  let html = htmlMatch ? htmlMatch[1] : slidesContent;
  
  // Nettoyer le HTML
  html = html.trim();
  
  // S'assurer que chaque slide a la classe slide
  html = html.replace(/<div class="([^"]*layout-[^"]*)">/g, '<div class="slide $1">');
  
  return html;
}

// CLI mode
if (process.argv[1]?.includes('generate.js')) {
  const args = process.argv.slice(2);
  const contentIdx = args.indexOf('--content');
  const colorIdx = args.indexOf('--color');
  const logoIdx = args.indexOf('--logo');
  const companyIdx = args.indexOf('--company');
  
  generate({
    contentPath: contentIdx >= 0 ? args[contentIdx + 1] : null,
    brandKit: {
      primaryColor: colorIdx >= 0 ? args[colorIdx + 1] : '#1a1a2e',
      logo: logoIdx >= 0 ? args[logoIdx + 1] : null,
      company: companyIdx >= 0 ? args[companyIdx + 1] : 'Entreprise'
    },
    apiKey: process.env.GEMINI_API_KEY
  }).catch(console.error);
}

export { generate, buildPrompt, generateWithGemini, buildHtmlPrompt, convertToHtml };
