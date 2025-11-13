#!/bin/bash

DOCKER_CONTAINER_NAME="sequoia"
DOCKER_IMAGE="sequoia"

function showHelp {
  echo "Usage: \$ $0 [COMMAND]"
  echo
  echo "Commands:"
  echo "build-image                 build the docker image"
  echo "start                       runs a docker container based on the image"
  echo "build                       build the assets for production"
  echo "help                        show this help message and exit"
  echo
  echo "Flags:"
  echo
  echo "-t DOCKER_IMAGE             a docker image name"
  echo "                            defaults to adf-ng"
  exit 1
}

function stopDockerContainerIfItExists {
  echo "Stop any running docker containers of the name $DOCKER_CONTAINER_NAME..."
  docker stop $DOCKER_CONTAINER_NAME || true
  docker rm $DOCKER_CONTAINER_NAME || true
}

function buildDockerContainer {
  echo "Building docker container..."
  docker build -t $DOCKER_IMAGE .
}

function startDockerContainer {
  stopDockerContainerIfItExists

  if [[ "$(docker images -q $DOCKER_IMAGE 2>/dev/null)" == "" ]]; then
    echo "Building the container first... "
    buildDockerContainer
    startDockerContainer
  else
    echo "Starting docker container..."
    docker run --rm -it -p 9001:9001 -v "$(pwd)/src":/app/src $DOCKER_IMAGE
  fi
}

function buildAssets {
  if [[ "$(docker images -q $DOCKER_IMAGE 2>/dev/null)" == "" ]]; then
    echo "Building the container first... "
    buildDockerContainer
    buildAssets
  else
    echo "Starting docker container..."
    docker run --rm -it -v "$(pwd)/src":/app/src -v "$(pwd)/dist":/app/dist $DOCKER_IMAGE gulp build
  fi
}

if [[ $1 == "build-image" ]]; then
  COMMAND="buildDockerContainer"
elif [[ $1 == "start" ]]; then
  COMMAND="startDockerContainer"
elif [[ $1 == "build" ]]; then
  COMMAND="buildAssets"
elif [[ $1 == "help" ]]; then
  COMMAND="showHelp"
else
  COMMAND="showHelp"
fi

shift

while getopts t:f:e:p:d: FLAG; do
  case "${FLAG}" in
  t) DOCKER_IMAGE=${OPTARG} ;;
  esac
done
shift "$(($OPTIND - 1))"

$COMMAND
