# AI Development Principles

Dessa principer gäller för all AI-assisterad utveckling i det här projektet och ska alltid följas:

1. **Cross-Platform Support**
   Samtlig utveckling och design ska göras med ett responsivt tänk för att fungera felfritt i både mobilt läge (iOS/Android/Webb-mobil) och desktopläge (Webb/Tablet). UI-komponenter ska anpassa sig smidigt oavsett skärmstorlek.

2. **Tillgänglighet (Accessibility / WCAG AA)**
   Koden och gränssnittet ska utformas för att vara tillgängligt och i största möjliga mån uppfylla standarden för WCAG AA. Detta inkluderar:
   - Tillräcklig kontrast för text och viktiga UI-element.
   - Stöd för skärmläsare (ex. `accessibilityLabel`, `accessibilityRole` i React Native).
   - Tillräckligt stora klickytor (minst 44x44 dp) för touch.
   - Logisk tabb-navigering för desktopanvändare.

3. **Anpassade Meddelanderutor (Custom Modals/Alerts)**
   Använd alltid projektets egna, anpassade komponenter för meddelanderutor och dialoger (exempelvis `ConfirmationModal` som används på startsidan) istället för systemets inbyggda standarddialoger (som `Alert.alert` i React Native eller `window.confirm` på webben). Detta för att säkerställa en konsekvent design och användarupplevelse över hela applikationen oavsett plattform.
