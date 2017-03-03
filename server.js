var http = require("http");
var url = require('url');
var mongodb = require('mongodb');
var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var port = process.env.PORT || 8080;
var count = 0;
var url = 'mongodb://localhost:27017/img'; 

var MongoClient = mongodb.MongoClient;



MongoClient.connect("mongodb://localhost:27017/img", function(err, db) {
  if(!err) {
    console.log("We are connected");
    var collection = db.collection('img');
    collection.count({},function(err, num){
    	if(err){}
    	else
    	{
    		count=num;
    		console.log("num: "+num);
    	}
    })
  }
  if(err){}
});
//Bing search Key 
var apiID = "";

http.createServer(function(request, response) {
    console.log("lauched");
    var urlObj = request.url;
    console.log("urlObj subst:"+urlObj.substring(0,17));
    var offset=0;

    if(urlObj.substring(0,17)==="/api/imagesearch/")
    {
      var params = parseURLParams(urlObj);
      console.log("Params: "+JSON.stringify(params));
      MongoClient.connect("mongodb://localhost:27017/img", function(err,db){
				if(!err)
				  {
					console.log("Connected & ready to write");
					var collection = db.collection('img');
					collection.insert({date: new Date(), search:params.q}, function(err,data){
						if(!err)
						{
							collection.count({},function(err, num)
							{
    	          if(err){}
    	          else
    	          {
    	            //TODO cette merde bug, il efface tout au lieu d'effacer seulement le premier (essayé avec true et 1 en tant que second paramètre)
    	            // Possiblement une mauvaise version de mongodb (qui ne support pas cette option, déjà arrivé avant...)
    	            if(num>10)
    	            {
    	              collection.remove({},{justOne: true});
    	            }
    		        }
              })
						}
					})
				}
			})
    console.log("test");
    var request = urlObj.substring(17,urlObj.length);
    var url ="https://api.cognitive.microsoft.com/bing/v5.0/images/search/"+request;
    console.log("test2");
    var http = new XMLHttpRequest();
    http.open("POST",url,true);
    console.log("test3");
    http.setRequestHeader("Content-Type","multipart/form-data");
    http.setRequestHeader("Ocp-Apim-Subscription-Key",apiID);
    console.log("test4");
    console.log("request: "+request);
    http.onload = function()
      {
        var repp= (JSON.parse(this.responseText));
        var obj = objectify(repp);
        response.write(JSON.stringify(obj));
        response.end();
      };

    http.send(request);
   }
   
   else if (urlObj.substring(0,7)==="/latest"){
     MongoClient.connect("mongodb://localhost:27017/img", function(err, db) {
  if(!err) {
    console.log("We are connected");
    var collection = db.collection('img');
    collection.find()
        .toArray(function(err, docs){
            if(err){
                console.log(err);
                response.sendStatus(400);
            }
            console.log(JSON.stringify(docs));
            response.write(JSON.stringify(docs));
            response.end()
        });
    }
});
     
   }
   
   
   	else
	{
    fs.readFile("index.html", function(err, data){
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(data);
    response.end();
    }
    );
	}
	
}).listen(port)







function objectify(data){
  var res=[];
  for(var i=0; i<data['value'].length;i++){
    var temp={};
    temp.url=(data['value'][i]['hostPageDisplayUrl']);
    temp.name=(data['value'][i]['name']);
    temp.thumbnail=(data['value'][i]['thumbnailUrl']);
    res.push(temp);
  }
  return res
}




//From http://stackoverflow.com/questions/814613/how-to-read-get-data-from-a-url-using-javascript

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);
        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}