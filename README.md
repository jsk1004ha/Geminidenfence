<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ad0d205b-6f0a-45cd-959c-f16e38357351

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Planning/Implementation Notes

- Final design gap analysis report (Korean): `docs/FINAL_SPEC_GAP_ANALYSIS.md`

## Gameplay Unlock Notes

- Evolution cores are now gated by runtime conditions (instead of always showing every path at wave 15).
- Hidden cores are unlocked via internal condition checks and their unlock conditions are intentionally not shown in the Deploy UI.
- Global artifact unlock conditions are now wired to runtime progress tracking (`achievements`) and auto-unlock when each condition is met.
- Artifact effects are now applied in combat/stat layers (damage, shield, summon/module scaling, status scaling, rewards, and low-HP bonuses).
- Enemy system has been expanded to cover broad role groups (normal/fast/defense/ranged/summon/disrupt/economic interference/hidden) with wave-based composition growth and expanded elite prefix variants.
- Spec alias enemy variants (boss aides + elemental families + additional fast/defense/economic variants) are also included in the spawn catalog for full type coverage.
- The spawn catalog now contains every requested canonical enemy identifier from sections 13-1 through 13-10 (including boss aides, hidden enemies, and elemental enemies).
