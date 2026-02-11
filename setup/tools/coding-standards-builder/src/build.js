#!/usr/bin/env node
/**
 * Build script for coding standards
 * Compiles individual rule files into a single AGENTS.md document
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

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

function parseSections(content) {
  const sections = [];
  const regex = /## (\d+)\. ([^(]+)\((\w+)\)\n\n\*\*Impact:\*\* (\w+[-\w]*)\s*\n\*\*Description:\*\* ([^\n]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    sections.push({
      number: parseInt(match[1]),
      title: match[2].trim(),
      prefix: match[3],
      impact: match[4],
      description: match[5]
    });
  }

  return sections;
}

function build() {
  const rulesDir = join(targetDir, 'rules');
  const metadataPath = join(targetDir, 'metadata.json');
  const outputPath = join(targetDir, 'AGENTS.md');

  if (!existsSync(rulesDir)) {
    console.error(`Rules directory not found: ${rulesDir}`);
    process.exit(1);
  }

  // Read metadata
  let metadata = {};
  if (existsSync(metadataPath)) {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  }

  // Parse sections
  const sectionsPath = join(rulesDir, '_sections.md');
  let sections = [];
  if (existsSync(sectionsPath)) {
    const sectionsContent = readFileSync(sectionsPath, 'utf-8');
    sections = parseSections(sectionsContent);
  }

  // Read all rule files
  const ruleFiles = readdirSync(rulesDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

  const rules = ruleFiles.map(file => {
    const content = readFileSync(join(rulesDir, file), 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const prefix = file.split('-')[0];
    return { file, prefix, frontmatter, body };
  });

  // Group rules by section
  const rulesBySection = {};
  rules.forEach(rule => {
    if (!rulesBySection[rule.prefix]) {
      rulesBySection[rule.prefix] = [];
    }
    rulesBySection[rule.prefix].push(rule);
  });

  // Sort rules within each section by title
  Object.values(rulesBySection).forEach(sectionRules => {
    sectionRules.sort((a, b) =>
      (a.frontmatter.title || '').localeCompare(b.frontmatter.title || '')
    );
  });

  // Build output
  let output = `# ${metadata.organization || 'Coding Standards'}\n\n`;

  if (metadata.abstract) {
    output += `${metadata.abstract}\n\n`;
  }

  output += `---\n\n`;

  // Table of Contents
  output += `## Table of Contents\n\n`;
  sections.forEach(section => {
    output += `${section.number}. [${section.title}](#${section.number}-${section.title.toLowerCase().replace(/\s+/g, '-')}) (${section.impact})\n`;
  });
  output += `\n---\n\n`;

  // Rules by section
  sections.forEach(section => {
    output += `## ${section.number}. ${section.title}\n\n`;
    output += `**Impact:** ${section.impact}  \n`;
    output += `**Description:** ${section.description}\n\n`;

    const sectionRules = rulesBySection[section.prefix] || [];
    sectionRules.forEach((rule, idx) => {
      const ruleNum = `${section.number}.${idx + 1}`;
      output += `### ${ruleNum} ${rule.frontmatter.title || 'Untitled'}\n\n`;
      if (rule.frontmatter.impactDescription) {
        output += `**Impact:** ${rule.frontmatter.impactDescription}\n\n`;
      }
      output += rule.body.trim() + '\n\n';
    });
  });

  // Write output
  writeFileSync(outputPath, output);
  console.log(`Built ${outputPath} with ${rules.length} rules across ${sections.length} sections`);
}

build();
