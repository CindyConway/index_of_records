// find mongo processes $ ps aux | grep mongod
// make sure single instance of mongo is not running on 27017 or is screws things up
// command to automaticall conenct to PRIMARY mongo -host m101/localhost:27017

//Remove old log files before staring
rm -Rf 1.log*
rm -Rf 2.log*
rm -Rf 3.log*

//start Replicasets
mongod --replSet m101 --logpath "/data/1.log" --dbpath /data/rs1 --port 27017 --smallfiles --oplogSize 64 --fork
mongod --replSet m101 --logpath "/data/2.log" --dbpath /data/rs2 --port 27018 --smallfiles --oplogSize 64  --fork
mongod --replSet m101 --logpath "/data/3.log" --dbpath /data/rs3 --port 27019 --smallfiles --oplogSize 64  --fork


/*********************************
      IMPORTANT


for first connection, PRIMARY must be on port 27017
Use this to set which replica is the primary. EXECUTE ONE CMD AT A TIME
cfg = rs.conf()
cfg.members[0].priority = 1
cfg.members[1].priority = 0.5
cfg.members[2].priority = 0.5
rs.reconfig(cfg)
*******************************/
