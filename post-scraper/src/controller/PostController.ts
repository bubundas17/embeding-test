import axios from "axios";
import * as pgvector from 'pgvector';
import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
import * as TurndownService from 'turndown';
import { marked } from 'marked';

const endpoint = "http://192.168.0.23:3000/api/embeddings";

async function getEmbedings(data: string) {
    let { data: res } = await axios.post(endpoint, {
        sentence: data
    })
    if (!res.embeddings) throw new Error("Failed to get embedings");
    return res.embeddings
}
const td = new TurndownService()
export class PostController {

    async show(req: Request, res: Response, next: NextFunction) {
        const postId = req.params.id;
        const PostRepo = AppDataSource.getRepository(Post);
        const post = await PostRepo.findOne({ where: { id: parseInt(postId) } });
        if (!post) {
            res.status(404).send("Post not found");
            return;
        }
        post.content = td.turndown(post.content);
        const markdown = post.content
        post.content = await marked.parse(post.content);

        // related posts
        const relatedPosts = await PostRepo
            .createQueryBuilder('post')
            .select(['post.title', 'post.link', "post.id"])
            .where("post.id != :postId", { postId: post.id }) // Exclude current post
            .orderBy('embeddings <=> :embeddings')
            .setParameters({ embeddings: post.embeddings })
            .limit(10)
            .getMany();
        res.render('view-post', { post, relatedPosts, markdown });
    }
}