import 'dotenv/config';
import { db } from './index';
import {
  users,
  locations,
  resourceModels,
  resourceInstances,
  tags,
  tagCategories,
  resourceInstanceTags,
} from './schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Starting database seed...');

  // Create a system user for seeding
  const systemUserId = randomUUID();
  await db.insert(users).values({
    id: systemUserId,
    email: 'system@atlas.local',
    name: 'System',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created system user');

  // ============================================================================
  // LOCATIONS - Assembly Branch
  // ============================================================================

  // Assembly (Area)
  const assemblyId = randomUUID();
  await db.insert(locations).values({
    id: assemblyId,
    name: 'Assembly',
    type: 'area',
    description: 'Assembly area',
    parentId: null,
    path: '/Assembly',
    pathIds: `/${assemblyId}`,
    sortOrder: 0,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Assembly');

  // Bench A (Zone within Assembly)
  const benchAId = randomUUID();
  await db.insert(locations).values({
    id: benchAId,
    name: 'Bench A',
    type: 'zone',
    description: 'Work bench A in Assembly area',
    parentId: assemblyId,
    path: '/Assembly/Bench A',
    pathIds: `/${assemblyId}/${benchAId}`,
    sortOrder: 0,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Assembly -> Bench A');

  // Drawer 1 (in Bench A)
  const assemblyDrawer1Id = randomUUID();
  await db.insert(locations).values({
    id: assemblyDrawer1Id,
    name: 'Drawer 1',
    type: 'drawer',
    description: 'Drawer 1 in Bench A',
    parentId: benchAId,
    path: '/Assembly/Bench A/Drawer 1',
    pathIds: `/${assemblyId}/${benchAId}/${assemblyDrawer1Id}`,
    sortOrder: 0,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Assembly -> Bench A -> Drawer 1');

  // ============================================================================
  // LOCATIONS - Automotive Branch
  // ============================================================================

  // Automotive (Area)
  const automotiveId = randomUUID();
  await db.insert(locations).values({
    id: automotiveId,
    name: 'Automotive',
    type: 'area',
    description: 'Automotive area',
    parentId: null,
    path: '/Automotive',
    pathIds: `/${automotiveId}`,
    sortOrder: 1,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Automotive');

  // Toolbox A (Zone within Automotive)
  const toolboxAId = randomUUID();
  await db.insert(locations).values({
    id: toolboxAId,
    name: 'Toolbox A',
    type: 'zone',
    description: 'Toolbox A in Automotive area',
    parentId: automotiveId,
    path: '/Automotive/Toolbox A',
    pathIds: `/${automotiveId}/${toolboxAId}`,
    sortOrder: 0,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Automotive -> Toolbox A');

  // Drawer 1 (in Toolbox A)
  const automotiveDrawer1Id = randomUUID();
  await db.insert(locations).values({
    id: automotiveDrawer1Id,
    name: 'Drawer 1',
    type: 'drawer',
    description: 'Drawer 1 in Toolbox A',
    parentId: toolboxAId,
    path: '/Automotive/Toolbox A/Drawer 1',
    pathIds: `/${automotiveId}/${toolboxAId}/${automotiveDrawer1Id}`,
    sortOrder: 0,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created location: Automotive -> Toolbox A -> Drawer 1');

  // ============================================================================
  // RESOURCE MODELS
  // ============================================================================

  // #2 Phillips Screwdriver
  const phillipsScrewdriverId = randomUUID();
  await db.insert(resourceModels).values({
    id: phillipsScrewdriverId,
    name: '#2 Phillips Screwdriver',
    description: 'Standard #2 Phillips head screwdriver',
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created resource model: #2 Phillips Screwdriver');

  // 3" Crescent Wrench
  const crescentWrenchId = randomUUID();
  await db.insert(resourceModels).values({
    id: crescentWrenchId,
    name: '3" Crescent Wrench',
    description: '3 inch adjustable crescent wrench',
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created resource model: 3" Crescent Wrench');

  // ============================================================================
  // RESOURCE INSTANCES
  // ============================================================================

  // #2 Phillips Screwdriver in Assembly -> Bench A -> Drawer 1
  const instance1Id = randomUUID();
  await db.insert(resourceInstances).values({
    id: instance1Id,
    modelId: phillipsScrewdriverId,
    locationId: assemblyDrawer1Id,
    quantity: 1,
    condition: 'good',
    isCheckoutEnabled: true,
    isAvailable: true,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created resource instance: #2 Phillips Screwdriver in Assembly -> Bench A -> Drawer 1');

  // #2 Phillips Screwdriver in Automotive -> Toolbox A -> Drawer 1
  const instance2Id = randomUUID();
  await db.insert(resourceInstances).values({
    id: instance2Id,
    modelId: phillipsScrewdriverId,
    locationId: automotiveDrawer1Id,
    quantity: 1,
    condition: 'good',
    isCheckoutEnabled: true,
    isAvailable: true,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created resource instance: #2 Phillips Screwdriver in Automotive -> Toolbox A -> Drawer 1');

  // 3" Crescent Wrench in Assembly -> Bench A -> Drawer 1
  const instance3Id = randomUUID();
  await db.insert(resourceInstances).values({
    id: instance3Id,
    modelId: crescentWrenchId,
    locationId: assemblyDrawer1Id,
    quantity: 1,
    condition: 'good',
    isCheckoutEnabled: true,
    isAvailable: true,
    createdById: systemUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created resource instance: 3" Crescent Wrench in Assembly -> Bench A -> Drawer 1');

  // ============================================================================
  // ADD TAGS TO RESOURCE INSTANCES
  // ============================================================================

  // Fetch tag categories and tags
  const categories = await db.select().from(tagCategories);
  const conditionCategory = categories.find(c => c.name === 'Condition');
  const statusCategory = categories.find(c => c.name === 'Status');

  if (conditionCategory && statusCategory) {
    const allTags = await db.select().from(tags);
    const goodTag = allTags.find(t => t.categoryId === conditionCategory.id && t.name === 'Good');
    const availableTag = allTags.find(t => t.categoryId === statusCategory.id && t.name === 'Available');

    if (goodTag && availableTag) {
      const instanceIds = [instance1Id, instance2Id, instance3Id];

      for (const instanceId of instanceIds) {
        // Add Good tag
        await db.insert(resourceInstanceTags).values({
          id: randomUUID(),
          instanceId,
          tagId: goodTag.id,
          createdAt: new Date(),
        });

        // Add Available tag
        await db.insert(resourceInstanceTags).values({
          id: randomUUID(),
          instanceId,
          tagId: availableTag.id,
          createdAt: new Date(),
        });
      }

      console.log('Added tags to all resource instances');
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('\nSummary:');
  console.log('- Created 1 system user');
  console.log('- Created 6 locations (2 areas, 2 zones, 2 drawers)');
  console.log('- Created 2 resource models');
  console.log('- Created 3 resource instances');
  console.log('- Added tags to resource instances (Good, Available)');
}

seed()
  .then(() => {
    console.log('\n✓ Seed process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed process failed:');
    console.error(error);
    process.exit(1);
  });
