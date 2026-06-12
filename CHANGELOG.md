# Kapruka AI Shopping Agent — Full Changelog

This document outlines the complete history of upgrades, security patches, and challenge-specific enhancements made to the Kapruka Shopping Agent (Korpi) to ensure it scores 100/100 in the Kapruka 2026 Challenge.

## 🚀 Performance & Optimizations
*   **Concurrent Tool Execution**: Refactored the FastAPI backend (`main.py`) to execute MCP tool calls concurrently using `asyncio.gather`. This drastically reduced the round-trip latency when Gemini queries multiple products simultaneously.
*   **React Rendering Efficiency**: Wrapped heavy frontend components (`ProductCard`, `Message`, `ProductsSection`) in `React.memo` to prevent costly re-renders on every user keystroke.
*   **Lazy Loading**: Added `loading="lazy"` attributes to all dynamic product images to prevent network bottlenecks and improve initial page load speed.

## 🛡️ Security & Stability Patches
*   **XSS Vulnerability Fixed**: Implemented an `escapeHTML` sanitizer in the markdown parser (`App.jsx`) before applying `dangerouslySetInnerHTML`. This safely neutralizes dangerous script injections.
*   **CORS Lockdown**: Restricted FastAPI's `CORSMiddleware` in `main.py` from an insecure wildcard (`*`) to explicit local frontend domains to prevent cross-origin abuse.
*   **Prompt Injection Protection**: Injected a hidden system reminder at the end of the user's prompt array to prevent users from jailbreaking the agent or hijacking its identity.
*   **Graceful Parsing Error Handling**: Fixed a critical frontend crash where the `timestamp` object occasionally resolved to `undefined` during rendering, crashing the `Message` component.
*   **Missing Import Crash Fixed**: Restored a missing `Component` import that broke the React `ErrorBoundary`.

## 🧠 Backend Agent Intelligence (Prompt Engineering)
*   **Strict Anti-Hallucination Rules**: Enforced a critical negative constraint in the system prompt. Korpi will now explicitly admit when an item is unavailable rather than hallucinating fake inventory or pivoting to completely unrelated products (e.g., trying to sell cakes when asked for a PS5).
*   **Dialect Authenticity**: Refined system instructions for transliterated dialects (`Singlish`, `Tanglish`). The agent now seamlessly uses polite regional suffixes (e.g., `-nga` in Tanglish) and drops unnatural hyphenations.
*   **Perishable Goods Logic**: Implemented mandatory logic ensuring the agent cross-references Kapruka's delivery locations against time-sensitive perishable goods (e.g., ice cream cakes) before processing a checkout.

## 🎨 UI/UX & High-Fidelity Design
*   **Dynamic Product Cards**: Upgraded static text responses into rich, interactive product cards featuring hover-state previews, dynamic image scaling, synthetic rating badges, and price drop highlights.
*   **Responsive Chat Container**: Constrained the main chat area to a centralized `800px` max-width, mimicking modern messaging apps (WhatsApp, Telegram) for better desktop readability.
*   **Mobile-First Adaptations**: Added specific CSS media queries to dynamically hide the 3D Avatar and collapse padding on mobile screens (`< 768px`) to maximize readable chat real estate.
*   **Micro-Interactions**:
    *   Added a smooth `fadeUp` entrance animation with staggered delays for product cards.
    *   Added a bouncy, pulsating cart icon animation that triggers on `add-to-cart` events to provide visual confirmation.
    *   Added tactile haptic feedback (`navigator.vibrate`) for mobile devices during cart additions.

## 🏆 Bonus Challenge Requirements Met
*   **Multi-Item Cart Panel**: Replaced simple arrays with a persistent side-drawer checkout modal, allowing users to scroll horizontally through their selected items, adjust quantities via steppers, and remove items dynamically.
*   **Gift Messaging Native UI**: Added an integrated "Gift Message" sliding panel with a character counter and quick-fill template buttons.
*   **Delivery Date Picker**: Implemented a sleek, horizontal pill-scroll UI for users to seamlessly pick delivery dates without typing. The agent recognizes when a date is selected and stops prompting.
*   **Language Hinting UI**: Created a dismissible "Sinhala Hint" banner designed to encourage local users to interact in native scripts.

## 🔙 Reverted Features
*   **Voice Dictation (Removed)**: Built and then removed the experimental Web Speech API Voice input based on user preference.
*   **Synthetic Audio Cues (Removed)**: Built and then removed the `AudioContext` notification ping based on user preference.
