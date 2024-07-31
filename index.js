const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const puppeteer = require("puppeteer")
const fs = require("fs/promises")
const mysql = require("mysql")

const wss = new WebSocket.Server({ server:server });
const domain = "http://localhost/websocket";
var alloworigin = "*";
let db = null;


wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});

async function start(mid,url){
  console.log('start browser',url)
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url, {timeout: 0})
  const reloadBot = await page.$eval("#reload", el => el.textContent)
  const statusBot = await page.$eval("#status_koneksi_mikrotik", el => el.textContent)
  
  if(reloadBot=='stop'){
	  console.log("Bot berhasil di matikan...")
	  browser.close()
  }
  if(statusBot=='gagal'){
	  console.log("Gagal konek ke mikrotik...")
	  browser.close()
  }
  if(reloadBot=='reload'){
db.query("SELECT * FROM app_login_server where id_mikrotik='"+mid+"'", function (err, result, fields) {
if (err) throw process.exit(1);
result.forEach(function(row) {
if(row.status>0){
	console.log("Proses reload...")
	  start(mid,url)
}else{
	console.log("Proses reload off!!")
	  browser.close()
}
});
});
}
}

app.get('/start_bot/:mid/:host/:uid/:pwd/:port', async (req, res, next) => {
res.setHeader('Access-Control-Allow-Origin', ''+alloworigin+'');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
res.setHeader('Access-Control-Allow-Credentials', true);
	
var url=domain+"/bot.php?mid="+req.params.mid+"";
db.query("SELECT * FROM app_login_server where id_mikrotik='"+req.params.mid+"'", function (err, result, fields) {
if (err) throw process.exit(1);
if(result[0]!=undefined){
result.forEach(function(row){
db.query("UPDATE app_login_server set status='0' where email_owner='"+row.email_owner+"' and id_mikrotik!='"+row.id_mikrotik+"'");
db.query("UPDATE app_login_server set status='1' where id_mikrotik='"+row.id_mikrotik+"'");
start(row.id_mikrotik,url);
res.send('Start....<br>Data Mikrotik: <hr>Host: '+req.params.host+'<br>Uid: '+req.params.uid+'<br>Pwd: '+req.params.pwd+'<br>Port: '+req.params.port+'<br>Mid: '+req.params.mid)
});
}
});
});

app.get('/stop_bot/:mid', async (req, res, next) => {
res.setHeader('Access-Control-Allow-Origin', ''+alloworigin+'');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
res.setHeader('Access-Control-Allow-Credentials', true);

db.query("SELECT * FROM app_login_server where id_mikrotik='"+req.params.mid+"'", function (err, result, fields) {
if (err) throw process.exit(1);
if(result[0]!=undefined){
result.forEach(function(row) {
db.query("UPDATE app_login_server set status='0' where id_mikrotik='"+row.id_mikrotik+"'");
res.send('Proses stop bot.....')
});
}
});
});

app.get('/', (req, res) => res.send('Website Monitoring Mikrotik'))


const cekBotMember = async () => {
try{
db.connect(function(err) {
  if (err) {
    return console.error('error connect db: ' + err.message);
  }
  console.log('Connected to the MySQL server.');
});

}catch(e) {
console.log('Waiting...');
return;
}}






async function main(){	
  db = await mysql.createConnection({
    host:"localhost",
    user: "root",
    password: "",
    database: "mikrotik",
  });

  await cekBotMember();
  
}

main();
process.env.UV_THREADPOOL_SIZE = 512;

server.listen(3000, () => console.log(`Lisening on port :3000`))
