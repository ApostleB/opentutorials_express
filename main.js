const {time} = require("console");
const {request} = require("express");
var express = require("express");
var app = express();
var fs = require("fs");
var path = require("path");
var qs = require("querystring");
var sanitizeHtml = require("sanitize-html");
var template = require("./lib/template.js");
var bodyParser = require('body-parser');
var compression = require("compression");


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(compression());

app.use((request, response, next) => {
    console.log("이것은 미들웨어 이며 모든 경로에 거쳐갑니다.");
    next();
});

//get으로 들어오는 모든 요청에 대해서
app.get('*', (request, response, next) => {
    fs.readdir('./data', (err, filelist) => {
        request.list = filelist;
        next();
    });
});
//route, routing
//app.get('/', (req, res) => res.send('Hello World!'))
app.get("/", function (request, response) {
    var title = "Welcome";
    var description = "Hello, Node.js";
    var list = template.list(request.list);
    var html = template.HTML(
        title,
        list,
        `<h2>${title}</h2>${description}`,
        `<a href="/create">create</a>`
    );
    response.send(html);
});

app.get("/page/:pageId", function (request, response) {
    console.log(request.list);
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
        var title = request.params.pageId;
        var sanitizedTitle = sanitizeHtml(title);
        var sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ["h1"],
        });
        var list = template.list(request.list);
        var html = template.HTML(
            sanitizedTitle,
            list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/create">create</a>
          <a href="/update/${sanitizedTitle}">update</a>
          <form action="/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
        );
        response.send(html);
    });
});

app.get("/create", function (request, response) {
    var title = "WEB - create";
    var list = template.list(request.list);
    var html = template.HTML(
        title,
        list,
        `
    <form action="/create_process" method="post">
    <p><input type="text" name="title" placeholder="title"></p>
    <p>
        <textarea name="description" placeholder="description"></textarea>
    </p>
    <p>
        <input type="submit">
    </p>
    </form>
`,
        ""
    );
    response.send(html);
});

app.post("/create_process", function (request, response) {
    let post = request.body
    let title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
        response.writeHead(302, {
            Location: `/?id=${title}`
        });
        response.end();
    });
});

app.get("/update/:pageId", (request, response) => {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
        var title = request.params.pageId;
        var list = template.list(request.list);
        var html = template.HTML(
            title,
            list,
            `
        <form action="/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
            <p>
            <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
            <input type="submit">
            </p>
        </form>
        `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
        );

        response.send(html);
    });
})

app.post('/update_process', (request, response) => {
    var post = request.body;
    var id = post.id;
    var title = post.title;
    var description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
            response.redirect("/");
        });
    });
})

app.post('/delete_process', (request, response) => {
    var post = request.body;
    var id = post.id;
    var filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function (error) {
        response.redirect('/');
    });
})

app.listen(3000, function () {
    console.log("Server가 3000번 Port로 실행중입니다.");
});
