# Use a lightweight Python image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Match the port the application actually listens on
EXPOSE 5000

# Start the server listening on 0.0.0.0:5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]