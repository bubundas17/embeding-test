import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { PostEmbedding1703075475437 } from "./migration/1703075475437-PostEmbeding"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "root",
    password: "7EsEMi4vHbT3tL",
    database: "posts",
    synchronize: false,
    logging: false,
    entities: [User, Post],
    migrations: [PostEmbedding1703075475437],
    subscribers: [],
})
