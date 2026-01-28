-- AlterTable: Change id column from text (cuid) to uuid
-- Add the uuid extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the existing primary key constraint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";

-- Alter the id column to use uuid type
-- For existing data, generate new UUIDs
ALTER TABLE "users" 
ALTER COLUMN "id" TYPE uuid USING gen_random_uuid();

-- Set the default to uuid_generate_v4()
ALTER TABLE "users" 
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- Re-add the primary key constraint
ALTER TABLE "users" 
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
