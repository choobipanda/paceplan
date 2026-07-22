from fastapi import FastAPI

app = FastAPI(title="PacePlan API")


@app.get("/")
def read_root():
    return {"message": "PacePlan API is running"}