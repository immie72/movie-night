import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {providers,demo} from './catalogue.js';
const root=dirname(fileURLToPath(import.meta.url));
export async function createApp({dataDir=process.env.DATA_DIR||join(root,'data')}={}){
 await mkdir(dataDir,{recursive:true});
 const path=join(dataDir,'state.json'); let state={people:{},rooms:{}};
 try{state=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 let queue=Promise.resolve();
 const save=async()=>{await writeFile(path+'.tmp',JSON.stringify(state));await rename(path+'.tmp',path);};
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const code=()=>{let c;do{c=randomBytes(5).toString('hex').toUpperCase();}while(Object.values(state.people).some(p=>p.code===c)||Object.values(state.rooms).some(r=>r.code===c));return c;};
 const live=!!process.env.TMDB_TOKEN;
 async function tmdb(endpoint){const res=await fetch('https://api.themoviedb.org/3'+endpoint,{headers:{Authorization:'Bearer '+process.env.TMDB_TOKEN},signal:AbortSignal.timeout(12000)});if(!res.ok)fail('Movie data is unavailable. Please try again shortly.',502);return res.json();}
 function roomOf(p){return state.rooms[p.room];}
 function view(p){const room=roomOf(p),members=room?room.people.map(t=>state.people[t]):[];return {name:p.name,code:p.code,services:p.services,region:p.region,members:members.map(m=>({name:m.name,code:m.code,services:m.services})),groupCode:room?.code||null,ready:members.length>=2&&members.every(m=>m.services.length>0),match:room?.match||null,source:live?'live':'demo',movies:room?.movies||[],votes:room?.votes[p.token]||{},providers};}
 function reset(room){room.match=null;room.votes=Object.fromEntries(room.people.map(t=>[t,{}]));}
 async function deck(room){const people=room.people.map(t=>state.people[t]);const services=[...new Set(people.flatMap(p=>p.services))];if(!services.length)return [];
 if(!live)return demo.filter(m=>m.services.some(s=>services.includes(s)));
 const data=await tmdb('/discover/movie?include_adult=false&sort_by=popularity.desc&watch_region='+people[0].region+'&with_watch_monetization_types=flatrate&with_watch_providers='+services.join('|')+'&page='+room.page);
 return data.results.map(m=>({id:m.id,title:m.title,year:m.release_date?.slice(0,4),genre:'Movie',overview:m.overview,poster:m.poster_path?'https://image.tmdb.org/t/p/w500'+m.poster_path:null,services:[]}));}
 const limits=new Map();
 const server=http.createServer(async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
 res.setHeader('Cache-Control','no-store');
 const ip=req.socket.remoteAddress,now=Date.now();let limit=limits.get(ip);if(!limit||now-limit.start>60000){limit={start:now,n:0};limits.set(ip,limit);}if(++limit.n>300)fail('Too many requests. Please wait a minute.',429);
 if(limits.size>10000)for(const [k,v]of limits)if(now-v.start>60000)limits.delete(k);
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)fail('Request origin not allowed.',403);
 let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)fail('Request too large.',413);}try{body=JSON.parse(raw||'{}');}catch{fail('Invalid request.');}}
 const result=await (queue=queue.catch(()=>{}).then(async()=>{
 if(url.pathname==='/api/register'&&req.method==='POST'){const name=String(body.name||'').trim().slice(0,40);if(!name)fail('Add your name first.');const token=randomBytes(32).toString('hex');state.people[token]={token,name,code:code(),services:[],region:'AU'};await save();return {token,...view(state.people[token])};}
 const p=state.people[req.headers.authorization?.replace(/^Bearer /,'')];if(!p)fail('Please introduce yourself first.',401);
 if(url.pathname==='/api/state'&&req.method==='GET')return view(p);
 if(url.pathname==='/api/group'&&req.method==='POST'){if(p.room)fail('You already have a group.');const id=randomBytes(16).toString('hex');state.rooms[id]={code:code(),people:[p.token],votes:{[p.token]:{}},movies:[],match:null,page:1};p.room=id;await save();return view(p);}
 if(url.pathname==='/api/connect'&&req.method==='POST'){
 if(p.room)fail('Leave your current group before joining another.');
 const input=String(body.code||'').trim().toUpperCase();
 const partner=Object.values(state.people).find(x=>x.code===input);
 if(partner===p)fail('Enter someone else’s code.');
 let id=Object.keys(state.rooms).find(id=>state.rooms[id].code===input)||(partner?.room);
 if(!id&&!partner)fail('Enter a valid personal or group code.');
 const existing=id?state.rooms[id]:null;
 if(existing&&existing.people.length>=12)fail('This group already has 12 people.');
 const people=existing?[...existing.people,p.token]:[partner.token,p.token];
 if(people.some(t=>state.people[t].region!==p.region))fail('Choose the same country before connecting.');
 const candidate={...(existing||{}),code:existing?.code||code(),people,page:1,match:null,votes:Object.fromEntries(people.map(t=>[t,{}])),movies:[]};
 candidate.movies=await deck(candidate);id||=randomBytes(16).toString('hex');state.rooms[id]=candidate;for(const t of people)state.people[t].room=id;await save();return view(p);}
 if(url.pathname==='/api/preferences'&&req.method==='POST'){if(!Array.isArray(body.services)||body.services.some(s=>!providers.some(x=>x.id===s)))fail('Choose supported subscriptions.');if(!['AU','US','GB','NZ','CA'].includes(body.region))fail('Choose a supported country.');const room=roomOf(p);if(room&&body.region!==p.region)fail('Disconnect before changing country.');const old=p.services,oldRegion=p.region;p.services=[...new Set(body.services)];p.region=body.region;try{if(room){room.movies=await deck({...room,page:1});room.page=1;room.votes=Object.fromEntries(room.people.map(t=>[t,{}]));room.match=null;}}catch(e){p.services=old;p.region=oldRegion;throw e;}await save();return view(p);}
 if(url.pathname==='/api/swipe'&&req.method==='POST'){const room=roomOf(p);if(!view(p).ready)fail('Connect and choose both subscriptions before swiping.',403);if(room.match)return view(p);const movie=room.movies.find(m=>m.id===body.id);if(!movie||!['yes','no'].includes(body.choice))fail('Choose a movie from your deck.');if(room.votes[p.token][movie.id])fail('You have already swiped this movie.');room.votes[p.token][movie.id]=body.choice;if(room.people.every(t=>room.votes[t][movie.id]==='yes'))room.match=movie;await save();return view(p);}
 if(url.pathname==='/api/more'&&req.method==='POST'){const room=roomOf(p);if(!view(p).ready)fail('Connect first.',403);if(room.match)return view(p);if(!live)fail('You have finished the sample catalogue. Start a new round or connect live movie data.');const next=await deck({...room,page:room.page+1});const seen=new Set(room.movies.map(m=>m.id));room.movies.push(...next.filter(m=>!seen.has(m.id)));room.page++;await save();return view(p);}
 if(url.pathname==='/api/restart'&&req.method==='POST'){const room=roomOf(p);if(!room)fail('Connect first.');room.match=null;room.votes=Object.fromEntries(room.people.map(t=>[t,{}]));await save();return view(p);}
 if(url.pathname==='/api/disconnect'&&req.method==='POST'){const id=p.room,room=roomOf(p);if(room){room.people=room.people.filter(t=>t!==p.token);delete p.room;if(!room.people.length)delete state.rooms[id];else{reset(room);room.page=1;room.movies=await deck(room);}}await save();return view(p);}
 if(url.pathname.startsWith('/api/trailer/')&&req.method==='GET'){const id=Number(url.pathname.split('/').pop());const movie=roomOf(p)?.movies.find(m=>m.id===id);if(!movie)fail('Movie not found.',404);if(live){const data=await tmdb('/movie/'+id+'/videos');const trailer=data.results.find(v=>v.site==='YouTube'&&v.type==='Trailer'&&v.official)||data.results.find(v=>v.site==='YouTube'&&v.type==='Trailer');if(trailer&&/^[\w-]+$/.test(trailer.key))return {url:'https://www.youtube.com/watch?v='+trailer.key};}return {url:'https://www.youtube.com/results?search_query='+encodeURIComponent(movie.title+' '+movie.year+' official trailer')};}
 fail('Not found.',404);
 }));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));return;
 }
 if(!['GET','HEAD'].includes(req.method))fail('Method not allowed.',405);
 const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};const file=files[url.pathname];if(!file)fail('Not found.',404);const data=await readFile(join(root,'public',file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e.status||500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.status?e.message:'Something went wrong. Please try again.'}));}});
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=await createApp();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Movie Night is running on port '+(process.env.PORT||3000)));}
