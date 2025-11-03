/**
 * Prompting Rules System - Usage Examples
 *
 * Demonstrates how to use natural language command parsing and context-aware behaviors
 */

import { MemoryClient, getConfig } from '../src';

async function main() {
  console.log('🧠 Prompting Rules System - Usage Examples\n');

  const config = getConfig();
  const client = new MemoryClient(config);

  // ============================================================================
  // Example 1: Initialize Session with Rules
  // ============================================================================
  console.log('📚 Example 1: Initializing session with prompting rules...\n');

  const sessionContext = await client.initializeSession();
  console.log(`✓ Session initialized`);
  console.log(`  Rules loaded: ${sessionContext.rules.length}`);
  console.log(`  Preferences:`, sessionContext.preferences);
  console.log();

  // ============================================================================
  // Example 2: Process "Go" Command (Ready State)
  // ============================================================================
  console.log('📚 Example 2: Processing "Go" command when ready...\n');

  // Set context to ready
  client.setTaskState('ready_to_proceed');

  const goResult1 = await client.processCommand('Go');
  console.log('Command: "Go"');
  console.log('Context: ready_to_proceed');
  console.log('Result:', goResult1);
  console.log();

  // ============================================================================
  // Example 3: Process "Go" Command (Blocked State)
  // ============================================================================
  console.log('📚 Example 3: Processing "Go" command when blocked...\n');

  // Set context to blocked
  client.setTaskState('blocked');

  const goResult2 = await client.processCommand('Go');
  console.log('Command: "Go"');
  console.log('Context: blocked');
  console.log('Result:', goResult2);
  console.log();

  // ============================================================================
  // Example 4: Process "Done" Command
  // ============================================================================
  console.log('📚 Example 4: Processing "Done" command...\n');

  const doneResult = await client.processCommand('Done');
  console.log('Command: "Done"');
  console.log('Result:', doneResult);
  console.log();

  // ============================================================================
  // Example 5: Update Todo Context
  // ============================================================================
  console.log('📚 Example 5: Updating todo context...\n');

  const todos = [
    { id: 1, content: 'Task 1', status: 'completed' },
    { id: 2, content: 'Task 2', status: 'in_progress' },
    { id: 3, content: 'Task 3', status: 'pending' },
  ];

  client.updateTodoContext(todos);

  const context = client.getSessionContext();
  console.log('Todo context updated:');
  console.log(`  Active todos: ${context?.context.activeTodos?.length}`);
  console.log(`  Completed todos: ${context?.context.completedTodos?.length}`);
  console.log(`  Task state: ${context?.context.taskState}`);
  console.log();

  // ============================================================================
  // Example 6: Custom Command Processing
  // ============================================================================
  console.log('📚 Example 6: Processing custom commands...\n');

  // Unknown command
  const unknownResult = await client.processCommand('CustomCommand');
  console.log('Command: "CustomCommand"');
  console.log('Result:', unknownResult);
  console.log();

  // ============================================================================
  // Example 7: Get Session Context
  // ============================================================================
  console.log('📚 Example 7: Inspecting session context...\n');

  const fullContext = client.getSessionContext();
  if (fullContext) {
    console.log('Session Context:');
    console.log(`  User ID: ${fullContext.userId}`);
    console.log(`  Rules: ${fullContext.rules.length} total`);
    console.log(`  Task State: ${fullContext.context.taskState}`);
    console.log(`  Current Activity: ${fullContext.context.currentActivity || 'none'}`);
    console.log(`  Session Duration: ${fullContext.context.sessionDuration?.toFixed(2)} minutes`);
  }
  console.log();

  // ============================================================================
  // Example 8: Refresh Rules (reload from Airtable)
  // ============================================================================
  console.log('📚 Example 8: Refreshing rules from Airtable...\n');

  await client.refreshRules();
  console.log('✓ Rules refreshed from Airtable');
  console.log();

  // ============================================================================
  // Example 9: Creating Custom Rules
  // ============================================================================
  console.log('📚 Example 9: Creating custom rules...\n');

  console.log('To create custom rules, use the RulesClient directly:');
  console.log(`
  import { RulesClient, getConfig } from '@claude/persistent-memory';

  const config = getConfig();
  const rulesClient = new RulesClient(config);

  const customRule = await rulesClient.createRule({
    userId: config.userId,
    ruleType: 'COMMAND',
    trigger: 'ship',
    action: {
      type: 'macro',
      steps: ['test', 'build', 'commit', 'push']
    },
    priority: 90,
    isActive: true,
    description: 'Ship code to production'
  });
  `);
  console.log();

  // ============================================================================
  // Example 10: Workflow Integration
  // ============================================================================
  console.log('📚 Example 10: Workflow integration example...\n');

  console.log('In production, you would integrate with actual workflow:');
  console.log(`
  async function handleUserCommand(input: string) {
    const result = await client.processCommand(input);

    if (!result.success) {
      console.error('Error:', result.error);
      return;
    }

    // Execute actions if any
    if (result.actions) {
      for (const action of result.actions) {
        await executeWorkflowStep(action);
      }
    }

    // Show response to user
    console.log(result.response);
  }
  `);
  console.log();

  console.log('✅ All examples completed!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Set up PromptingRules table in Airtable (see AIRTABLE-SCHEMA.md)');
  console.log('  2. Configure your own rules via Airtable UI or RulesClient');
  console.log('  3. Integrate processCommand() into your application');
  console.log('  4. Enjoy intelligent, context-aware command processing!');
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
