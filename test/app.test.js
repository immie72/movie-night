import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server.js';
test('pairing, private votes, match, persistence and disconnect',async()=>{
 const dataDir=await mkdtemp(join(tmpdir(),'movie-night-'));let server=await createApp({dataDir});await new Promise(r=>server.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+server.address().port;
 const call=async(path,body,token)=>{const r=await fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 try{
 const a=(await call('register',{name:'Alice'})).data,b=(await call('register',{name:'Bob'})).data,c=(await call('register',{name:'Charlie'})).data;
 assert.notEqual(a.code,b.code);assert.equal((await call('swipe',{id:27205,choice:'yes'},a.token)).status,403);
 assert.equal((await call('connect',{code:a.code},a.token)).status,400);
 await call('preferences',{services:['8'],region:'AU'},a.token);await call('preferences',{services:['337'],region:'AU'},b.token);
 let paired=await call('connect',{code:b.code},a.token);assert.equal(paired.data.ready,true);assert.equal(paired.data.members[0].name,'Bob');assert.equal(paired.data.members[0].token,undefined);
 await call('preferences',{services:['8'],region:'AU'},c.token);
 const group=await call('connect',{code:paired.data.groupCode},c.token);assert.equal(group.status,200);assert.equal(group.data.members.length,3);
 assert.equal((await call('preferences',{services:['made-up'],region:'AU'},a.token)).status,400);
 const movie=paired.data.movies[0];assert.ok(movie);assert.equal((await call('swipe',{id:999999,choice:'yes'},a.token)).status,400);
 await call('swipe',{id:movie.id,choice:'yes'},a.token);
 const bob=await call('state',undefined,b.token);assert.deepEqual(bob.data.votes,{});assert.equal(bob.data.match,null);assert.equal(bob.data.movies[0].id,movie.id);
 assert.equal((await call('swipe',{id:movie.id,choice:'yes'},a.token)).status,400);
 assert.equal((await call('swipe',{id:movie.id,choice:'yes'},b.token)).data.match,null);
 const match=await call('swipe',{id:movie.id,choice:'yes'},c.token);assert.equal(match.data.match.id,movie.id);assert.equal((await call('state',undefined,a.token)).data.match.id,movie.id);
 await new Promise(r=>server.close(r));server=await createApp({dataDir});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 assert.equal((await call('state',undefined,a.token)).data.match.id,movie.id);
 await call('restart',{},a.token);assert.equal((await call('state',undefined,b.token)).data.match,null);assert.deepEqual((await call('state',undefined,b.token)).data.votes,{});
 await call('disconnect',{},a.token);assert.equal((await call('state',undefined,a.token)).data.groupCode,null);
 await call('disconnect',{},c.token);assert.equal((await call('state',undefined,b.token)).data.members.length,1);
 assert.equal((await call('swipe',{id:movie.id,choice:'yes'},b.token)).status,403);
 assert.equal((await call('state',undefined,'bad-token')).status,401);
 }finally{await new Promise(r=>server.close(r));await rm(dataDir,{recursive:true,force:true});}
});
