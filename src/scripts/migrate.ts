#!/usr/bin/env ts-node
/**
 * Migration script: File-based to Airtable
 *
 * Migrates existing persistent memory data from the file-based system
 * to Airtable backend.
 *
 * Handles:
 *   - Global CLAUDE.md (~/.claude/CLAUDE.md) → Users table
 *   - Project CLAUDE.md (./CLAUDE.md) → ProjectContent table
 *   - PROJECT-REGISTRY.md → Projects table
 *   - Project workspaces → ProjectContent table
 *   - WORKING-CONTEXT.md → WorkingContext table
 *
 * Usage:
 *   npm run migrate -- --source ~/.claude --dry-run
 *   npm run migrate -- --source ~/.claude
 */

import * as fs from 'fs';
import * as path from 'path';
import { MemoryClient } from '../services/memory-client';
import { getConfig } from '../config';
import {
  User,
  Project,
  ProjectStatus,
  ProjectPriority,
  ContentType,
  WorkingContext,
} from '../types';

interface MigrationStats {
  user: boolean;
  projects: number;
  projectContent: number;
  workingContext: boolean;
  errors: string[];
}

class Migrator {
  private client: MemoryClient;
  private sourceDir: string;
  private dryRun: boolean;
  private stats: MigrationStats;

  constructor(sourceDir: string, dryRun: boolean = false) {
    this.sourceDir = sourceDir;
    this.dryRun = dryRun;
    this.stats = {
      user: false,
      projects: 0,
      projectContent: 0,
      workingContext: false,
      errors: [],
    };

    const config = getConfig();
    this.client = new MemoryClient(config);
  }

  /**
   * Runs the full migration
   */
  async migrate(): Promise<MigrationStats> {
    console.log(`\n🚀 Starting migration from ${this.sourceDir}`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

    try {
      // Step 1: Migrate global user preferences from ~/.claude/CLAUDE.md
      await this.migrateUser();

      // Step 2: Migrate projects and content (including project-specific CLAUDE.md)
      await this.migrateProjects();

      // Step 3: Migrate working context
      await this.migrateWorkingContext();

      // Step 4: Check for project-local CLAUDE.md in current directory
      await this.migrateProjectCLAUDE();

      console.log('\n✅ Migration completed successfully!\n');
      this.printStats();
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      this.stats.errors.push((error as Error).message);
      this.printStats();
      throw error;
    }

    return this.stats;
  }

  /**
   * Migrates CLAUDE.md to Users table
   */
  private async migrateUser(): Promise<void> {
    console.log('📄 Migrating user preferences (CLAUDE.md)...');

    const claudePath = path.join(this.sourceDir, 'CLAUDE.md');

    if (!fs.existsSync(claudePath)) {
      console.log('  ⚠️  CLAUDE.md not found, skipping user migration');
      return;
    }

    const content = fs.readFileSync(claudePath, 'utf-8');
    const user = this.parseCLAUDEmd(content);

    if (!this.dryRun) {
      await this.client.updatePreferences(user);
    }

    console.log(`  ✓ User migrated: ${user.name} (${user.email})`);
    this.stats.user = true;
  }

  /**
   * Parses CLAUDE.md file
   */
  private parseCLAUDEmd(content: string): Partial<User> {
    const lines = content.split('\n');
    const user: Partial<User> = {};

    let currentSection = '';
    let sectionContent: string[] = [];

    for (const line of lines) {
      // Detect section headers
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          this.parseCLAUDESection(currentSection, sectionContent, user);
        }

        currentSection = line.replace('## ', '').trim();
        sectionContent = [];
      } else if (line.trim()) {
        sectionContent.push(line);
      }
    }

    // Save last section
    if (currentSection && sectionContent.length > 0) {
      this.parseCLAUDESection(currentSection, sectionContent, user);
    }

    return user;
  }

  /**
   * Parses a section from CLAUDE.md
   */
  private parseCLAUDESection(
    section: string,
    content: string[],
    user: Partial<User>
  ): void {
    const text = content.join('\n').trim();

    // Extract name and email from "Who I Am" or "Profile" section
    if (section.toLowerCase().includes('who i am') || section.toLowerCase() === 'profile') {
      const nameMatch = text.match(/Name[:\-\s]+(.+)/i);
      const emailMatch = text.match(/Email[:\-\s]+(.+)/i);
      if (nameMatch) user.name = nameMatch[1].trim();
      if (emailMatch) user.email = emailMatch[1].trim();
    }

    // Map sections to user fields
    switch (section.toLowerCase()) {
      case 'use case':
      case 'what i do':
        user.useCase = text;
        break;
      case 'communication style':
      case 'how i work':
        user.communicationStyle = text;
        break;
      case 'file conventions':
      case 'conventions':
        user.fileConventions = text;
        break;
      case 'workflow':
      case 'workflow principles':
        user.workflowPrinciples = text;
        break;
    }
  }

  /**
   * Migrates PROJECT-REGISTRY.md and project workspaces
   */
  private async migrateProjects(): Promise<void> {
    console.log('\n📁 Migrating projects (PROJECT-REGISTRY.md + workspaces)...');

    const registryPath = path.join(this.sourceDir, 'PROJECT-REGISTRY.md');

    if (!fs.existsSync(registryPath)) {
      console.log('  ⚠️  PROJECT-REGISTRY.md not found, skipping projects migration');
      return;
    }

    const content = fs.readFileSync(registryPath, 'utf-8');
    const projects = this.parseProjectRegistry(content);

    console.log(`  Found ${projects.length} projects`);

    for (const project of projects) {
      try {
        await this.migrateProject(project);
        this.stats.projects++;
      } catch (error) {
        const msg = `Failed to migrate project ${project.projectName}: ${(error as Error).message}`;
        console.error(`  ❌ ${msg}`);
        this.stats.errors.push(msg);
      }
    }
  }

  /**
   * Parses PROJECT-REGISTRY.md
   */
  private parseProjectRegistry(content: string): Partial<Project>[] {
    const projects: Partial<Project>[] = [];
    const lines = content.split('\n');

    let inTable = false;
    for (const line of lines) {
      // Detect table start
      if (line.includes('|') && line.includes('Project') && line.includes('Status')) {
        inTable = true;
        continue;
      }

      // Skip separator line
      if (line.match(/^\|[\s\-:]+\|/)) {
        continue;
      }

      // Parse project row
      if (inTable && line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 4) {
          const [displayName, status, priority, location] = parts;

          // Extract project name from location or displayName
          const projectName = this.extractProjectName(location) || this.slugify(displayName);

          projects.push({
            projectName,
            displayName,
            status: this.parseStatus(status),
            priority: this.parsePriority(priority),
            location,
          });
        }
      }
    }

    return projects;
  }

  /**
   * Extracts project name from file path
   */
  private extractProjectName(location: string): string {
    const match = location.match(/projects\/([^\/\]]+)/);
    return match ? match[1] : '';
  }

  /**
   * Converts display name to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Parses status string to ProjectStatus
   */
  private parseStatus(status: string): ProjectStatus {
    const normalized = status.toLowerCase();
    if (normalized.includes('active')) return 'Active';
    if (normalized.includes('planning')) return 'Planning';
    if (normalized.includes('research')) return 'Research';
    if (normalized.includes('paused')) return 'Paused';
    if (normalized.includes('completed')) return 'Completed';
    if (normalized.includes('archived')) return 'Archived';
    return 'Active';
  }

  /**
   * Parses priority string to ProjectPriority
   */
  private parsePriority(priority: string): ProjectPriority {
    const normalized = priority.toLowerCase();
    if (normalized.includes('high')) return 'High';
    if (normalized.includes('low')) return 'Low';
    return 'Medium';
  }

  /**
   * Migrates a single project and its content
   */
  private async migrateProject(projectData: Partial<Project>): Promise<void> {
    if (!projectData.projectName || !projectData.displayName) {
      throw new Error('Project name and display name are required');
    }

    console.log(`  📦 Migrating ${projectData.projectName}...`);

    // Create project
    if (!this.dryRun) {
      const project = await this.client.createProject(
        projectData.projectName,
        projectData.displayName,
        {
          description: projectData.description,
          status: projectData.status || 'Active',
          priority: projectData.priority || 'Medium',
          initContent: false, // We'll migrate content manually
        }
      );

      // Migrate project content
      await this.migrateProjectContent(projectData.projectName, projectData.location);
    } else {
      console.log(`    [DRY RUN] Would create project: ${projectData.projectName}`);
    }

    console.log(`    ✓ Project migrated`);
  }

  /**
   * Migrates project content files
   */
  private async migrateProjectContent(
    projectName: string,
    location?: string
  ): Promise<void> {
    if (!location) {
      return;
    }

    // Resolve project directory
    let projectDir = location;
    if (location.startsWith('~/.claude/')) {
      projectDir = location.replace('~/.claude/', '');
      projectDir = path.join(this.sourceDir, projectDir);
    }

    if (!fs.existsSync(projectDir)) {
      console.log(`    ⚠️  Project directory not found: ${projectDir}`);
      return;
    }

    // Migrate each content file
    const contentTypes: ContentType[] = [
      'README',
      'PROJECT',
      'STATUS',
      'BACKLOG',
      'QUICKREF',
      'DECISIONS',
      'NOTES',
    ];

    for (const contentType of contentTypes) {
      const filename = `${contentType}.md`;
      const filepath = path.join(projectDir, filename);

      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');

        if (!this.dryRun) {
          await this.client.updateProjectContent(projectName, contentType, content);
        }

        console.log(`      ✓ ${contentType}.md migrated`);
        this.stats.projectContent++;
      }
    }
  }

  /**
   * Migrates WORKING-CONTEXT.md
   */
  private async migrateWorkingContext(): Promise<void> {
    console.log('\n📋 Migrating working context (WORKING-CONTEXT.md)...');

    const contextPath = path.join(this.sourceDir, 'WORKING-CONTEXT.md');

    if (!fs.existsSync(contextPath)) {
      console.log('  ⚠️  WORKING-CONTEXT.md not found, skipping working context migration');
      return;
    }

    const content = fs.readFileSync(contextPath, 'utf-8');
    const context = this.parseWorkingContext(content);

    if (!this.dryRun) {
      // Check if context exists
      const existing = await this.client.getCurrentContext();

      if (!existing) {
        await this.client.startNewWeek(context.primaryFocus);
      }

      if (context.primaryFocus || context.nextActions || context.openQuestions) {
        await this.client.updateContext(context);
      }
    }

    console.log('  ✓ Working context migrated');
    this.stats.workingContext = true;
  }

  /**
   * Parses WORKING-CONTEXT.md
   */
  private parseWorkingContext(content: string): Partial<WorkingContext> {
    const context: Partial<WorkingContext> = {
      nextActions: [],
      openQuestions: [],
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim().toLowerCase();
        continue;
      }

      // Parse primary focus
      if (currentSection.includes('focus') && line.startsWith('**')) {
        const match = line.match(/\*\*(.+?)\*\*/);
        if (match) {
          context.primaryFocus = match[1];
        }
      }

      // Parse next actions
      if (currentSection.includes('next') && line.trim().startsWith('-')) {
        const action = line.replace(/^-\s*/, '').trim();
        context.nextActions!.push({
          id: Date.now().toString() + Math.random(),
          action,
          priority: 'medium',
        });
      }

      // Parse open questions
      if (currentSection.includes('question') && line.trim().startsWith('-')) {
        const question = line.replace(/^-\s*/, '').trim();
        context.openQuestions!.push({
          id: Date.now().toString() + Math.random(),
          question,
        });
      }
    }

    return context;
  }

  /**
   * Migrates project-specific CLAUDE.md from current directory
   */
  private async migrateProjectCLAUDE(): Promise<void> {
    console.log('\n📝 Checking for project-specific CLAUDE.md...');

    // Check current working directory for CLAUDE.md
    const cwd = process.cwd();
    const projectClaudePath = path.join(cwd, 'CLAUDE.md');

    if (!fs.existsSync(projectClaudePath)) {
      console.log('  ℹ️  No project-specific CLAUDE.md found in current directory');
      return;
    }

    const content = fs.readFileSync(projectClaudePath, 'utf-8');

    // Try to determine project name from current directory
    const projectName = path.basename(cwd);

    console.log(`  📄 Found CLAUDE.md for project: ${projectName}`);

    if (!this.dryRun) {
      // Store project-specific CLAUDE.md as ProjectContent
      try {
        await this.client.updateProjectContent(projectName, 'NOTES', content, {
          metadata: {
            sourceFile: 'CLAUDE.md',
            description: 'Project-specific Claude configuration and context',
            migratedAt: new Date().toISOString(),
          },
        });
        console.log(`  ✓ Project CLAUDE.md migrated to ${projectName} ProjectContent`);
        this.stats.projectContent++;
      } catch (error) {
        // If project doesn't exist, create it first
        console.log(`  ⚠️  Project not found, creating: ${projectName}`);
        await this.client.createProject(projectName, projectName, {
          description: `Auto-created from CLAUDE.md in ${cwd}`,
          status: 'Active',
          priority: 'Medium',
          initContent: false,
        });
        await this.client.updateProjectContent(projectName, 'NOTES', content, {
          metadata: {
            sourceFile: 'CLAUDE.md',
            description: 'Project-specific Claude configuration and context',
            migratedAt: new Date().toISOString(),
          },
        });
        console.log(`  ✓ Project created and CLAUDE.md migrated`);
        this.stats.projects++;
        this.stats.projectContent++;
      }
    } else {
      console.log(`    [DRY RUN] Would migrate CLAUDE.md to project: ${projectName}`);
    }
  }

  /**
   * Prints migration statistics
   */
  private printStats(): void {
    console.log('\n📊 Migration Statistics:');
    console.log(`  User migrated: ${this.stats.user ? '✓' : '✗'}`);
    console.log(`  Projects migrated: ${this.stats.projects}`);
    console.log(`  Content files migrated: ${this.stats.projectContent}`);
    console.log(`  Working context migrated: ${this.stats.workingContext ? '✓' : '✗'}`);

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`);
      this.stats.errors.forEach((error) => console.log(`  - ${error}`));
    }
  }
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  let sourceDir = path.join(process.env.HOME || '~', '.claude');
  let dryRun = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceDir = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--help') {
      console.log(`
Usage: npm run migrate [options]

Migrates persistent memory from file-based system to Airtable.

What gets migrated:
  - Global CLAUDE.md (~/.claude/CLAUDE.md) → Users table
  - Project CLAUDE.md (./CLAUDE.md in current dir) → ProjectContent
  - PROJECT-REGISTRY.md → Projects table
  - Project workspace files → ProjectContent table
  - WORKING-CONTEXT.md → WorkingContext table

Options:
  --source <dir>   Source directory (default: ~/.claude)
  --dry-run        Preview migration without making changes
  --help           Show this help message

Examples:
  npm run migrate
  npm run migrate -- --source ~/.claude --dry-run
  npm run migrate -- --source /custom/path

Note: Migration is NON-DESTRUCTIVE - your local files are never modified.
      `);
      process.exit(0);
    }
  }

  // Expand ~ in path
  if (sourceDir.startsWith('~')) {
    sourceDir = path.join(process.env.HOME || '', sourceDir.slice(1));
  }

  // Verify source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const migrator = new Migrator(sourceDir, dryRun);
  await migrator.migrate();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { Migrator };
