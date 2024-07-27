# rag_app_prod_example
Building RAG without Langchain 

I will try to build a rag without using langchain. 
I will try to push the project further and apply some evaluation and testing. As would i do in a production level project.



build docker
docker-compose build
docker-compose up --build
docker-compose down

run postgresql 
docker-compose exec database psql -U application -d application