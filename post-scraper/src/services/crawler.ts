import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
let Parser = require('rss-parser');
let parser = new Parser();
let axios = require('axios');

enum FeedType {
    WORDPRESS_FEED = "wordpress_feed",
    WORDPRESS_API = "wordpress_api"
}
// https://beebom.com/wp-json/wp/v2/posts/?
const feeds = [

    // { feed: "https://www.digitalmarketer.com/feed/", type: FeedType.WORDPRESS_FEED, startPage: 94 },
    // { feed: "https://neilpatel.com/blog/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://wpmudev.com/blog/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://wpmailsmtp.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://thrivethemes.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://affiliatewp.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://smashballoon.com/", type: FeedType.WORDPRESS_API },
    // { feed: "https://yoast.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://easydigitaldownloads.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://torquemag.io/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://poststatus.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://optinmonster.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://www.codeinwp.com/", type: FeedType.WORDPRESS_API },
    // { feed: "https://wpforms.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://wptavern.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://www.isitwp.com/feed/", type: FeedType.WORDPRESS_FEED }, // 
    { feed: "https://www.wpbeginner.com/feed/", type: FeedType.WORDPRESS_FEED }, // 112
    // { feed: "https://analyticsindiamag.com/feed/", type: FeedType.WORDPRESS_FEED },
    // { feed: "https://analyticsindiamag.com/", type: FeedType.WORDPRESS_API },
    // { feed: "https://redmond.ai/", type: FeedType.WORDPRESS_API },
    // { feed: "https://deci.ai/", type: FeedType.WORDPRESS_API },
    // { feed: "https://beebom.com/", type: FeedType.WORDPRESS_API },
    // { feed: "https://deshersamay.com/feed", type: FeedType.WORDPRESS_FEED }
    // { feed: "https://deeanatech.com/feed", type: FeedType.WORDPRESS }
    // { feed: "https://bankingsikho.in/feed", type: FeedType.WORDPRESS }
    // { feed: "https://techiey.com/feed", type: FeedType.WORDPRESS }
    // { feed: "https://www.hostinger.com/blog/feed", type: FeedType.WORDPRESS }
]

async function fetchWordPressApiData(apiUrl, PostRepo) {
    let page = 1;
    while (true) {
        try {
            let response = await axios.get(`${apiUrl}wp-json/wp/v2/posts?page=${page}`);
            let posts = response.data;
            if (posts.length === 0) break;

            for (let post of posts) {
                let existingPost = await PostRepo.findOne({
                    where: {
                        guid: post.guid.rendered
                    }
                });

                // Fetch category names
                let categories = [];
                for (let categoryId of post.categories) {
                    let categoryResponse = await axios.get(`${apiUrl}wp-json/wp/v2/categories/${categoryId}`);
                    categories.push(categoryResponse.data.name);
                }

                // Fetch author name
                let authorResponse ;
                let authorName = ""
                try {
                    authorResponse = await axios.get(`${apiUrl}wp-json/wp/v2/users/${post.author}`);
                    authorName = authorResponse.data.name;
                } catch(e) {
                    
                }

                let postData = {
                    title: post.title.rendered,
                    guid: post.guid.rendered,
                    author: authorName,
                    link: post.link,
                    date: new Date(post.date),
                    content: post.content.rendered,
                    categories: categories
                };

                if (!existingPost) {
                    await PostRepo.save(postData);
                } else {
                    // Update existing record
                    await PostRepo.update({ guid: post.link }, postData);
                }

                console.log("Processed: ", post.link);
            }
            page++;
        } catch (e) {
            console.log(e);
            break;
        }
    }
}



AppDataSource.initialize().then(async () => {
    const PostRepo = AppDataSource.getRepository(Post)

    for (let feed of feeds) {
        if (feed.type == FeedType.WORDPRESS_FEED) {
            let page = 111;

            while (true) {
                try {
                    let feedUrl = await parser.parseURL(feed.feed + '?paged=' + page);
                    let items = feedUrl.items
                    for (let item of items) {
                        let existingPost = await PostRepo.findOne({
                            where: {
                                guid: item.guid
                            }
                        })

                        if (!existingPost) {
                            await PostRepo.save({
                                title: item.title,
                                guid: item.guid,
                                author: item.creator,
                                link: item.link,
                                date: new Date(item["isoDate"]),
                                content: item["content:encoded"],
                                categories: item.categories
                            })
                        }
                        console.log("Indexed: ", item.guid, page)
                    }
                    page++;
                } catch (e) {
                    console.log(e)
                    break;
                }
            }

        } else if (feed.type == FeedType.WORDPRESS_API) {
            await fetchWordPressApiData(feed.feed, PostRepo)
        }
    }
})