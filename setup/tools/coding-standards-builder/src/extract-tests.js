#!/usr/bin/env node
/**
 * Extract test cases from coding standards rules
 * Generates test-cases.json for LLM evaluation
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const targetDir = process.argv[2] || '.';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { frontmatter, body: match[2] };
}

function extractCodeBlocks(content) {
  const blocks = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return blocks;
}

function extractTests() {
  const rulesDir = join(targetDir, 'rules');
  const outputPath = join(targetDir, 'test-cases.json');

  if (!existsSync(rulesDir)) {
    console.error(`Rules directory not found: ${rulesDir}`);
    process.exit(1);
  }

  const ruleFiles = readdirSync(rulesDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  const testCases = [];

  ruleFiles.forEach(file => {
    const content = readFileSync(join(rulesDir, file), 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const codeBlocks = extractCodeBlocks(body);

    // Find incorrect and correct examples
    const incorrectMatch = body.match(/\*\*Incorrect[^*]*\*\*[:\s]*\n\n```(\w+)?\n([\s\S]*?)```/);
    const correctMatch = body.match(/\*\*Correct[^*]*\*\*[:\s]*\n\n```(\w+)?\n([\s\S]*?)```/);

    if (incorrectMatch && correctMatch) {
      testCases.push({
        rule: file.replace('.md', ''),
        title: frontmatter.title,
        impact: frontmatter.impact,
        tags: frontmatter.tags ? frontmatter.tags.split(',').map(t => t.trim()) : [],
        incorrect: {
          language: incorrectMatch[1] || 'text',
          code: incorrectMatch[2].trim()
        },
        correct: {
          language: correctMatch[1] || 'text',
          code: correctMatch[2].trim()
        }
      });
    }
  });

  writeFileSync(outputPath, JSON.stringify(testCases, null, 2));
  console.log(`Extracted ${testCases.length} test cases to ${outputPath}`);
}

extractTests();
