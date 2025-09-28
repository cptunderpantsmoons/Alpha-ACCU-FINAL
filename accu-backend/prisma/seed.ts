import { PrismaClient, Classification, LoanStatus, ReclassificationStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clean up existing data
  await prisma.loan.deleteMany();
  await prisma.reclassificationRequest.deleteMany();
  await prisma.valuationLog.deleteMany();
  await prisma.aCCU.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.creditor.deleteMany();
  await prisma.marketPrice.deleteMany();

  // Seed Entities
  const entities = [];
  for (let i = 0; i < 24; i++) {
    const entity = await prisma.entity.create({
      data: {
        name: faker.company.name(),
      },
    });
    entities.push(entity);
  }

  // Seed Market Prices
  for (let i = 0; i < 100; i++) {
    await prisma.marketPrice.create({
      data: {
        price: faker.number.float({ min: 28, max: 35, fractionDigits: 2 }),
        date: faker.date.recent({ days: 30 }),
        commodityType: 'ACCU',
        source: 'Jarden',
        entityId: entities[i % entities.length].id,
      },
    });
  }

  // Seed Users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        roles: i % 2 === 0 ? 'admin' : 'user',
        entityId: entities[i % entities.length].id,
      },
    });
    users.push(user);
  }

  // Seed Creditors
  const creditors = [];
  for (let i = 0; i < 10; i++) {
    const creditor = await prisma.creditor.create({
      data: {
        name: faker.company.name(),
      },
    });
    creditors.push(creditor);
  }

  // Seed Projects
  const projects = [];
  for (let i = 0; i < 50; i++) {
    const project = await prisma.project.create({
      data: {
        name: faker.lorem.words(3),
        method: faker.helpers.arrayElement(['Soil Carbon', 'Vegetation', 'Landfill Gas']),
        methodType: faker.helpers.arrayElement(['Sequestering', 'Avoidance']),
      },
    });
    projects.push(project);
  }

  // Seed ACCUs
  const accus = [];
  for (let i = 0; i < 200; i++) {
    const serialStart = faker.number.int({ min: 1000000, max: 9000000 });
    const quantity = faker.number.int({ min: 100, max: 1000 });
    const accu = await prisma.aCCU.create({
      data: {
        batchNumber: `ACCU-202301-${i.toString().padStart(3, '0')}`,
        quantity: quantity,
        acquisitionCost: faker.number.float({ min: 25, max: 30, fractionDigits: 2 }),
        classification: faker.helpers.arrayElement([Classification.inventory, Classification.intangible, Classification.fvtpl]),
        acquisitionDate: faker.date.past(),
        entityId: entities[i % entities.length].id,
        userId: users[i % users.length].id,
        projectId: projects[i % projects.length].id,
        vintage: faker.date.past({ years: 5 }).getFullYear().toString(),
        location: `${faker.location.state()}, Australia`,
        issuanceDate: faker.date.past({ years: 2 }),
        serialRangeStart: serialStart.toString(),
        serialRangeEnd: (serialStart + quantity - 1).toString(),
        category: faker.helpers.arrayElement(['Generic', 'Savanna Burning', 'Human-Induced Regeneration']),
      },
    });
    accus.push(accu);
  }

  // Seed Loans
  for (let i = 0; i < 60; i++) {
    await prisma.loan.create({
      data: {
        batchId: accus[i % accus.length].id,
        creditorId: creditors[i % creditors.length].id,
        quantity: faker.number.int({ min: 50, max: 100 }),
        loanAmount: faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 }),
        buybackRate: faker.number.float({ min: 5, max: 10, fractionDigits: 2 }),
        buybackDate: faker.date.future(),
        collateralValue: faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 }),
        entityId: entities[i % entities.length].id,
      },
    });
  }

  // Seed Reclassification Requests
  for (let i = 0; i < 30; i++) {
    await prisma.reclassificationRequest.create({
      data: {
        batchId: accus[i % accus.length].id,
        fromClass: Classification.inventory,
        toClass: Classification.intangible,
        reason: 'NRV below cost',
        status: faker.helpers.arrayElement([ReclassificationStatus.pending, ReclassificationStatus.approved, ReclassificationStatus.rejected]),
        submittedBy: users[i % users.length].id,
        entityId: entities[i % entities.length].id,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });