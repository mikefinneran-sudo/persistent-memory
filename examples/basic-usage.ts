/**
 * Basic usage examples for the Persistent Memory System
 */

import { MemoryClient, getConfig } from '../src';

async function main() {
  // Initialize client
  const config = getConfig();
  const client = new MemoryClient(config);

  console.log('🧠 Persistent Memory System - Basic Usage Examples\n');

  // ============================================================================
  // Example 1: Load session context
  // ============================================================================
  console.log('📚 Example 1: Loading session context...');

  const session = await client.loadSession();

  console.log('User:', session.user?.name);
  console.log('Active projects:', session.activeProjects.length);
  console.log('Current project:', session.currentProject?.displayName || 'None');
  console.log('Current focus:', session.context?.primaryFocus || 'Not set');

  // ============================================================================
  // Example 2: Create a new project
  // ============================================================================
  console.log('\n📦 Example 2: Creating a new project...');

  const project = await client.createProject(
    'example-project',
    'Example Project',
    {
      description: 'This is an example project for testing',
      status: 'Active',
      priority: 'High',
      tags: ['example', 'test'],
    }
  );

  console.log('Created project:', project.displayName);

  // ============================================================================
  // Example 3: Update project content
  // ============================================================================
  console.log('\n📝 Example 3: Updating project content...');

  await client.updateProjectContent(
    'example-project',
    'STATUS',
    `# Current Status

## What's Working
- Project created successfully
- Airtable integration working

## Next Steps
- Test more features
- Add documentation
`
  );

  console.log('Updated STATUS.md for example-project');

  // ============================================================================
  // Example 4: Switch to project
  // ============================================================================
  console.log('\n🔄 Example 4: Switching to project...');

  await client.switchToProject('example-project');

  console.log('Switched to example-project');

  // ============================================================================
  // Example 5: Load project details
  // ============================================================================
  console.log('\n📖 Example 5: Loading project details...');

  const projectData = await client.loadProject('example-project');

  console.log('Project:', projectData.project.displayName);
  console.log('Content files:', Object.keys(projectData.content));

  // ============================================================================
  // Example 6: Update working context
  // ============================================================================
  console.log('\n📋 Example 6: Updating working context...');

  await client.updateContext({
    nextActions: [
      {
        id: '1',
        action: 'Complete documentation',
        priority: 'high',
      },
      {
        id: '2',
        action: 'Write tests',
        priority: 'medium',
      },
    ],
    openQuestions: [
      {
        id: '1',
        question: 'Should we add webhooks support?',
      },
    ],
  });

  console.log('Updated working context with actions and questions');

  // ============================================================================
  // Example 7: List all projects
  // ============================================================================
  console.log('\n📂 Example 7: Listing all projects...');

  const allProjects = await client.listProjects();

  console.log(`Found ${allProjects.length} active projects:`);
  allProjects.forEach((p) => {
    console.log(`  - ${p.displayName} (${p.status}, ${p.priority})`);
  });

  console.log('\n✅ All examples completed!');
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
