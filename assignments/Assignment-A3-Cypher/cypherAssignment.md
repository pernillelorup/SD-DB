# Assignment A3 - Cypher
 
### Before beginning - check for data:

```cql
match (n) return n
```

### 1. Create a Movie node for the movie with a title Forrest Gump.

```cql
CREATE(m:Movie { title:"Forrest Gump" })
RETURN m;
```

### 2. Add the following properties to the movie Forrest Gump:

####  3. released: 1995

```cql
MATCH(m:Movie { title:"Forrest Gump" })
SET m.released = 1995
RETURN m;
```

#### 4. tagline: Life is like a box of chocolates…​you never know what you’re gonna get.

```cql
MATCH(m:Movie { title:"Forrest Gump" })
SET m.tagline = "Life is like a box of chocolates…​you never know what you’re gonna get."
RETURN m;
```

### 5.  Update the released property of movie Forrest Gump, as it has actually been released in 1994.
```cql
MATCH(m:Movie { title:"Forrest Gump" })
SET m.released = 1994
RETURN m
```

### 6.  Find the movie with the tagline Free your mind.
```cql
MATCH (m:Movie)
WHERE m.tagline = 'Free your mind'
RETURN m
```

### 7.  Retrieve the movie The Matrix and all its relationships.
```cql
MATCH (p:Person)-[rel]-(m:Movie)
WHERE m.title = 'The Matrix'
RETURN p, rel, m
```

### 8.  Find the names and relationship type of all people who have any type of relationship to the movie The Matrix.
```cql
MATCH (p:Person)-[rel]-(m:Movie)
WHERE m.title = 'The Matrix'
RETURN p.name, type(rel)
```

### 9.  Find all people born in the previous century.
```cql
MATCH (a:Person)
WHERE a.born >= 1900
AND a.born <= 1999
RETURN a.name as Name, a.born as `Year Born`
```

### 10.  Find all people who gave the movie The Da Vinci Code a rating of 65, returning their names.
```cql
MATCH (p:Person)-[r:REVIEWED]->(m:Movie)
WHERE m.title = 'The Da Vinci Code' AND r.rating = 65
RETURN m.title as Movie, p.name as Name, r.rating as Rating
```

### 11.  Find all people who follow Angela Scope and those who Angela Scope follows.
```cql
MATCH (p1:Person)-[:FOLLOWS]-(p2:Person)
WHERE p1.name = 'Angela Scope'
RETURN p1, p2
```

### 12. Find all people who follow anybody who follows Jessica Thompson returning them as nodes.
```cql
MATCH (p1:Person)-[:FOLLOWS*2]-(p2:Person)
WHERE p1.name = 'Angela Scope'
RETURN p1, p2
```

### 13. Tom Hanks hasn’t HELPED Gary Sinise in a research. Remove this property from the relation.
```cql
// this property doesn't exist

// add it first by doing this:
    		
MATCH (p1:Person)
WHERE p1.name = 'Tom Hanks'
MATCH (p2:Person)
WHERE p2.name = 'Gary Sinise'
CREATE (p1)-[:HELPED]->(p2)

// then remove: 
    		
MATCH (p1:Person)-[rel:HELPED]->(p2:Person)
WHERE p1.name = 'Tom Hanks'
AND p2.name = 'Gary Sinise'
REMOVE rel.research

// check if it has been removed

MATCH (p:Person)
WHERE p.name = 'Tom Hanks'
RETURN p

```

### 14. Delete the whole person-to-person relationship HELPED from the graph.
```cql
MATCH (:Person)-[rel:HELPED]-(:Person)
DELETE rel

// confirm deletion of above:

MATCH (:Person)-[rel:HELPED]-(:Person)
RETURN rel

```
