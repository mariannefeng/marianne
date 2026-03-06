---
title: "public goodreads api"
description: "Piratereads - a public goodreads api"
pubDate: "Mar 5 2026"
githubUrl: "https://github.com/mariannefeng/piratereads"
swaggerUrl: "https://api.piratereads.com/swagger"
---

#### what is it

a public API for retrieving any goodreads user's reviews/ratings.

#### demo project

check out [my reading page](/reading) - all the data on that page is loaded using piratereads.

#### how to use it

1. Get your goodreads user ID. I found mine in the URL for my user profile:

<img src="https://assets.mariannefeng.com/portfolio/piratereads/goodreads-username.jpg" alt="A screenshot of a goodreads user profile with a circle around the user id in the url" class="full" />

For example, since my profile URL is `https://www.goodreads.com/user/show/140474195-marianne`, the user ID the API needs is `140474195`

2. Make a GET request to https://api.piratereads.com/{user_id}/reviews. Example curl:

```
curl -X 'GET' \
  'https://api.piratereads.com/140474195/reviews'
```

Try it out yourself at <a href="https://api.piratereads.com/swagger" alt="swagger link" target="_blank">piratereads's swagger</a>
