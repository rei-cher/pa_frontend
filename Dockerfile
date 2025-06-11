FROM node:18-alpine

WORKDIR /app

# Install dependencies and build Tailwind CSS
COPY package*.json ./
RUN npm install
COPY src/styles/tailwind.css ./src/styles/
RUN npx tailwindcss -i ./src/styles/tailwind.css -o ./public/css/styles.css

# Copy the rest of the front-end code
COPY . .

# Expose and start
EXPOSE 3000
CMD ["npm", "start"]