# Use Node.js base image
FROM node:18

# Install Python and venv
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    apt-get clean

# Set working directory
WORKDIR /app

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy Python requirements and create a virtual environment
COPY ML/BedtimePredict/requirements.txt ./ML/BedtimePredict/requirements.txt
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --upgrade pip && \
    /app/venv/bin/pip install -r ML/BedtimePredict/requirements.txt

# Copy the entire project
COPY . .

# Set environment variables
ENV VIRTUAL_ENV=/app/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Expose the backend port
EXPOSE 5000

# Start Node.js server
CMD ["node", "index.js"]
