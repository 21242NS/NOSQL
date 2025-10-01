
FROM python:3.11-slim

WORKDIR /app


COPY Exo4.py . 
COPY requirements.txt .


RUN pip install --no-cache-dir -r requirements.txt


EXPOSE 5000


CMD ["python", "Exo4.py"]