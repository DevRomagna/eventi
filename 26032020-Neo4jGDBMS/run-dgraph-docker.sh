# run DGraph standalone v1.2.1
docker run \
  --name dgraph \
  --rm -it \
  -p 8000:8000 \
  -p 8080:8080 \
  -p 9080:9080 \
  dgraph/standalone:v1.2.1
