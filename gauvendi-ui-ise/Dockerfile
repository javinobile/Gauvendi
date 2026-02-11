FROM registry.gitlab.com/hcg-openhub/hcg-hub/hcg-nginx:alpine
RUN for i in $( ls ./dist/gauvendi-ise-v2/*.js ); do mv $i $i?$RANDOM; done
RUN for i in $( ls ./dist/gauvendi-ise-v2/*.js.gz ); do mv $i $i?$RANDOM; done
COPY ./dist/gauvendi-ise-v2 /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
