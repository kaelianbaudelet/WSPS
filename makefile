up:
	docker-compose --env-file .env.docker up -d

down:
	docker-compose --env-file .env.docker down
