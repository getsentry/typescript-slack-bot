#!/bin/sh

args="
  --allow-unauthenticated \
  --project=sentry-dev-tooling \
  --runtime=nodejs10 \
  --trigger-http \
  --memory=128MB \
  "

gcloud functions deploy events $args --set-env-vars=SLACK_SECRET="${SLACK_SECRET}",SLACK_ACCESS_TOKEN="${SLACK_ACCESS_TOKEN}"
gcloud functions deploy stats $args --set-env-vars=SLACK_SECRET="${SLACK_SECRET}",SLACK_ACCESS_TOKEN="${SLACK_ACCESS_TOKEN}"
