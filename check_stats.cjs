const {MongoClient}=require('mongodb');
(async()=>{
  const c=new MongoClient('mongodb://localhost:27017/openfront');
  await c.connect();
  const db=c.db();
  
  // Check matches
  const matches=await db.collection('matches').find({}).sort({endedAt:-1}).limit(3).toArray();
  matches.forEach(m=>{
    console.log('Match:',m.gameId);
    (m.players||[]).forEach(p=>{
      console.log('  pid type:',typeof p.persistentId,'value:',p.persistentId);
    });
  });

  // Check gamerecords
  const records=await db.collection('gamerecords').find({}).sort({createdAt:-1}).limit(1).toArray();
  records.forEach(r=>{
    console.log('Record:',r.gameId,'players:',r.info?.players?.length);
    if(r.info?.players?.length>0){
      const p=r.info.players[0];
      console.log('  persistentID type:',typeof p.persistentID,'value:',p.persistentID);
      console.log('  stats:',JSON.stringify(p.stats)?.substring(0,100));
    }
  });

  await c.close();
})()
