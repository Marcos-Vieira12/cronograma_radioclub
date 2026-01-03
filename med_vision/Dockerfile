FROM node:20 AS build
WORKDIR /app

COPY med_vision/package*.json ./
RUN npm install

COPY med_vision ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
