#!/usr/bin/env node
/**
 * Validate script for coding standards
 * Checks that all rule files have valid frontmatter and structure
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const targetDir = process.argv[2] || '.';

const VALID_IMPACTS = ['CRITICAL', 'HIGH', 'MEDIUM-HIGH', 'MEDIUM', 'LOW-MEDIUM', 'LOW'];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { frontmatter, body: match[2] };
}

function validate() {
  const rulesDir = join(targetDir, 'rules');

  if (!existsSync(rulesDir)) {
    console.error(`Rules directory not found: ${rulesDir}`);
    process.exit(1);
  }

  const ruleFiles = readdirSync(rulesDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  let errors = 0;
  let warnings = 0;

  ruleFiles.forEach(file => {
    const content = readFileSync(join(rulesDir, file), 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.error(`❌ ${file}: Missing or invalid frontmatter`);
      errors++;
      return;
    }

    const { frontmatter, body } = parsed;

    // Check required fields
    if (!frontmatter.title) {
      console.error(`❌ ${file}: Missing 'title' in frontmatter`);
      errors++;
    }

    if (!frontmatter.impact) {
      console.error(`❌ ${file}: Missing 'impact' in frontmatter`);
      errors++;
    } else if (!VALID_IMPACTS.includes(frontmatter.impact)) {
      console.error(`❌ ${file}: Invalid impact '${frontmatter.impact}'. Must be one of: ${VALID_IMPACTS.join(', ')}`);
      errors++;
    }

    // Check for code examples
    if (!body.includes('```')) {
      console.warn(`⚠️  ${file}: No code examples found`);
      warnings++;
    }

    // Check for Incorrect/Correct pattern
    if (!body.includes('Incorrect') && !body.includes('incorrect')) {
      console.warn(`⚠️  ${file}: Missing 'Incorrect' example section`);
      warnings++;
    }

    if (!body.includes('Correct') && !body.includes('correct')) {
      console.warn(`⚠️  ${file}: Missing 'Correct' example section`);
      warnings++;
    }
  });

  console.log(`\nValidation complete: ${ruleFiles.length} files checked`);
  console.log(`  ${errors} errors, ${warnings} warnings`);

  if (errors > 0) {
    process.exit(1);
  }
}

validate();
