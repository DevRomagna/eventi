#ci spostiamo nella home
cd ~
#impostiamo la directory di base per la persistenza (creare la directory se non esiste)
USER_N4J_HOME=~/dockerpersistence/neo4j
#lanciamo il container docker
docker run \
	--name neo4j \
	--rm \
	--publish=7473:7473 \
	--publish=7474:7474 \
	--publish=7687:7687 \
	--publish=80:7474 \
	--publish=8080:7687 \
	-v $USER_N4J_HOME/data:/data \
	-v $USER_N4J_HOME/logs:/logs \
	-v $USER_N4J_HOME/import:/import \
	-v $USER_N4J_HOME/plugins:/plugins \
	-v $USER_N4J_HOME/conf:/var/lib/neo4j/conf \
	-e NEO4J_dbms_security_procedures_unrestricted=apoc.\\\* \
	-e NEO4J_apoc_export_file_enabled=true \
	-e NEO4J_apoc_import_file_enabled=true \
	-e NEO4J_apoc_import_file_use__neo4j__config=true \
	-e dbms.allow_upgrade=true \
	--env=NEO4J_dbms_memory_heap_initial__size=512m --env=NEO4J_dbms_memory_heap_max__size=2G \
	neo4j:4.0.0