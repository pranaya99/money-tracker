.PHONY: dev up down clean

dev: up

up:
	docker compose up --build

down:
	docker compose down -v

clean: down
	rm -rf web/.next web/node_modules
