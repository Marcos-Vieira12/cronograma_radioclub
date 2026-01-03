# Etapa de build
FROM node:20 AS build
WORKDIR /app

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend ./
RUN npm run build

# Servir com nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
