import axios from "axios";
import * as pgvector from 'pgvector';
import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";

const endpoint = "http://192.168.0.23:3000/api/embeddings";

async function getEmbedings(data: string) {
  let { data: res } = await axios.post(endpoint, {
    sentence: data
  })
  if (!res.embeddings) throw new Error("Failed to get embedings");
  return res.embeddings
}

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    const query = req.query.query as string;
    if (!query) {
      res.render('index', { results: [] });
      return;
    }

    const PostRepo = AppDataSource.getRepository(Post);
    const posts = await PostRepo
      .createQueryBuilder('post')
      .select(['post.title', 'post.link', "post.id"])
      .orderBy('embeddings <=> :embeddings')
      .setParameters({ embeddings: pgvector.toSql(await getEmbedings(query)) })
      .limit(50)
      .getMany();

    res.render('index', { results: posts, query });
  }
}