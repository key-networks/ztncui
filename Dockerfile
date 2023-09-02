FROM docker.io/node:slim as base
COPY src /app/src
RUN apt update && apt install -yqq curl gnupg2 && curl -s https://install.zerotier.com/ | bash && cd /var/lib/zerotier-one/ && rm authtoken.secret planet  zerotier-one.pid  zerotier-one.port identity.secret identity.public

FROM base as dependencies
WORKDIR /app/src
RUN apt-get install -y build-essential python3 && npm install -g node-gyp && npm install

FROM base as runtime
COPY src /app/
COPY --from=dependencies /app/src/node_modules /app/src/node_modules
EXPOSE 3000
RUN mv /app/src/etc/default.passwd /app/src/etc/passwd
WORKDIR /app/src/
CMD zerotier-one -d && npm start

# TODO
# - remove cache and trash

