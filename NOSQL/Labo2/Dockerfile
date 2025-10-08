
FROM python:3.11-slim

WORKDIR /app


COPY Exo4.py . 
COPY requirements.txt .
COPY cache.py .
COPY test_exo4.py .


RUN pip install --no-cache-dir -r requirements.txt


EXPOSE 5000


CMD ["python", "Exo4.py"]