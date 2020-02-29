var express = require("express");
const cloudinary = require('cloudinary').v2;
var app = express();

app.use(express.static( __dirname + "/static"));

app.use(function(req, res, next) {
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://localhost");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});


app.get('/', (req, res)=>{
    res.sendFile('browser.html', {root: __dirname});
});

app.get('/editor.html', (req, res)=>{
    res.sendFile('editor.html', {root: __dirname});
});

cloudinary.config({ 
  cloud_name: 'dkxp5gse8', 
  api_key: '558986696348513', 
  api_secret: 'yQ3mbMfx8nK9SOz48vxlABwu1og' 
});


app.listen(8000, function(){
  console.log("Running on port 8000... \n")
});
