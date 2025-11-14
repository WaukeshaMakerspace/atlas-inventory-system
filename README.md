# Atlas - Makerspace Inventory System

Atlas is a comprehensive inventory management system designed for makerspaces. It helps users quickly find tools, equipment, materials, and supplies across hierarchical shop locations.

## Features

- **Fast Search**: Find resources by name, tags, and location path
- **Hierarchical Locations**: Organize items in areas → zones → cabinets → drawers → bins
- **Resource Management**: Separate resource models (e.g., "#2 Phillips Screwdriver") from physical instances
- **Role-Based Access**: Anonymous read access; authenticated users with roles can create/update
- **API Integration**: API keys for machine integrations (e.g., "Shop AI" bot, signage)
- **Image Storage**: Store images on S3; attach to locations, tags, and resource models
- **Audit Trail**: Track who did what and when
- **Checkout System**: Track tool checkouts and returns

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MySQL (AWS RDS) via Drizzle ORM
- **UI**: Material UI
- **Authentication**: NextAuth.js
- **Storage**: AWS S3
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local MySQL database)
- AWS account (for S3 image storage)

### Database Setup (Docker)

The easiest way to get started is to use Docker for your local MySQL database.

1. **Start the MySQL database**
   ```bash
   docker-compose up -d
   ```

   This will start a MySQL 8.0 container with the following default credentials:
   - Database: `atlas`
   - User: `user`
   - Password: `password`
   - Root Password: `rootpassword`
   - Port: `3306`

2. **Verify the database is running**
   ```bash
   docker-compose ps
   ```

3. **Stop the database** (when needed)
   ```bash
   docker-compose down
   ```

4. **Stop and remove data** (to start fresh)
   ```bash
   docker-compose down -v
   ```

The database data is persisted in a Docker volume, so your data will survive container restarts.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waukesha-makers-atlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL`: Already configured for Docker (mysql://user:password@localhost:3306/atlas)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - AWS credentials for S3
   - OAuth provider credentials (optional)

   Note: The default `DATABASE_URL` in `.env.example` matches the Docker Compose credentials.

4. **Set up the database**

   Push schema to database:
   ```bash
   npm run db:push
   ```

   Or generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   Seed the database with sample data (optional):
   ```bash
   npm run db:seed
   ```

   This will create:
   - Sample locations: Assembly → Bench A → Drawer 1, Automotive → Toolbox A → Drawer 1
   - Sample resources: #2 Phillips Screwdriver (2 instances), 3" Crescent Wrench (1 instance)

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Tables

- **users**: User accounts and authentication
- **locations**: Hierarchical location structure (areas → zones → cabinets → drawers → bins)
- **resource_models**: Abstract resource definitions (e.g., "Phillips Screwdriver #2")
- **resource_instances**: Physical items that belong to a model
- **tags**: Categorization tags for resources
- **images**: S3-stored images attached to various entities
- **checkouts**: Track tool checkout and return
- **audit_logs**: Complete audit trail of all changes
- **api_keys**: API keys for external integrations

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   └── search/        # Search API
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── SearchBar.tsx      # Search component
├── db/                    # Database layer
│   ├── schema.ts          # Drizzle ORM schema
│   └── index.ts           # Database connection
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript type definitions
    └── index.ts           # Shared types
```

## Database Commands

- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema directly to database (development)
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Development

### Code Quality

```bash
npm run lint          # Run ESLint
npm run build         # Build for production
```

### Database Schema Changes

1. Modify `src/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply changes
4. Or use `npm run db:push` for quick iteration in development

## API Routes

### Search Resources
```
GET /api/search?q=screwdriver&page=1&pageSize=20
```

Query parameters:
- `q`: Search query
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `locationId`: Filter by location

## Deployment

### Environment Variables

Ensure all production environment variables are set:
- Database connection string
- NextAuth configuration
- AWS credentials
- OAuth provider credentials

### Build

```bash
npm run build
npm run start
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
