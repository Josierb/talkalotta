# TalkALotta

Adaptive AAC board. Core words never move; the words that change with the
situation are generated and then **remember their positions** between visits.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173

## The demo, in order

1. Board loads. Three rows of core words, bottom row of scenario buttons,
   folders and next page. Tap words, they speak and stack in the speech bar.
2. Tap **Situation** -> pick "At the park". The scenario board loads.
3. Tap **Back**, then **Situation** -> "At the park" again.
   **Every word is in the same slot.** That's the whole thesis.
4. Turn on **caregiver mode** (circle, top left) and repeat step 3 - teal dots
   now mark every word that came back to its remembered slot.

Use "Reset slot memory" in the caregiver strip for a clean run on stage.

## Where things live

```
src/
  data/
    coreVocabulary.js   Fitzgerald colours + the Universal Core 36
    boards.js           Board definitions, in Open Board Format (.obf) shape
  lib/
    slotMemory.js       (scenario, word) -> slot. THE DIFFERENTIATOR.
    scenarioEngine.js   STUB. Scenario -> word list. Replace this one.
    symbols.js          ARASAAC lookup + cache + tile fallback
    speech.js           Web Speech API text-to-speech
  components/
    SpeechBar.jsx       Message bar, caregiver toggle, clear
    Board cells, scenario sheet, caregiver strip
```

## What is stubbed, and who should take it

| File | Status | Next step |
|---|---|---|
| `lib/scenarioEngine.js` | hardcoded scenarios | NL scenario -> keywords -> OpenSymbols search -> rank |
| `lib/symbols.js` | ARASAAC first hit | rank by the transparency norms at https://osf.io/eyjr6/ , threshold into a review tray |
| `scenarioEngine.suggestFromLocation` | falls back to time of day | reverse-geocode -> place type |
| caregiver editing | not built | tap a button to edit; warn before moving a well-used core word |

Split suggestion: one person on the scenario engine + symbol ranking, one on
caregiver mode and editing, one on the pitch and demo script.

## Design decisions already baked in

- **Core rows never move.** Motor automaticity is built on core words; we only
  ever change fringe nouns.
- **Slot stability per scenario.** Consistent *within* a context, different
  *across* contexts.
- **Maturity per scenario, not a global timer.** `slotMemory.maturity()`:
  under 5 visits fluid, 5-20 additive only, over 20 frozen.
- **Reserved empty slots.** New words land in empty space; nothing is silently
  swapped out.
- **Colour the symbol, not the cell**, and cluster like colours spatially.
- **Board data is Open Board Format shaped**, so export is nearly free.

## Credits

Universal Core vocabulary: Center for Literacy and Disability Studies, UNC
Chapel Hill (Project Core), CC BY 4.0.

Pictograms: ARASAAC, Government of Aragon, CC BY-NC-SA. Non-commercial -
switch to Mulberry Symbols (CC BY-SA) before any commercial release.
