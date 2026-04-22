# Project Development Standard (Skill)

Dessa regler ska alltid läsas in och följas vid utveckling i detta projekt.

## 1. Cross-Platform & Responsiv Design
- Designa ALLTID för både mobil (iOS/Android) och desktop (Webb).
- Använd flex-box och undvik fasta pixelstorlekar där det inte är absolut nödvändigt.
- Komponenter ska se premium ut på alla skärmstorlekar.

## 2. Anpassade Meddelanderutor (INGEN alert/window.confirm)
- **REGEL:** Använd ALDRIG `alert()`, `Alert.alert()` eller `window.confirm()`.
- **LÖSNING:** Använd `useAlert` hooken från `@/context/AlertContext`.
- Exempel: `const { showAlert, showConfirm } = useAlert();`
- Detta säkerställer att dialogrutan ser likadan ut på alla plattformar och följer projektets design.

## 3. Dark Mode & DesignSystem
- Använd ALLTID `useTheme()` från `@/constants/DesignSystem`.
- Hårdkoda ALDRIG färger (som `#FFFFFF` eller `white`) om det inte är menat att vara statiskt i alla lägen.
- Använd `palette.background.default`, `palette.text.primary` etc. för att stödja Dark Mode automatiskt.

## 4. Tillgänglighet (Accessibility)
- Följ WCAG AA.
- Använd `accessibilityLabel` för ikoner och knappar.
- Säkerställ tillräcklig kontrast och tryckytor (minst 44dp).

## 5. Död kod & Refaktorisering
- **Viktigt:** Rensa alltid bort oanvänd kod, bortkommenterade block och oanvända imports innan incheckning.
- Identifiera och eliminera duplicerad kod genom att flytta den till `utils/` eller delade komponenter.
- Håll services rena och fokuserade på sitt ansvarsområde.

## 6. Kodintegritet & Dokumentation
- Behåll existerande kommentarer om de fortfarande är relevanta.
- Skriv ren, modulär kod (separera services, typer och komponenter).
