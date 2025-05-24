# Use official Node.js image
FROM node:18

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory
WORKDIR /app

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy Python dependencies
COPY ML/BedtimePredict/requirements.txt ./ML/BedtimePredict/requirements.txt
RUN pip3 install -r ML/BedtimePredict/requirements.txt

# Copy the entire project
COPY . .

# Expose the port the app runs on
EXPOSE 5005

# Run the Node.js app
CMD ["node", "index.js"]
