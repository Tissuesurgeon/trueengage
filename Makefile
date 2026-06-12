.PHONY: install build dev db docker contracts-test contracts-deploy

install:
	pnpm install

build:
	pnpm build

dev:
	pnpm dev

db:
	pnpm db:push

docker:
	docker compose -f docker/docker-compose.yml up postgres -d

contracts-test:
	pnpm contracts:test

contracts-deploy:
	pnpm contracts:deploy
