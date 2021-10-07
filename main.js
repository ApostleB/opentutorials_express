const {time} = require("console");
const {request} = require("express");
let express = require("express");
let app = express();
let fs = require("fs");
let path = require("path");
let qs = require("querystring");
let sanitizeHtml = require("sanitize-html");
let template = require("./lib/template.js");
let bodyParser = require('body-parser');
let compression = require("compression");
let helmet = require('helmet');
app.use(helmet());


app.use(express.static("public")); // public
app.use(bodyParser.urlencoded({extended: false})); //bodyparser
app.use(compression()); //압축관련

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
      `<h2>${title}</h2>${description}
        <img src="/images/v.jpg" style="width:300px; height:500px; display:block; margin-top:10px;
        "></img>`,
      `<a href="/topic/create">create</a>`
    );
    response.send(html);
});

app.get("/topic/create", function (request, response) {
  var title = "WEB - create";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `
    <form action="/topic/create_process" method="post">
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

app.post("/topic/create_process", function (request, response) {
  let post = request.body;
  let title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    response.redirect(`/topic/${title}`)
  });
});

app.get("/topic/update/:pageId", (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
        <form action="/topic/update_process" method="post">
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
      `<a href="/topic/create">create</a> <a href="/topic/update?id=${title}">update</a>`
    );

    response.send(html);
  });
});

app.post("/topic/update_process", (request, response) => {
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect("/");
    });
  });
});

app.post("/topic/delete_process", (request, response) => {
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    response.redirect("/");
  });
});
app.get("/topic/:pageId", function (request, response, next) {
    console.log(request.list);
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
        if(err){
            next(err);
        }else{
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
              ` <a href="/topic/create">create</a>
          <a href="/topic/update/${sanitizedTitle}">update</a>
          <form action="/topic/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
            );
            response.send(html);
        }
        
        
    });
});




//에러처리
app.use((request, response)=>{
    response.status(404).send('페이지 낫 빠운드!');
})
app.use((err, request, response, next)=>{
    console.error(err.stack);
    response.status(500).send('썸씽 브로크, 에러임!');
})

app.listen(3000, function () {
    console.log("Server가 3000번 Port로 실행중입니다.");
});
