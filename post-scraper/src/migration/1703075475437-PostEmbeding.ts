import { MigrationInterface, QueryRunner, getConnection } from "typeorm";
import { Post } from "../entity/Post"; // Adjust the path as per your project structure

export class PostEmbedding1703075475437 implements MigrationInterface {
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure the pgvector extension is available
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

        // Dynamically get the table name from the Post entity

        // Add the 'embeddings' pgvector field to the 'post' table
        await queryRunner.query(`ALTER TABLE "post" ADD "embeddings" vector(768);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dynamically get the table name from the Post entity

        // Remove the 'embeddings' field from the 'post' table
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "embeddings";`);
    }

    private getTableName(entity: Function): string {
        const metadata = getConnection().getMetadata(entity);
        return metadata.tableName;
    }
}
