// -----------------------------------------------------------------------------
//  Queries

// Mostriamo gli indici del database
CALL db.indexes

// Facciamo una semplice query: cerchiamo il film "toy story" e vediamo a quali generi è associato
MATCH (m:Movie {name: 'Toy Story (1995)'})-[:GENRE]->(g:Genre) RETURN m,g

// Altra semplice query: dato l'utente con userId "1" cerchiamo tutti i generi dei film che ha visto
// Aspetto interessante: la query attraversa in realtà due relazioni (da qui la sintassi con l'asterisco)
MATCH (:User { userId: "1" })-[*..2]-(g:Genre) RETURN DISTINCT(g)

// Ora ripetiamo la stessa query, ma invece che ritornare i nodi "genere", ritorniamo un array con i nomi dei singoli generi
// Qui è interessante l'utilizzo di "WITH" e dell'aggregatore "collect"
MATCH (:User { userId: "1" })-[*..2]-(g:Genre) 
 WITH DISTINCT (g) 
 WITH collect(g.name) AS genres 
 RETURN genres

// A questo punto cerchiamo almeno tre film che siano associati ad almeno 5 generi
// - Questa query si sviluppa su più livelli; La prima volta vengono selezionati tutti i film che hanno almeno 5 generi associati
// - A questo punto limitiamo la lista di film ai primi tre;
// - Nella parte finale della query andiamo a ricostruire il percorso che va dal film al genere
// Perché non possiamo risolvere tutto con la sola prima parte della query? 
//  > Perché se impostiamo un placeholder per i nodi Genre di fatto andiamo a selezionare delle coppie m - g, dunque il contatore delle relazioni è sempre 1
//    La query complessa invece si limita a selezionare i film, e dunque va a selezionare tutti i percorsi da un certo film "m" a qualsiasi genere, non 
//    ad uno specifico genere "g"
MATCH (m:Movie)-[:GENRE]->(:Genre)
WITH m, COUNT(*) as cnt
	WHERE cnt >= 5
	WITH m, cnt 
	LIMIT 3
		MATCH p=(m:Movie)-[:GENRE]->(:Genre)
		RETURN p, cnt
		ORDER BY cnt DESC

// Trova due utenti che hanno votato nello stesso modo un film come ha fatto l'utente con id "1"
MATCH (u1:User {userId: "1"})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating
RETURN u1, r1, r2, u2, m
LIMIT 2

// Trova tutti i film che sono stati votati nello stesso modo dall'utente "1" e dall'utente "541"
MATCH (u1:User {userId: "1"})
MATCH (u2:User {userId: "541"})
MATCH (u1)-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2)
WHERE r1.rating = r2.rating
return u1, m, u2, r1, r2

// Trova tutti i film che sono stati votati nello stesso modo dall'utente 1 e dall'utente 245
// Nota: formato alternativo della query precedente
MATCH (u1:User {userId: "1"})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User {userId: "245"})
WHERE r1.rating = r2.rating
return u1, m, u2, r1, r2

// Trova fino a 10 utenti che hanno votato almeno 3 film allo stesso modo dell'utente 1
MATCH (u1:User { userId: "1" })-[r1:RATED]->(:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating // Assicurati che i due utenti abbiano dato lo stesso voto
  AND u2 <> u1 // assicurati che non stiamo ritornando dallo stesso utente
  WITH u1, u2, COUNT(*) as cp // conta i match
  WHERE cp > 3 // prendi solamente le coppie u1, u2, che hanno almeno 3 match
  RETURN u2, cp //Ritorna gli utenti con i relativi conteggi di match
  ORDER BY cp DESC // ordina per numero di match
  LIMIT 10 // prendi al massimo i primi 10

// Trova tutti i path tra l'utente 1 ed un qualsiasi utente che abbia votato almeno
// 3 film come ha fatto l'utente 1
// A differenza di prima in pratica andiamo a ritornare tutti i film che collegano i due utenti
MATCH (u1:User { userId: "1" })-[r1:RATED]->(:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating // assures u1 and u2 has given the same rating to the movie
  AND u2 <> u1 //assures that we are not returning to u1 (no cycles)
  WITH u1, u2, COUNT(*) as cp //count the matches
    WHERE cp > 3 //take only users with at least 3 matched paths
    WITH u1, u2, cp 
      LIMIT 10 //take at most 10 matches
      MATCH p=(u1)-[:RATED]->(:Movie)<-[:RATED]-(u2) // now recreate the paths between the users
      RETURN p, cp

// Conta il numero di voti dati dall'utente 1, con la relativa media, raggruppando per genere
// 
MATCH (u:User {userId: "1"})-[r:RATED]->(:Movie)-[:GENRE]->(g:Genre) // partendo dall'utente 1, trova tutti i film votati e relativo genere
RETURN count(r) AS ratesCount, //conta il numero di voti
       avg(toInteger(r.rating)) as ratesAvg, //calcola la media
       g.name
 ORDER BY ratesCount DESC, //ordina i risultati per numero di voti e media
          ratesAvg DESC

// Come prima, ma aggiungiamo un po' di formule matematiche
// 
MATCH (u:User {userId: "1"})-[r:RATED]->(:Movie)-[:GENRE]->(g:Genre) 
 WITH u, 
      count(r) AS ratesCount,
      max(r.time) as lastT, 
      avg(toInteger(r.rating)) as ratesAvg, 
      g.name as genre
RETURN u.age, ratesCount, ratesAvg, genre, datetime({epochSeconds: lastT}), //aggiungiamo un po' di valori di ritorno
       log10(ratesCount) * ratesAvg as score //ed un po' di calcoli come se fosse un punteggio
ORDER BY score DESC, lastT DESC //ordiniamo per score

// Trova l'utente con il maggior numero di match, in termini di voti a film, con l'utente 1,
// poi trova 10 film che questo utente ha valutato maggiormente ma che l'utente 1 ancora non ha valutato
//
MATCH (u1:User { userId: "1" })-[r1:RATED]->(:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating AND u2 <> u1
WITH u1, u2, COUNT(*) as cp
	WHERE cp > 1 //i due utenti devono avere almeno un film in comune
	WITH u1, u2, cp ORDER BY cp DESC LIMIT 1 //Prendi l'utente con il maggior numero di match
		MATCH (m:Movie)<-[r3:RATED]-(u2)
		MATCH (m) WHERE NOT (u1)-[:RATED]->(m:Movie) //Seleziona i film visti dal secondo utente che l'utente 1 non ha visto ancora
		RETURN cp, u1.userId, u2.userId, m.movieId, m.name, r3.rating
		ORDER BY r3.rating DESC //ordina per punteggio assegnato dall'utente 2
		LIMIT 10

// Aggiungiamo un ordinamento per data di valutazione
// 
MATCH (u1:User { userId: "1" })-[r1:RATED]->(:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating AND u2 <> u1
WITH u1, u2, COUNT(*) as cp
	WHERE cp > 1 //at least one 
	WITH u1, u2, cp ORDER BY cp DESC LIMIT 1
		MATCH (m:Movie)<-[r3:RATED]-(u2)
		MATCH (m) WHERE NOT (u1)-[:RATED]->(m:Movie)
		RETURN cp, u1.userId, u2.userId, m.movieId, m.name, r3.rating, datetime({epochSeconds: r3.time})
		ORDER BY r3.rating DESC, r3.time DESC
		LIMIT 10

// Esempio di formattazione con la procedura "apoc.date.format"
MATCH (u:User {userId: "1"})-[r:RATED]->(:Movie)-[:GENRE]->(g:Genre)
WITH count(r) AS ratesCount, max(r.time) as lastT, avg(toInteger(r.rating)) as ratesAvg, g.name as genre
RETURN ratesCount, ratesAvg, genre, apoc.date.format(lastT, 's', 'dd/MM/yyyy HH:mm') AS lastRated, //formatta la data
       log10(ratesCount) * ratesAvg as score //calcola il punteggio
ORDER BY score DESC, lastT DESC

// Query per top 10 utenti che hanno votato maggiormente Action movies.
// > Top 10 amanti degli action movies
MATCH (g:Genre { name: 'Action'})-[:GENRE]-(:Movie)-[r:RATED]-(u:User)
RETURN SUM(r.rating) as s, COUNT(*) AS c, AVG(r.rating) AS avg, u.userId, u.age, u.gender
ORDER BY avg DESC, s DESC, c DESC
LIMIT 10

// Versione generalizzata della query precedente: Query dei 10 utenti che hanno dato più voti per genere.
// > Trova i maggiori "amanti" dei vari generi
MATCH (g:Genre)-[:GENRE]-(:Movie)-[r:RATED]-(u:User)
RETURN g.name, SUM(r.rating) as s, COUNT(*) AS c, AVG(r.rating) AS avg, u.userId, u.age, u.gender
ORDER BY avg DESC, s DESC, c DESC
LIMIT 10

// Vediamo un po' di statistiche dei voti assegnati dalle donne, organizzati per genere 
MATCH (:User { gender: 'F' })-[r:RATED]->(:Movie)-[:GENRE]-(g:Genre)
RETURN g.name, SUM(r.rating) as s, COUNT(*) AS c, AVG(r.rating) AS avg
ORDER BY avg DESC, s DESC, c DESC
LIMIT 10

// Trova tre possibili "amici" dell'utente 1, cercando quelli con più match nei voti
MATCH (:User {userId: "1"})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating
	WITH count(m) as cm, u2
		ORDER BY cm desc
		LIMIT 3
		RETURN u2, cm

// Stessa query ma ritorna anche i film
MATCH (u1:User {userId: "1"})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
WHERE r1.rating = r2.rating
	WITH u1, count(m) as cm, u2
		ORDER BY cm desc
		LIMIT 3
			WITH u1, u2
			MATCH (u1)-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2)
      WHERE r1.rating = r2.rating
			RETURN u1, m, u2
