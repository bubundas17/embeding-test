import axios from "axios"
import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
import * as pgvector from 'pgvector';
import { IsNull } from "typeorm";
import * as TurndownService from 'turndown';
const td = new TurndownService()

const endpoint = "http://192.168.0.23:3000/api/embeddings";
async function getEmbedings(data: string) {
    let { data: res } = await axios.post(endpoint, {
        sentence: data
    })
    if (!res.embeddings) throw new Error("Failed to get embedings");
    return res.embeddings
}

AppDataSource.initialize().then(async () => {
    const PostRepo = AppDataSource.getRepository(Post)

    while (true) {
        let posts = await PostRepo.find({
            where: {
                embeddings: IsNull()
            },
            take: 100,
            order: {
                id: "ASC"
            }
        })
        if(!posts.length) break;

        for (let post of posts) {
            let embedings = await getEmbedings(post.title + "\n\n" + td.turndown(post.content))
            await PostRepo.update({ id: post.id }, { embeddings: pgvector.toSql(embedings) })
            console.log("Embedings created: ", post.id, post.title)
        }
    }

    console.log("Done")

    // console.log(await getEmbedings("asdjsahd"))
})
