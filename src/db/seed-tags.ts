import 'dotenv/config';
import { db } from './index';
import { tagCategories, tags } from './schema';
import { randomUUID } from 'crypto';

async function seedTags() {
  console.log('Starting tag categories and tags seed...');

  // Get or create system user ID from users table
  const systemUserId = 'system';

  // ============================================================================
  // TAG CATEGORIES
  // ============================================================================

  // Condition category
  const conditionCategoryId = randomUUID();
  await db.insert(tagCategories).values({
    id: conditionCategoryId,
    name: 'Condition',
    description: 'Condition status of resources',
    createdById: systemUserId,
    createdAt: new Date(),
  });
  console.log('Created tag category: Condition');

  // Status category
  const statusCategoryId = randomUUID();
  await db.insert(tagCategories).values({
    id: statusCategoryId,
    name: 'Status',
    description: 'Availability status of resources',
    createdById: systemUserId,
    createdAt: new Date(),
  });
  console.log('Created tag category: Status');

  // Location Type category
  const locationTypeCategoryId = randomUUID();
  await db.insert(tagCategories).values({
    id: locationTypeCategoryId,
    name: 'Location Type',
    description: 'Type classification for locations',
    createdById: systemUserId,
    createdAt: new Date(),
  });
  console.log('Created tag category: Location Type');

  // ============================================================================
  // CONDITION TAGS
  // ============================================================================

  const conditionTags = [
    { name: 'Excellent', color: '#4caf50', description: 'In excellent condition' },
    { name: 'Good', color: '#2196f3', description: 'In good condition' },
    { name: 'Fair', color: '#ff9800', description: 'In fair condition' },
    { name: 'Poor', color: '#f44336', description: 'In poor condition' },
    { name: 'Broken', color: '#d32f2f', description: 'Broken or non-functional' },
  ];

  for (const tag of conditionTags) {
    await db.insert(tags).values({
      id: randomUUID(),
      categoryId: conditionCategoryId,
      name: tag.name,
      description: tag.description,
      color: tag.color,
      createdById: systemUserId,
      createdAt: new Date(),
    });
    console.log(`Created condition tag: ${tag.name}`);
  }

  // ============================================================================
  // STATUS TAGS
  // ============================================================================

  const statusTags = [
    { name: 'Available', color: '#4caf50', description: 'Available for use' },
    { name: 'Checked Out', color: '#757575', description: 'Currently checked out' },
    { name: 'In Maintenance', color: '#ff9800', description: 'Under maintenance' },
    { name: 'Reserved', color: '#2196f3', description: 'Reserved for future use' },
  ];

  for (const tag of statusTags) {
    await db.insert(tags).values({
      id: randomUUID(),
      categoryId: statusCategoryId,
      name: tag.name,
      description: tag.description,
      color: tag.color,
      createdById: systemUserId,
      createdAt: new Date(),
    });
    console.log(`Created status tag: ${tag.name}`);
  }

  // ============================================================================
  // LOCATION TYPE TAGS
  // ============================================================================

  const locationTypeTags = [
    { name: 'Area', color: '#9c27b0', description: 'Large area or section' },
    { name: 'Zone', color: '#673ab7', description: 'Zone within an area' },
    { name: 'Cabinet', color: '#3f51b5', description: 'Storage cabinet' },
    { name: 'Drawer', color: '#2196f3', description: 'Drawer within furniture' },
    { name: 'Bin', color: '#03a9f4', description: 'Storage bin or container' },
  ];

  for (const tag of locationTypeTags) {
    await db.insert(tags).values({
      id: randomUUID(),
      categoryId: locationTypeCategoryId,
      name: tag.name,
      description: tag.description,
      color: tag.color,
      createdById: systemUserId,
      createdAt: new Date(),
    });
    console.log(`Created location type tag: ${tag.name}`);
  }

  console.log('\nTag seed completed successfully!');
  console.log('\nSummary:');
  console.log('- Created 3 tag categories (Condition, Status, Location Type)');
  console.log('- Created 5 condition tags');
  console.log('- Created 4 status tags');
  console.log('- Created 5 location type tags');
}

seedTags()
  .then(() => {
    console.log('\n✓ Tag seed process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Tag seed process failed:');
    console.error(error);
    process.exit(1);
  });
