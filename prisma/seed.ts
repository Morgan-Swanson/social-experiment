import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { createStorageAdapter } from '../src/lib/adapters/storage';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test user
  const hashedPassword = await hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      hashedPassword: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('Created test user:', user.email);

  // Create sample classifiers
  const sentimentClassifier = await prisma.classifier.upsert({
    where: { id: 'classifier-sentiment' },
    update: {},
    create: {
      id: 'classifier-sentiment',
      name: 'Sentiment Analysis',
      prompt: 'Classify the sentiment of this text as: positive, negative, or neutral. Return a confidence score (0.0-1.0).',
      userId: user.id,
    },
  });

  const ideologyClassifier = await prisma.classifier.upsert({
    where: { id: 'classifier-ideology' },
    update: {},
    create: {
      id: 'classifier-ideology',
      name: 'Political Ideology',
      prompt: 'Classify the political ideology as: liberal, conservative, moderate, libertarian, or socialist. Return a confidence score (0.0-1.0).',
      userId: user.id,
    },
  });

  const topicClassifier = await prisma.classifier.upsert({
    where: { id: 'classifier-topic' },
    update: {},
    create: {
      id: 'classifier-topic',
      name: 'Topic Classification',
      prompt: 'Identify the primary topic as: economy, healthcare, education, foreign_policy, environment, social_issues, immigration, or crime. Return a confidence score (0.0-1.0).',
      userId: user.id,
    },
  });

  console.log('Created classifiers:', [
    sentimentClassifier.name,
    ideologyClassifier.name,
    topicClassifier.name,
  ]);

  // Create sample model constraints
  const scoringConstraint = await prisma.modelConstraint.upsert({
    where: { id: 'constraint-scoring' },
    update: {},
    create: {
      id: 'constraint-scoring',
      name: 'Scoring Rules',
      rules: 'All classifications must include a confidence score between 0-100. When unsure, scores should be below 60. Only assign scores above 80 when the classification is highly certain.',
      userId: user.id,
    },
  });

  const reasoningConstraint = await prisma.modelConstraint.upsert({
    where: { id: 'constraint-reasoning' },
    update: {},
    create: {
      id: 'constraint-reasoning',
      name: 'Reasoning Requirements',
      rules: 'All classifications must include detailed reasoning that cites specific words, phrases, or patterns from the text. Reasoning should be at least 2-3 sentences explaining the classification decision.',
      userId: user.id,
    },
  });

  console.log('Created constraints:', [
    scoringConstraint.name,
    reasoningConstraint.name,
  ]);

  // Create sample CSV data
  const csvDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  const sampleCsv1 = `id,text,author,date
1,"The new healthcare bill will expand coverage to millions of Americans, ensuring everyone has access to quality medical care.",Senator Smith,2024-01-15
2,"We need to cut taxes and reduce government regulation to let businesses thrive and create more jobs.",Rep. Johnson,2024-01-16
3,"Climate change is the defining challenge of our generation. We must invest in renewable energy now.",Mayor Brown,2024-01-17
4,"Education funding should be increased to ensure every child has access to quality schools and programs.",Council Member Davis,2024-01-18
5,"Border security must be our top priority. We need stronger enforcement of immigration laws.",Governor Wilson,2024-01-19
6,"Criminal justice reform is essential. We need to address systemic inequalities in our justice system.",Judge Martinez,2024-01-20
7,"Infrastructure investment will create jobs and improve our roads, bridges, and public transit.",Senator Lee,2024-01-21
8,"Small businesses are the backbone of our economy. We should reduce regulatory burdens on entrepreneurs.",Rep. Taylor,2024-01-22`;

  const sampleCsv2 = `id,tweet,username,timestamp
1,"Just voted for the infrastructure bill! This will create thousands of jobs in our district.",@politician_jane,2024-01-15T10:30:00
2,"The new tax policy is disastrous for middle-class families. We deserve better.",@concerned_voter,2024-01-15T11:45:00
3,"Universal healthcare is a human right. Time to join the rest of the developed world.",@progressive_voice,2024-01-15T14:20:00
4,"Proud to support our police officers who keep our communities safe every day.",@law_and_order,2024-01-15T16:00:00
5,"Climate action cannot wait. The science is clear and urgent.",@green_future,2024-01-16T09:15:00`;

  const csv1Path = path.join(csvDir, 'political-statements.csv');
  const csv2Path = path.join(csvDir, 'social-media-posts.csv');
  
  fs.writeFileSync(csv1Path, sampleCsv1);
  fs.writeFileSync(csv2Path, sampleCsv2);

  console.log('Created sample CSV files in data/ directory');

  // Upload files to storage
  const storage = createStorageAdapter();
  
  const storageKey1 = `datasets/${user.id}/seed-political-statements.csv`;
  const storageKey2 = `datasets/${user.id}/seed-social-media-posts.csv`;
  
  try {
    await storage.uploadFile(storageKey1, Buffer.from(sampleCsv1), 'text/csv');
    await storage.uploadFile(storageKey2, Buffer.from(sampleCsv2), 'text/csv');
    console.log('Uploaded files to storage');
  } catch (error) {
    console.error('Failed to upload to storage:', error);
    console.log('Note: Make sure MinIO/S3 is running and configured correctly');
  }

  // Delete old datasets if they exist to ensure clean seed
  await prisma.dataset.deleteMany({
    where: {
      id: {
        in: ['dataset-statements', 'dataset-social'],
      },
    },
  });

  // Create sample datasets with uploaded storage keys
  const dataset1 = await prisma.dataset.create({
    data: {
      id: 'dataset-statements',
      name: 'Political Statements',
      filename: 'political-statements.csv',
      storageKey: storageKey1,
      rowCount: 8,
      columns: ['id', 'text', 'author', 'date'],
      userId: user.id,
    },
  });

  const dataset2 = await prisma.dataset.create({
    data: {
      id: 'dataset-social',
      name: 'Social Media Posts',
      filename: 'social-media-posts.csv',
      storageKey: storageKey2,
      rowCount: 5,
      columns: ['id', 'tweet', 'username', 'timestamp'],
      userId: user.id,
    },
  });

  console.log('Created datasets:', [dataset1.name, dataset2.name]);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });