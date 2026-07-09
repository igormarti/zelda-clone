# Zelda Clone in Pure JavaScript (Modular & AI-Powered)

A **Zelda-inspired top-down action RPG prototype** built with **pure JavaScript**, **HTML5 Canvas**, and **pixel art sprites**.

> **Note:** This project is a learning-oriented endeavor. It has evolved from a simple script into a **modular, object-oriented codebase** developed with the assistance of an AI-driven "development squad" (GitHub Copilot).

---

## 🏗️ Architecture & Structure
Unlike early prototypes, this project is now structured using **ES Modules** and **Object-Oriented Programming (OOP)**. 
- **Modularity:** Logic is separated into distinct classes (Player, World, InputHandler).
- **Maintainability:** Clear separation of concerns (rendering vs. logic).
- **Scalability:** Built to allow easy expansion of features without cluttering the main loop.

### Project Tree
```text
/
├── .github/
│   └── copilot-instructions.md  # Core AI Rules & Guidelines
├── assets/                      # Sprites and visual assets
├── docs/
│   ├── agents/                  # AI Agent Personas (Architect, Analyst, Dev, QA)
│   └── features/                # Feature-driven documentation
├── src/
│   ├── classes/                 # Core logic modules
│   └── main.js                  # Game entry point & loop
└── index.html