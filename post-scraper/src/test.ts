import axios from "axios"
import * as pgvector from 'pgvector';
import { IsNull } from "typeorm";
import { AppDataSource } from "./data-source";
import { Post } from "./entity/Post";

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
  const posts = await PostRepo
    .createQueryBuilder('post')
    .select(['post.title', 'post.link'])
    .orderBy('embeddings <=> :embeddings')
    .setParameters({ embeddings: pgvector.toSql(await getEmbedings("torrent")) })
    .limit(50)
    .getMany();

  console.log(posts)
  // console.log(await getEmbedings("asdjsahd"))
})
