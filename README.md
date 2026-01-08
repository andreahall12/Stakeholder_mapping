# Stakeholder Mapping Tool

A powerful desktop application designed for **program managers** to identify, track, and manage stakeholders across projects. Visualize relationships, track engagement, and ensure nothing falls through the cracks.

---

## Table of Contents

- [Download and Install](#download-and-install)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Download ZIP (No Git Required)](#download-zip-no-git-required)
- [What This Tool Does](#what-this-tool-does)
- [Features Guide](#features-guide)
- [Using the Application](#using-the-application)
- [AI Chat Assistant](#ai-chat-assistant)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [For Developers](#for-developers)

---

## Download and Install

Choose your operating system below for step-by-step instructions.

---

### Windows

#### Step 1: Install Node.js

1. Go to **https://nodejs.org**
2. Click the **LTS** (Long Term Support) download button
3. Run the downloaded `.msi` file
4. Follow the installer prompts (click Next, accept defaults)
5. **Important:** Check the box for "Automatically install necessary tools" if shown
6. Click **Install**, then **Finish**

To verify it worked, open **Command Prompt**:
- Press `Windows + R`, type `cmd`, press Enter
- Type `node --version` and press Enter
- You should see a version number like `v20.x.x`

#### Step 2: Install Git (Optional but Recommended)

1. Go to **https://git-scm.com/download/win**
2. Click **"Click here to download"**
3. Run the installer
4. Accept all default options (just keep clicking Next)
5. Click **Install**, then **Finish**

#### Step 3: Download the Project

**Option A - Using Git (Recommended):**

1. Open **Command Prompt** (press `Windows + R`, type `cmd`, press Enter)
2. Navigate to where you want the project:
   ```
   cd C:\Users\YourName\Documents
   ```
3. Clone the repository:
   ```
   git clone https://github.com/andreahall12/Stakeholder_mapping.git
   ```
4. Enter the project folder:
   ```
   cd Stakeholder_mapping
   ```

**Option B - Download ZIP (see [Download ZIP section](#download-zip-no-git-required))**

#### Step 4: Install Dependencies

In Command Prompt (inside the project folder):
```
npm install
```
Wait 1-2 minutes for it to complete.

#### Step 5: Start the Application

```
npm run dev -- --port 5173
```

#### Step 6: Open the App

Open your web browser (Chrome, Firefox, or Edge) and go to:
```
http://localhost:5173
```

**You are done! Click "Add Sample Data" to explore the app.**

---

### macOS

#### Step 1: Open Terminal

- Press `Cmd + Space` to open Spotlight
- Type `Terminal` and press Enter

#### Step 2: Install Homebrew (Package Manager)

If you do not have Homebrew installed, paste this command and press Enter:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the prompts. You may need to enter your password.

After installation, run:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Step 3: Install Node.js and Git

```bash
brew install node git
```

To verify:
```bash
node --version
git --version
```

#### Step 4: Download the Project

1. Navigate to your Documents folder:
   ```bash
   cd ~/Documents
   ```
2. Clone the repository:
   ```bash
   git clone https://github.com/andreahall12/Stakeholder_mapping.git
   ```
3. Enter the project folder:
   ```bash
   cd Stakeholder_mapping
   ```

#### Step 5: Install Dependencies

```bash
npm install
```
Wait 1-2 minutes.

#### Step 6: Start the Application

```bash
npm run dev -- --port 5173
```

#### Step 7: Open the App

Open **Safari**, **Chrome**, or **Firefox** and go to:
```
http://localhost:5173
```

**You are done! Click "Add Sample Data" to explore the app.**

---

### Linux

These instructions work for Ubuntu, Debian, Fedora, and most distributions.

#### Step 1: Open Terminal

- Press `Ctrl + Alt + T` on most systems

#### Step 2: Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora:**
```bash
sudo dnf install nodejs npm
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

Verify installation:
```bash
node --version
npm --version
```

#### Step 3: Install Git

**Ubuntu/Debian:**
```bash
sudo apt-get install git
```

**Fedora:**
```bash
sudo dnf install git
```

**Arch Linux:**
```bash
sudo pacman -S git
```

#### Step 4: Download the Project

```bash
cd ~
git clone https://github.com/andreahall12/Stakeholder_mapping.git
cd Stakeholder_mapping
```

#### Step 5: Install Dependencies

```bash
npm install
```

#### Step 6: Start the Application

```bash
npm run dev -- --port 5173
```

#### Step 7: Open the App

Open your browser and go to:
```
http://localhost:5173
```

**You are done! Click "Add Sample Data" to explore the app.**

---

### Download ZIP (No Git Required)

If you prefer not to use Git, you can download the project as a ZIP file.

#### Step 1: Download the ZIP

1. Go to **https://github.com/andreahall12/Stakeholder_mapping**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Save the file to your Downloads folder

#### Step 2: Extract the ZIP

**Windows:**
- Right-click the ZIP file
- Click **"Extract All..."**
- Choose a location (like Documents)
- Click **Extract**

**macOS:**
- Double-click the ZIP file
- It extracts automatically to the same folder

**Linux:**
```bash
unzip Stakeholder_mapping-main.zip
```

#### Step 3: Open Terminal/Command Prompt in the Folder

**Windows:**
- Open the extracted folder
- Click in the address bar, type `cmd`, press Enter

**macOS:**
- Open Terminal
- Type `cd ` (with a space), then drag the folder into Terminal
- Press Enter

**Linux:**
- Right-click in the folder, select "Open Terminal Here"
- Or use `cd /path/to/Stakeholder_mapping-main`

#### Step 4: Continue from Step 4 Above

Follow the **Install Dependencies** step for your operating system above.

---

## What This Tool Does

| Your Challenge | How This Tool Helps |
|----------------|---------------------|
| Who are my key stakeholders? | Visual influence matrix shows who matters most |
| Am I communicating enough? | Staleness alerts flag overdue contacts |
| Who is blocking progress? | Dashboard highlights high-influence resisters |
| What is my RACI coverage? | Gap analysis shows missing roles per workstream |
| I need to present anonymously | One-click mode hides all real names |

---

## Features Guide

### Views
- **Dashboard** - KPIs, alerts, and quick actions at a glance
- **Network Graph** - Visual map of stakeholder connections
- **Influence Matrix** - 2x2 grid showing influence vs support
- **Org Chart** - Hierarchical reporting structure
- **RACI Matrix** - Editable responsibility assignments

### Stakeholder Management
- **Add/Edit Stakeholders** - Name, title, department, contact info
- **Influence and Support Levels** - Track who matters and how they feel
- **Tags** - Organize with custom colored labels
- **Engagement Log** - Record meetings, calls, emails with sentiment
- **Communication Plans** - Set expected contact frequency

### Productivity Tools
- **AI Quick Add** - Type "John Smith, VP Engineering, high influence" to create
- **CSV Import** - Bulk load stakeholders from spreadsheet
- **Bulk Operations** - Update multiple stakeholders at once
- **Saved Filters** - Save and reuse filter combinations
- **PDF Export** - Generate formatted reports

### Advanced Features
- **Scenario Planning** - Model "what if" support level changes
- **Anonymous Mode** - Hide names for presentations
- **Keyboard Shortcuts** - Press Cmd/Ctrl + / for help
- **AI Chat** - Ask questions about your data AND how to use the tool

---

## Using the Application

### Adding Stakeholders
1. Click **"New"** in the sidebar
2. Fill in name, title, department, contact info
3. Set **Influence Level**: High, Medium, or Low
4. Set **Support Level**: Champion, Supporter, Neutral, or Resistant
5. Click **Save**

### Tracking Engagement
1. Click the clipboard icon on any stakeholder
2. Select type: Meeting, Email, Call, Decision, Note
3. Add summary and sentiment
4. Save - updates their last contact date

### Setting Communication Plans
1. Edit a stakeholder
2. Set channel (Email, Slack, Meeting, etc.)
3. Set frequency (Daily, Weekly, Monthly, etc.)
4. Dashboard will alert you when overdue

### Filtering Stakeholders
1. Click **"Filter"** button
2. Select influence, support, department, or tag
3. Click Filter dropdown and "Save Current Filter" for reuse

### Exporting Data
1. Click the three-dot menu in header
2. Choose: CSV, JSON, PDF Report, or Full Backup

---

## AI Chat Assistant

The AI chat can answer two types of questions:

### 1. Questions About Your Data
- "Who is responsible for design?"
- "List all high-influence stakeholders"
- "Who should I email weekly?"
- "Show me resistant stakeholders in Engineering"
- "Prepare a meeting brief for John Smith"
- "Who have I neglected?"

### 2. Questions About Using the Tool
- "How do I add a stakeholder?"
- "How do I export my data?"
- "How do I use the RACI matrix?"
- "How do I set up a communication plan?"
- "How do I filter by department?"

**For "how do I" questions, you get instant answers without needing Ollama.**

### Setting Up AI for Data Questions (Optional)

To use AI for data-related questions:

1. **Install Ollama** from https://ollama.ai
2. **Start Ollama** (in Terminal/Command Prompt):
   ```
   ollama serve
   ```
3. **Download a model**:
   ```
   ollama pull llama3.2
   ```
4. The chat will connect automatically

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + / | Show shortcuts help |
| Cmd/Ctrl + N | New stakeholder |
| Cmd/Ctrl + F | Focus search |
| Escape | Close dialogs |

---

## Troubleshooting

### "Site cannot be reached"
The server stopped. Restart it:
```
npm run dev -- --port 5173
```

### "npm not found" or "node not found"
Node.js is not installed or not in your PATH. Reinstall from https://nodejs.org

### "Port 5173 is already in use"
Use a different port:
```
npm run dev -- --port 3000
```
Then go to http://localhost:3000

### "git is not recognized"
Git is not installed. Download from https://git-scm.com or use the ZIP download method.

### "My data disappeared"
Data is stored in your browser. It persists unless you:
- Clear browser data
- Use a different browser
- Use incognito mode

**Tip:** Export backups regularly via Menu > Export > Full Backup

---


---

## Security Considerations

### Data Storage

This application stores all data locally in your browser's **localStorage**. This means:

- **No cloud sync** - Your data never leaves your device
- **Browser-specific** - Data is tied to the browser you use
- **Not encrypted** - Data is stored in base64 encoding, not encrypted

**Recommendations for sensitive stakeholder data:**
1. Use the application on a private/work computer only
2. Export and backup data regularly to a secure location
3. Clear browser data when using shared computers
4. Consider the desktop (Tauri) build for added isolation

### AI Integration

The AI chat feature connects to a **local Ollama instance** running on your machine:
- All AI processing happens locally - no data is sent to external servers
- Ollama must be running on `localhost:11434`
- No API keys or external authentication required

### Input Validation

The application includes protections against:
- **SQL Injection** - All database queries use parameterized statements
- **XSS (Cross-Site Scripting)** - HTML content is escaped in reports
- **CSV Formula Injection** - Imported CSV values are sanitized

### Best Practices

1. **Regular Backups** - Use Export → Full Backup before major changes
2. **Anonymous Mode** - Enable for presentations to hide real names
3. **Review Imports** - Check CSV preview before importing stakeholder data
4. **Keep Ollama Updated** - Update your local Ollama installation regularly
## For Developers

- [REQUIREMENTS.md](REQUIREMENTS.md) - Functional and non-functional requirements
- [docs/TECHNICAL.md](docs/TECHNICAL.md) - Architecture and developer guide

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- sql.js (SQLite in WebAssembly)
- React Flow + Mermaid
- Tauri 2.0 (desktop)
- Ollama (local AI)

---

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
