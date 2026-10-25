export const providers = [{id:'8',name:'Netflix'},{id:'337',name:'Disney+'},{id:'119',name:'Prime Video'},{id:'350',name:'Apple TV+'},{id:'385',name:'BINGE'},{id:'21',name:'Stan'},{id:'531',name:'Paramount+'}];
// Illustrative demo assignments, not current streaming availability.
export const demo = [
[120,'The Lord of the Rings: The Fellowship of the Ring','2001','Adventure','A quiet hobbit inherits a ring and an extraordinary responsibility.','/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',['119','21']],
[27205,'Inception','2010','Sci-fi','A dream thief takes on one last job inside a world where nothing is quite real.','/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',['8','119']],
[10681,'WALL·E','2008','Animation','A lonely little robot finds a reason to reach for the stars.','/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',['337']],
[346698,'Barbie','2023','Comedy','One very pink adventure outside the perfectly familiar.','/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',['385','119']],
[508947,'Turning Red','2022','Animation','Growing up gets a little wild when big feelings become a giant red panda.','/qsdjk9oAKSQMWs0Vt5Pyfh6O4GZ.jpg',['337']],
[545611,'Everything Everywhere All at Once','2022','Adventure','An ordinary woman gets swept into a wonderfully chaotic multiverse.','/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',['8','21']],
[157336,'Interstellar','2014','Sci-fi','A journey beyond our galaxy in search of a future for humanity.','/gEU2QniE6E77NI6lCU6MxlNBvIx2.jpg',['119','531']],
[105,'Back to the Future','1985','Adventure','A teenager, a time machine, and a very complicated trip to 1955.','/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg',['8','119','21']],
[354912,'Coco','2017','Animation','A young musician follows his heart into a colourful world of family and memory.','/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',['337']],
[313369,'La La Land','2016','Romance','Two dreamers fall in love beneath the lights of Los Angeles.','/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',['8','21']],
[11036,'The Notebook','2004','Romance','A summer romance becomes a love story that spans a lifetime.','/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg',['8','119']],
[207703,'Kingsman: The Secret Service','2014','Action','An unlikely recruit discovers a very well-dressed world of secret agents.','/ay7xwXn1G9fzX9TUBlkGA584rGi.jpg',['337']]
].map(([id,title,year,genre,overview,poster,services])=>({id,title,year,genre,overview,poster:'https://image.tmdb.org/t/p/w500'+poster,services}));
