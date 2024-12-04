docker build --platform linux/amd64 -t jomiy/uploader .

docker pushjomiy/uploader


# with builder

# create buildx

docker buildx create --use

# push to docker hub
docker buildx build --platform linux/amd64,linux/arm64 -t jomiy/uploader --push .