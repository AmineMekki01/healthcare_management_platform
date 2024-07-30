FROM python:3.11.5
RUN pip install --no-cache-dir --upgrade pip
WORKDIR /project
COPY ./requirements/requirements-dev.txt /project/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /project/requirements.txt
COPY . /project
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
