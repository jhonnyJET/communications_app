#!/usr/bin/env bash

# 0. capturing arguments...
while getopts "v:a:" flag
do
    case "${flag}" in
        v) version=$OPTARG;;
        a) arch=$OPTARG;;
    esac
done

echo "Version: $version";
echo "Arch: $arch";

# 4. Build image 
podman build . -t docker.io/jhonnyvennom/communications_app:${version}-${arch} -f communications_app_image/.docker/Dockerfile

# 4. Publish image 
podman push docker.io/jhonnyvennom/communications_app:${version}-${arch}
