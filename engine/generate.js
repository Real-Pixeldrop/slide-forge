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
  
  // Extraire le markdown entre les balises code si présent
  const mdMatch = text.match(/```(?:markdown|md)?\n([\s\S]*?)```/);
  return mdMatch ? mdMatch[1] : text;
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
    apiKey
  } = options;
  
  // 1. Lire le contenu
  const content = contentPath 
    ? readFileSync(contentPath, 'utf-8')
    : options.content || '';
  
  if (!content) {
    throw new Error('Aucun contenu fourni');
  }
  
  // 2. Construire le prompt
  const prompt = buildPrompt(content, brandKit);
  
  // 3. Générer les slides via Gemini
  console.log('Génération des slides via Gemini...');
  const slidesMarkdown = await generateWithGemini(prompt, apiKey);
  
  // 4. Ajouter le theme vars
  const themeVars = generateThemeVars(brandKit);
  const finalMarkdown = slidesMarkdown + '\n' + themeVars;
  
  // 5. Sauvegarder
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = join(outputDir, 'slides.md');
  writeFileSync(outputPath, finalMarkdown, 'utf-8');
  
  console.log(`Présentation générée : ${outputPath}`);
  return outputPath;
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

export { generate, buildPrompt, generateWithGemini };
