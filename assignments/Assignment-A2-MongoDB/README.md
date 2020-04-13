# Assignment A2 - MongoDB

___

Group members:

* Adam Lass
* Rasmus Helsgaun
* Pernille Lørup

___


###Exercise: Sharding in MongoDB
**What is sharding in mongoDB?**  
Sharding is a method for distributing data across multiple machines. MongoDB uses sharding to support deployments with very large data sets and high throughput operations.

**What are the different components required to implement sharding?**  
To implement sharding you will need the following components:  

* Config server - This is basically a regular mongod server that keeps track of the values of the other servers. 
* 

**Explain architecture of sharding in mongoDB?**



___


###Exercise: MapReduce with mongoDB (warmup)
As a first exercise you are required to load reddit data from the link mentioned in 2). With help of map and reduce you need to find top 10 “lang” (language) of the documents in reddit.  
**a) Provide implementation of map and reduce function**  
**b) Provide execution command for running MapReduce**  
**c) Provide top 10 recorded out of the sorted result. (hint: use sort on the result returned by MapReduce)**  

___

###Exercise: MapReduce with mongoDB (hashtag query) (5 points)
For this task you need to download twitter dataset from the link mentioned in 2). This time you have to answer query “what are the top 10 hashtags used in the given tweets”. To answer this you need to use MapReduce. You can look at the scheme of the collection using db.collection.findOne(). It will print one record with scheme information. Also you can use function like this.hasOwnProperty(‘field_name’) to check if a field exist in the record. (if the field does not exist you will get error.  
**a) Provide implementation of map and reduce function**  
**b) Provide execution command for running MapReduce**  
**c) Provide top 10 recorded out of the sorted result. (hint: use sort on the result returned by MapReduce)** 
