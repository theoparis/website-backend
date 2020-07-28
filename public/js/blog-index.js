// Test for connecting to server
fetch("/api/blog/posts").then(res => {
    /* \
    Required to get the text content of the request body
    We can also use res.json() to get json formatted objects
    */
    return res.json();
}).then((posts) => {
    if (posts && posts !== []) {
        if (posts.length == 0) {
            // Occurs if there aren't any posts (empty array).
            $("#posts-container").html("<h2>Nothing to see here.</h2><p>Check back later for more posts!</p>");
        }

        posts.forEach((post) => {
            $("#posts-container").append($(`<h2 class="post-title">${post.title}</h2> <div class="post-content">${post.content}</div>`));
        });
    }
});