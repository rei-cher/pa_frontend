#!/bin/bash

docker compose down
docker rmi pa_frontend-pa_frontend
docker compose up -d
