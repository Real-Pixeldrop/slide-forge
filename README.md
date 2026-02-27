# SlideForge

Générateur de présentations professionnelles propulsé par l'IA.

Upload ton contenu + ta charte graphique, l'IA fait la mise en page.

## Concept

1. **Upload** : contenu (texte, images, memo) + brand kit (logo, couleurs, police)
2. **IA** : structure le contenu en slides, choisit les layouts adaptés
3. **Rendu** : présentation HTML 16:9 avec la charte graphique appliquée
4. **Export** : PDF haute qualité

## Stack

- **Frontend** : Page web (upload + preview live)
- **Moteur slides** : [Slidev](https://sli.dev) (Markdown → HTML slides)
- **IA** : Gemini Pro pour structuration contenu + mise en page
- **Theming** : Système de thèmes custom adaptatifs (couleurs, polices, logos)
- **Export** : PDF 16:9 via Playwright

## Fonctionnalités

### MVP
- [ ] Upload de contenu (texte markdown, images)
- [ ] Saisie brand kit (logo, couleur primaire, secondaire, police)
- [ ] Génération automatique des slides (structure + layout)
- [ ] Preview live 16:9
- [ ] Export PDF

### V2
- [ ] Bibliothèque de templates (corporate, startup, créatif, minimal)
- [ ] Upload de dossier complet (memo, brief, images)
- [ ] Détection automatique de la charte depuis un site web
- [ ] Variations de style (IA propose 3 vibes)
- [ ] Mode édition drag & drop

## Architecture

```
slide-forge/
├── app/                    # Frontend web
│   ├── src/
│   │   ├── components/     # Upload, Preview, BrandKit form
│   │   ├── pages/          # Home, Editor, Export
│   │   └── lib/            # API calls, helpers
│   └── package.json
├── engine/                 # Moteur de génération
│   ├── ai/                 # Prompts Gemini, structuration contenu
│   ├── themes/             # Thèmes Slidev custom
│   │   ├── corporate/
│   │   ├── minimal/
│   │   ├── creative/
│   │   └── base/           # Thème adaptatif (brand kit)
│   ├── layouts/            # Layouts de slides
│   │   ├── cover.vue       # Slide de couverture
│   │   ├── section.vue     # Séparateur de section
│   │   ├── two-cols.vue    # Deux colonnes
│   │   ├── image-right.vue # Texte + image
│   │   ├── image-full.vue  # Image plein écran
│   │   ├── quote.vue       # Citation
│   │   ├── stats.vue       # Chiffres clés
│   │   └── team.vue        # Équipe
│   └── templates/          # Templates markdown de base
├── api/                    # Backend API
│   ├── generate.js         # Endpoint génération
│   ├── export.js           # Endpoint export PDF
│   └── upload.js           # Gestion uploads
├── output/                 # Présentations générées
└── README.md
```

## Quick Start

```bash
# Install
git clone https://github.com/Real-Pixeldrop/slide-forge.git
cd slide-forge
npm install

# Dev
npm run dev

# Générer une présentation
npm run generate -- --content ./mon-brief.md --logo ./logo.png --color "#1a1a2e"
```

## Licence

MIT
